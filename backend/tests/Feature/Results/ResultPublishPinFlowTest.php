<?php

namespace Tests\Feature\Results;

use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Enrollment;
use App\Models\ResultPublication;
use App\Models\SchoolClass;
use App\Models\Term;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class ResultPublishPinFlowTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_publish_issues_pin_and_public_checker_returns_report(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership] = $this->makeTenantUser('examination_officer');

        $context = app(TenantContext::class);
        $context->set($tenant, $membership);

        try {
            $session = AcademicSession::query()->create([
                'name' => '2026/2027',
                'starts_at' => '2026-09-01',
                'ends_at' => '2027-07-31',
                'is_current' => true,
                'status' => 'active',
            ]);

            $term = Term::query()->create([
                'academic_session_id' => $session->getKey(),
                'name' => 'First Term',
                'sequence' => 1,
                'starts_at' => '2026-09-01',
                'ends_at' => '2026-12-15',
                'is_current' => true,
            ]);

            $class = SchoolClass::query()->create([
                'name' => 'JSS 1',
                'arm' => 'A',
                'status' => 'active',
            ]);

            $student = $this->makeStudentForTenant($tenant, [
                'admission_number' => 'ADM-PIN-001',
                'first_name' => 'Ada',
                'last_name' => 'Okafor',
            ]);

            $context->set($tenant, $membership);

            Enrollment::query()->create([
                'student_id' => $student->getKey(),
                'class_id' => $class->getKey(),
                'academic_session_id' => $session->getKey(),
                'status' => 'active',
            ]);

            $publication = ResultPublication::query()->create([
                'student_id' => $student->getKey(),
                'academic_session_id' => $session->getKey(),
                'term_id' => $term->getKey(),
                'status' => 'locked',
                'locked_at' => now(),
            ]);
        } finally {
            $context->clear();
        }

        $publish = $this->actingAsTenantUser($user, $tenant)
            ->postJson(
                "/api/v1/results/{$publication->public_id}/actions/publish",
                [],
                ['Idempotency-Key' => 'result-publish-'.Str::uuid()],
            );

        $publish->assertSuccessful();
        $publish->assertJsonPath('data.status', 'published');
        $issuedPin = $publish->json('data.issuedPin');
        $this->assertIsString($issuedPin);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{4}-\d{4}$/', $issuedPin);

        $check = $this->postJson('/api/v1/public/results/check', [
            'admissionNumber' => 'ADM-PIN-001',
            'session' => '2026/2027',
            'term' => 'First Term',
            'pin' => $issuedPin,
        ]);

        $check->assertSuccessful();
        $check->assertJsonPath('data.schoolName', $tenant->name);
        $viewToken = $check->json('data.viewToken');
        $this->assertIsString($viewToken);
        $this->assertSame(64, strlen($viewToken));

        $view = $this->getJson('/api/v1/public/results/view?token='.$viewToken);

        $view->assertSuccessful();
        $view->assertJsonPath('data.publicationId', $publication->public_id);
        $view->assertJsonPath('data.student.admissionNumber', 'ADM-PIN-001');
        $view->assertJsonPath('data.session', '2026/2027');
        $view->assertJsonPath('data.term', 'First Term');
        $this->assertIsArray($view->json('data.subjects'));
    }

    public function test_bulk_publish_locked_results_issues_pins(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership] = $this->makeTenantUser('examination_officer');

        $context = app(TenantContext::class);
        $context->set($tenant, $membership);

        try {
            $session = AcademicSession::query()->create([
                'name' => '2026/2027',
                'starts_at' => '2026-09-01',
                'ends_at' => '2027-07-31',
                'is_current' => true,
                'status' => 'active',
            ]);

            $term = Term::query()->create([
                'academic_session_id' => $session->getKey(),
                'name' => 'First Term',
                'sequence' => 1,
                'starts_at' => '2026-09-01',
                'ends_at' => '2026-12-15',
                'is_current' => true,
            ]);

            $students = [
                $this->makeStudentForTenant($tenant, [
                    'admission_number' => 'ADM-BULK-001',
                    'first_name' => 'Chidi',
                    'last_name' => 'Nwosu',
                ]),
                $this->makeStudentForTenant($tenant, [
                    'admission_number' => 'ADM-BULK-002',
                    'first_name' => 'Bola',
                    'last_name' => 'Ade',
                ]),
            ];

            $context->set($tenant, $membership);

            $ids = [];
            foreach ($students as $student) {
                $publication = ResultPublication::query()->create([
                    'student_id' => $student->getKey(),
                    'academic_session_id' => $session->getKey(),
                    'term_id' => $term->getKey(),
                    'status' => 'locked',
                    'locked_at' => now(),
                ]);
                $ids[] = $publication->public_id;
            }
        } finally {
            $context->clear();
        }

        $response = $this->actingAsTenantUser($user, $tenant)
            ->postJson(
                '/api/v1/results/bulk-publish',
                ['ids' => $ids],
                ['Idempotency-Key' => 'result-bulk-'.Str::uuid()],
            );

        $response->assertSuccessful();
        $response->assertJsonPath('data.published', 2);
        $response->assertJsonPath('data.failed', 0);
        $this->assertCount(2, $response->json('data.items'));
        $this->assertNotEmpty($response->json('data.items.0.issuedPin'));
        $this->assertNotEmpty($response->json('data.items.1.issuedPin'));
    }

    public function test_invalid_pin_is_rejected(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership] = $this->makeTenantUser('examination_officer');

        $context = app(TenantContext::class);
        $context->set($tenant, $membership);

        try {
            $session = AcademicSession::query()->create([
                'name' => '2026/2027',
                'starts_at' => '2026-09-01',
                'ends_at' => '2027-07-31',
                'is_current' => true,
                'status' => 'active',
            ]);

            $term = Term::query()->create([
                'academic_session_id' => $session->getKey(),
                'name' => 'First Term',
                'sequence' => 1,
                'starts_at' => '2026-09-01',
                'ends_at' => '2026-12-15',
                'is_current' => true,
            ]);

            $student = $this->makeStudentForTenant($tenant, [
                'admission_number' => 'ADM-BAD-001',
            ]);

            $context->set($tenant, $membership);

            $publication = ResultPublication::query()->create([
                'student_id' => $student->getKey(),
                'academic_session_id' => $session->getKey(),
                'term_id' => $term->getKey(),
                'status' => 'locked',
                'locked_at' => now(),
            ]);
        } finally {
            $context->clear();
        }

        $publish = $this->actingAsTenantUser($user, $tenant)
            ->postJson(
                "/api/v1/results/{$publication->public_id}/actions/publish",
                [],
                ['Idempotency-Key' => 'result-badpin-'.Str::uuid()],
            );
        $publish->assertSuccessful();

        $check = $this->postJson('/api/v1/public/results/check', [
            'admissionNumber' => 'ADM-BAD-001',
            'session' => '2026/2027',
            'term' => 'First Term',
            'pin' => '0000-0000-0000',
        ]);

        $check->assertStatus(404);
        $check->assertJsonPath('error.code', 'RESULT_NOT_VERIFIED');
    }
}
