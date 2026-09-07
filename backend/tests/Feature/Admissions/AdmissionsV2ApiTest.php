<?php

namespace Tests\Feature\Admissions;

use App\Domain\Admissions\ApplicationStatus;
use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\AdmissionDocument;
use App\Models\Permission;
use App\Models\SchoolClass;
use App\Models\Tenant;
use App\Models\TenantMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class AdmissionsV2ApiTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    public function test_supported_lifecycle_actions_create_connected_records(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership] = $this->makeTenantUser('admission_officer');
        [, $class] = $this->academicContext($tenant, $membership);
        $this->actingAsTenantUser($user, $tenant);

        $application = $this->postJson('/api/v1/admissions/applications', [
            'firstName' => 'Ada',
            'lastName' => 'Obi',
            'gender' => 'female',
            'dateOfBirth' => '2014-04-02',
            'guardianName' => 'Ngozi Obi',
            'guardianPhone' => '+2348000000001',
            'status' => 'submitted',
        ], $this->idempotency())->assertCreated()->json('data');

        $id = $application['id'];
        $this->postJson("/api/v1/admissions/applications/{$id}/screenings", [
            'status' => 'scheduled',
            'scheduledAt' => now()->addDay()->toIso8601String(),
        ], $this->idempotency())->assertCreated()->assertJsonPath('data.application.status', 'screening');

        $this->postJson("/api/v1/admissions/applications/{$id}/screenings", [
            'status' => 'passed',
            'score' => 81,
        ], $this->idempotency())->assertCreated()->assertJsonPath('data.application.status', 'screened');

        $this->postJson("/api/v1/admissions/applications/{$id}/decision", [
            'decision' => 'offered',
            'offeredClassId' => $class->public_id,
        ], $this->idempotency())->assertCreated()->assertJsonPath('data.application.status', 'offered');

        $this->postJson("/api/v1/admissions/applications/{$id}/transitions", [
            'status' => 'accepted',
        ], $this->idempotency())->assertOk()->assertJsonPath('data.status', 'accepted');

        $this->assertDatabaseCount('admission_screenings', 2);
        $this->assertDatabaseCount('admission_decisions', 1);
        $this->assertDatabaseHas('admission_applications', ['public_id' => $id, 'status' => 'accepted']);
    }

    public function test_invalid_lifecycle_transition_is_rejected(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership] = $this->makeTenantUser('admission_officer');
        $application = $this->application($tenant, $membership, ['status' => ApplicationStatus::Draft]);
        $this->actingAsTenantUser($user, $tenant);

        $this->postJson("/api/v1/admissions/applications/{$application->public_id}/transitions", [
            'status' => 'accepted',
        ], $this->idempotency())
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'INVALID_ADMISSION_TRANSITION');
    }

    public function test_overview_is_real_zero_safe_and_tenant_scoped(): void
    {
        ['tenant' => $tenantA, 'user' => $userA, 'membership' => $membershipA] = $this->makeTenantUser('admission_officer');
        ['tenant' => $tenantB, 'membership' => $membershipB] = $this->makeTenantUser('admission_officer');
        $this->application($tenantA, $membershipA, ['status' => ApplicationStatus::Submitted, 'submitted_at' => now()]);
        $this->application($tenantA, $membershipA, ['status' => ApplicationStatus::Accepted]);
        $this->application($tenantB, $membershipB, ['status' => ApplicationStatus::Rejected]);
        $this->actingAsTenantUser($userA, $tenantA);

        $this->getJson('/api/v1/admissions/overview')
            ->assertOk()
            ->assertJsonPath('data.metrics.0.value', 2)
            ->assertJsonPath('data.metrics.1.value', 1)
            ->assertJsonPath('data.conversion.converted', 0)
            ->assertJsonPath('data.conversion.rate', 0);
    }

    public function test_application_public_ids_are_bola_safe_and_permissions_are_action_specific(): void
    {
        ['tenant' => $tenantA, 'membership' => $membershipA] = $this->makeTenantUser('admission_officer');
        ['tenant' => $tenantB, 'user' => $userB] = $this->makeTenantUser('admission_officer');
        ['tenant' => $teacherTenant, 'user' => $teacher] = $this->makeTenantUser('teacher');
        $application = $this->application($tenantA, $membershipA);

        $this->actingAsTenantUser($userB, $tenantB)
            ->getJson("/api/v1/admissions/applications/{$application->public_id}")
            ->assertNotFound();

        $this->actingAsTenantUser($teacher, $teacherTenant)
            ->getJson('/api/v1/admissions/overview')
            ->assertForbidden();
    }

    public function test_view_grant_does_not_authorize_screening_actions(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership, 'role' => $role] = $this->makeTenantUser('admission_officer');
        $application = $this->application($tenant, $membership, ['status' => ApplicationStatus::Submitted]);
        $role->permissions()->sync([
            Permission::query()->where('name', 'admissions.application.view')->value('id'),
        ]);
        $this->actingAsTenantUser($user, $tenant)
            ->getJson('/api/v1/admissions/applications')
            ->assertOk();

        $this->postJson("/api/v1/admissions/applications/{$application->public_id}/screenings", [
            'status' => 'scheduled',
        ], $this->idempotency())->assertForbidden();
    }

    public function test_applicant_documents_use_private_tenant_paths_and_are_isolated(): void
    {
        Storage::fake('local');
        config()->set('skuggle.library.disk', 'local');
        ['tenant' => $tenantA, 'user' => $userA, 'membership' => $membershipA] = $this->makeTenantUser('admission_officer');
        ['tenant' => $tenantB, 'user' => $userB] = $this->makeTenantUser('admission_officer');
        $application = $this->application($tenantA, $membershipA);
        $this->actingAsTenantUser($userA, $tenantA);

        $documentId = $this->postJson(
            "/api/v1/admissions/applications/{$application->public_id}/documents",
            ['documentType' => 'birth_certificate', 'file' => UploadedFile::fake()->create('birth.pdf', 120, 'application/pdf')],
            $this->idempotency(),
        )->assertCreated()->json('data.id');

        $document = AdmissionDocument::query()->withoutGlobalScopes()->where('public_id', $documentId)->firstOrFail();
        $this->assertStringStartsWith("tenants/{$tenantA->public_id}/private/admissions/{$application->public_id}/", $document->storage_key);
        Storage::disk('local')->assertExists($document->storage_key);

        $this->actingAsTenantUser($userB, $tenantB)
            ->getJson("/api/v1/admissions/applications/{$application->public_id}/documents/{$documentId}/download")
            ->assertNotFound();
    }

    public function test_csv_import_is_validated_and_creates_typed_applications_atomically(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('admission_officer');
        $this->actingAsTenantUser($user, $tenant);
        $file = UploadedFile::fake()->createWithContent(
            'applications.csv',
            "first_name,last_name,gender,date_of_birth,guardian_name,guardian_phone\n".
            "Ada,Obi,female,2014-04-02,Ngozi Obi,+2348000000001\n".
            "Kofi,Mensah,male,2013-09-15,Ama Mensah,+233200000001\n",
        );

        $this->withHeaders($this->idempotency())
            ->post('/api/v1/admissions/applications/import', ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('data.imported', 2);

        $this->assertDatabaseCount('admission_applications', 2);
        $this->assertDatabaseCount('admission_workflow_history', 2);
        $this->assertDatabaseHas('admission_applications', ['first_name' => 'Ada', 'status' => 'submitted']);
    }

    public function test_conversion_is_transactional_and_exactly_once(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership] = $this->makeTenantUser('admission_officer');
        [$session, $class] = $this->academicContext($tenant, $membership);
        $application = $this->application($tenant, $membership, [
            'status' => ApplicationStatus::Accepted,
            'gender' => 'female',
            'date_of_birth' => '2014-04-02',
            'guardian_name' => 'Ngozi Obi',
            'guardian_phone' => '+2348000000009',
            'requested_class_id' => $class->getKey(),
        ]);
        $this->actingAsTenantUser($user, $tenant);
        $headers = $this->idempotency();

        $first = $this->postJson("/api/v1/admissions/applications/{$application->public_id}/convert", [
            'academicSessionId' => $session->public_id,
        ], $headers)->assertCreated();
        $this->postJson("/api/v1/admissions/applications/{$application->public_id}/convert", [
            'academicSessionId' => $session->public_id,
        ], $headers)->assertCreated()->assertJsonPath('data.studentId', $first->json('data.studentId'));

        $this->assertDatabaseCount('admission_conversions', 1);
        $this->assertDatabaseCount('students', 1);
        $this->assertDatabaseCount('enrollments', 1);
        $this->assertDatabaseHas('admission_applications', ['id' => $application->getKey(), 'status' => 'enrolled']);
    }

    public function test_settings_keep_one_active_cycle_and_are_tenant_scoped(): void
    {
        ['tenant' => $tenantA, 'user' => $userA] = $this->makeTenantUser('admission_officer');
        ['tenant' => $tenantB, 'user' => $userB] = $this->makeTenantUser('admission_officer');
        $this->actingAsTenantUser($userA, $tenantA);

        $first = $this->putJson('/api/v1/admissions/settings/cycle', [
            'name' => '2026 Intake', 'status' => 'active', 'currency' => 'NGN', 'applicationFeeMinor' => 2500000,
        ], $this->idempotency())->assertCreated()->json('data.id');
        $this->putJson('/api/v1/admissions/settings/cycle', [
            'name' => '2027 Intake', 'status' => 'active', 'currency' => 'NGN', 'applicationFeeMinor' => 3000000,
        ], $this->idempotency())->assertCreated();

        $this->assertDatabaseHas('admission_cycles', ['public_id' => $first, 'status' => 'closed']);
        $this->actingAsTenantUser($userB, $tenantB)
            ->getJson('/api/v1/admissions/settings')
            ->assertOk()
            ->assertJsonCount(0, 'data.cycles');
    }

    /** @return array{AcademicSession, SchoolClass} */
    private function academicContext(Tenant $tenant, TenantMembership $membership): array
    {
        $context = app(TenantContext::class);
        $context->set($tenant, $membership);
        $session = AcademicSession::query()->create([
            'name' => '2026/2027', 'starts_at' => '2026-09-01', 'ends_at' => '2027-07-31',
            'is_current' => true, 'status' => 'active',
        ]);
        $class = SchoolClass::query()->create(['name' => 'JSS 1', 'arm' => 'A', 'status' => 'active']);
        $context->clear();

        return [$session, $class];
    }

    private function application(Tenant $tenant, TenantMembership $membership, array $overrides = []): AdmissionApplication
    {
        $context = app(TenantContext::class);
        $context->set($tenant, $membership);
        $application = AdmissionApplication::query()->create(array_merge([
            'reference' => 'APP-'.Str::upper(Str::random(10)),
            'status' => ApplicationStatus::Draft,
            'first_name' => 'Ada',
            'last_name' => 'Obi',
            'status_changed_at' => now(),
        ], $overrides));
        $context->clear();

        return $application;
    }

    /** @return array<string, string> */
    private function idempotency(): array
    {
        return ['Idempotency-Key' => (string) Str::uuid()];
    }
}
