<?php

namespace Tests\Feature\Security;

use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Campus;
use App\Models\Employee;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\TeacherProfile;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class TeacherAssignmentTenantIntegrityTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    private array $actor;

    private User $teacher;

    private SchoolClass $class;

    private Subject $subject;

    private AcademicSession $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actor = $this->makeTenantUser('school_admin');
        $teacherAccount = $this->makeUserInTenant($this->actor['tenant'], 'teacher');
        $this->teacher = $teacherAccount['user'];
        $this->withTenant($this->actor['tenant'], function (): void {
            $campus = Campus::query()->create(['name' => 'Main', 'code' => 'MAIN', 'status' => 'active']);
            $this->class = SchoolClass::query()->create(['campus_id' => $campus->getKey(), 'name' => 'JSS 1', 'arm' => 'A', 'status' => 'active']);
            $this->subject = Subject::query()->create(['name' => 'Mathematics', 'code' => 'MATH', 'status' => 'active']);
            DB::table('class_subject')->insert(['tenant_id' => $this->actor['tenant']->getKey(), 'class_id' => $this->class->getKey(), 'subject_id' => $this->subject->getKey()]);
            $this->session = AcademicSession::query()->create(['name' => '2026/27', 'starts_at' => '2026-09-01', 'ends_at' => '2027-07-31', 'is_current' => true, 'status' => 'active']);
            $employee = Employee::query()->create(['user_id' => $this->teacher->getKey(), 'employee_number' => 'T-001', 'name' => $this->teacher->name, 'employment_type' => 'full_time', 'status' => 'active']);
            TeacherProfile::query()->create(['employee_id' => $employee->getKey()]);
        });
    }

    public function test_valid_same_tenant_teacher_can_be_assigned(): void
    {
        $this->postAssignment($this->teacher->public_id, $this->class->public_id, $this->subject->public_id, $this->session->public_id)->assertCreated();
        $this->assertSame(1, TeacherAssignment::withoutGlobalScopes()->count());
    }

    public function test_user_only_in_another_tenant_is_rejected(): void
    {
        $foreign = $this->makeTenantUser('teacher');
        $this->postAssignment($foreign['user']->public_id)->assertNotFound();
    }

    public function test_teacher_employee_from_another_tenant_is_rejected(): void
    {
        $foreign = $this->makeUserInTenant($this->actor['tenant'], 'teacher');
        $other = $this->makeTenantUser('school_admin');
        $this->withTenant($other['tenant'], function () use ($foreign): void {
            $employee = Employee::query()->create(['user_id' => $foreign['user']->getKey(), 'employee_number' => 'FOREIGN', 'name' => 'Foreign', 'employment_type' => 'full_time', 'status' => 'active']);
            TeacherProfile::query()->create(['employee_id' => $employee->getKey()]);
        });
        $this->postAssignment($foreign['user']->public_id)->assertNotFound();
    }

    public function test_inactive_and_revoked_memberships_are_rejected(): void
    {
        foreach (['inactive', 'revoked'] as $status) {
            $account = $this->makeUserInTenant($this->actor['tenant'], 'teacher', $status);
            $this->postAssignment($account['user']->public_id)->assertNotFound();
        }
    }

    public function test_foreign_class_subject_and_academic_session_are_rejected(): void
    {
        $other = $this->makeTenantUser('school_admin');
        $foreign = [];
        $this->withTenant($other['tenant'], function () use (&$foreign): void {
            $campus = Campus::query()->create(['name' => 'Other', 'code' => 'OTHER', 'status' => 'active']);
            $foreign['class'] = SchoolClass::query()->create(['campus_id' => $campus->getKey(), 'name' => 'JSS 2', 'status' => 'active']);
            $foreign['subject'] = Subject::query()->create(['name' => 'English', 'code' => 'ENG', 'status' => 'active']);
            $foreign['session'] = AcademicSession::query()->create(['name' => 'Other', 'starts_at' => '2026-09-01', 'ends_at' => '2027-07-31', 'status' => 'active']);
        });
        $this->postAssignment($this->teacher->public_id, $foreign['class']->public_id)->assertNotFound();
        $this->postAssignment($this->teacher->public_id, null, $foreign['subject']->public_id)->assertNotFound();
        $this->postAssignment($this->teacher->public_id, null, null, $foreign['session']->public_id)->assertNotFound();
    }

    public function test_subject_not_offered_by_class_is_rejected(): void
    {
        $subject = $this->withTenant($this->actor['tenant'], fn () => Subject::query()->create(['name' => 'French', 'code' => 'FR', 'status' => 'active']));
        $this->postAssignment($this->teacher->public_id, null, $subject->public_id)->assertUnprocessable();
    }

    public function test_manipulated_user_public_id_and_unauthorized_actor_are_rejected(): void
    {
        $this->postAssignment('01INVALIDPUBLICIDENTIFIER0000')->assertNotFound();
        $unauthorized = $this->makeTenantUser('parent');
        $this->actingAsTenantUser($unauthorized['user'], $unauthorized['tenant'])
            ->postJson('/api/v1/school-structure/teacher-allocations', [], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertForbidden();
    }

    private function postAssignment(string $userId, ?string $classId = null, ?string $subjectId = null, ?string $sessionId = null)
    {
        return $this->actingAsTenantUser($this->actor['user'], $this->actor['tenant'])
            ->postJson('/api/v1/school-structure/teacher-allocations', [
                'userId' => $userId,
                'classId' => $classId ?? $this->class->public_id,
                'subjectId' => $subjectId ?? $this->subject->public_id,
                'sessionId' => $sessionId ?? $this->session->public_id,
            ], ['Idempotency-Key' => (string) Str::uuid()]);
    }

    private function makeUserInTenant(Tenant $tenant, string $roleName, string $status = 'active'): array
    {
        $this->seedAccessControl();
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $membership = TenantMembership::query()->create(['tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(), 'role_id' => $role->getKey(), 'status' => $status, 'joined_at' => now()]);

        return compact('user', 'membership');
    }

    private function withTenant(Tenant $tenant, callable $callback): mixed
    {
        $context = app(TenantContext::class);
        $context->set($tenant);
        try {
            return $callback();
        } finally {
            $context->clear();
        }
    }
}
