<?php

namespace Tests\Feature\School;

use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Guardian;
use App\Models\SchoolClass;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class StudentEnrolmentTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    /** @return array{tenant: Tenant, user: User, membership: TenantMembership, session: AcademicSession, class: SchoolClass} */
    private function seedAcademicContext(string $role = 'school_admin'): array
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership] = $this->makeTenantUser($role);
        $context = app(TenantContext::class);
        $context->set($tenant, $membership);

        $session = AcademicSession::query()->create([
            'name' => '2026/2027',
            'starts_at' => now()->startOfYear(),
            'ends_at' => now()->endOfYear(),
            'is_current' => true,
            'status' => 'active',
        ]);

        $class = SchoolClass::query()->create([
            'name' => 'JSS 1',
            'arm' => 'A',
            'status' => 'active',
            'capacity' => 40,
        ]);

        return compact('tenant', 'user', 'membership', 'session', 'class');
    }

    public function test_student_can_be_enrolled_with_auto_generated_admission_number(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'session' => $session, 'class' => $class] = $this->seedAcademicContext();
        $this->actingAsTenantUser($user, $tenant);

        $response = $this->postJson('/api/v1/students', [
            'firstName' => 'Nathan',
            'lastName' => 'Bello',
            'gender' => 'male',
            'dateOfBirth' => '2012-03-15',
            'admissionDate' => now()->toDateString(),
            'classId' => $class->public_id,
            'academicSessionId' => $session->public_id,
            'guardians' => json_encode([[
                'name' => 'Dr. Ibrahim Bello',
                'relationship' => 'father',
                'phone' => '+2348031234567',
                'email' => 'ibrahim@example.com',
            ]]),
        ], ['Idempotency-Key' => (string) Str::uuid()]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.firstName', 'Nathan')
            ->assertJsonPath('data.lastName', 'Bello');

        $admissionNumber = $response->json('data.admissionNumber');
        $this->assertNotEmpty($admissionNumber);
        $this->assertDatabaseHas('students', [
            'tenant_id' => $tenant->getKey(),
            'admission_number' => $admissionNumber,
            'first_name' => 'Nathan',
            'status' => 'enrolled',
        ]);
    }

    public function test_admission_numbers_are_unique_per_tenant(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'class' => $class] = $this->seedAcademicContext();
        $this->actingAsTenantUser($user, $tenant);

        $numbers = [];
        for ($i = 0; $i < 3; $i++) {
            $response = $this->postJson('/api/v1/students', [
                'firstName' => "Student{$i}",
                'lastName' => 'Test',
                'gender' => 'male',
                'dateOfBirth' => '2012-01-01',
                'admissionDate' => now()->toDateString(),
                'classId' => $class->public_id,
                'guardians' => json_encode([['name' => 'Guardian', 'relationship' => 'father', 'phone' => "+234803123456{$i}"]]),
            ], ['Idempotency-Key' => (string) Str::uuid()]);
            $response->assertCreated();
            $numbers[] = $response->json('data.admissionNumber');
        }

        $this->assertCount(3, array_unique($numbers));
    }

    public function test_duplicate_detection_finds_matching_students(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin');
        $this->actingAsTenantUser($user, $tenant);

        $this->makeStudentForTenant($tenant, [
            'first_name' => 'Amina',
            'last_name' => 'Bello',
            'date_of_birth' => '2011-06-20',
            'admission_number' => 'TEST-001',
        ]);

        $response = $this->postJson('/api/v1/students/check-duplicates', [
            'firstName' => 'Amina',
            'lastName' => 'Bello',
            'dateOfBirth' => '2011-06-20',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.hasDuplicates', true)
            ->assertJsonCount(1, 'data.matches');
    }

    public function test_guardian_can_be_linked_instead_of_duplicated(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership, 'class' => $class] = $this->seedAcademicContext();
        $this->actingAsTenantUser($user, $tenant);

        $context = app(TenantContext::class);
        $context->set($tenant, $membership);

        $guardian = Guardian::query()->create([
            'name' => 'Existing Parent',
            'phone' => '+2348099999999',
            'email' => 'parent@example.com',
        ]);

        $response = $this->postJson('/api/v1/students', [
            'firstName' => 'Kemi',
            'lastName' => 'Ade',
            'gender' => 'female',
            'dateOfBirth' => '2013-04-10',
            'admissionDate' => now()->toDateString(),
            'classId' => $class->public_id,
            'guardians' => json_encode([[
                'guardianId' => $guardian->public_id,
                'relationship' => 'mother',
                'phone' => '+2348099999999',
            ]]),
        ], ['Idempotency-Key' => (string) Str::uuid()]);

        $response->assertCreated();
        $this->assertDatabaseCount('guardians', 1);
        $this->assertDatabaseHas('student_guardians', [
            'guardian_id' => $guardian->getKey(),
        ]);
    }

    public function test_draft_enrolment_can_be_saved_without_full_data(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->seedAcademicContext();
        $this->actingAsTenantUser($user, $tenant);

        $response = $this->postJson('/api/v1/students', [
            'firstName' => 'Draft',
            'lastName' => 'Student',
            'saveAsDraft' => true,
        ], ['Idempotency-Key' => (string) Str::uuid()]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_teacher_cannot_access_medical_information(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('teacher');
        $this->actingAsTenantUser($user, $tenant);

        $student = $this->makeStudentForTenant($tenant);

        $this->getJson("/api/v1/students/{$student->public_id}/medical")
            ->assertForbidden();
    }

    public function test_admission_number_preview_uses_configurable_pattern(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin');
        $tenant->update(['settings' => ['registration' => ['admission_number_pattern' => 'SKG-{YEAR}-{SEQUENCE:6}']]]);
        $this->actingAsTenantUser($user, $tenant);

        $response = $this->getJson('/api/v1/students/admission-number/preview');

        $response->assertOk()
            ->assertJsonPath('data.autoGenerated', true);

        $number = $response->json('data.admissionNumber');
        $this->assertStringStartsWith('SKG-'.now()->format('Y').'-', $number);
    }

    public function test_students_are_isolated_between_tenants(): void
    {
        ['tenant' => $tenantA, 'user' => $userA] = $this->makeTenantUser('school_admin');
        ['tenant' => $tenantB, 'user' => $userB] = $this->makeTenantUser('school_admin');

        $studentA = $this->makeStudentForTenant($tenantA, ['admission_number' => 'TENANT-A-001']);

        $this->actingAsTenantUser($userB, $tenantB);
        $this->getJson("/api/v1/students/{$studentA->public_id}")
            ->assertNotFound();
    }
}
