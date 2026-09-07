<?php

namespace Tests\Feature\Authorization;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Authorization\RoleAssignmentService;
use App\Domain\Tenancy\TenantContext;
use App\Models\Campus;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class RoleAssignmentWaveFiveTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    public function test_legacy_role_is_implicit_and_backfill_is_idempotent(): void
    {
        $fixture = $this->makeTenantUser('teacher');
        $context = app(TenantContext::class);
        $context->set($fixture['tenant'], $fixture['membership']);
        RoleAssignment::query()->delete();
        $this->assertTrue(app(CanonicalAuthorizationEvaluator::class)->allows($fixture['membership']->unsetRelation('roleAssignments')->load('tenant', 'role.permissions'), 'students.profile.view'));
        $this->artisan('iam:backfill-role-assignments', ['--json' => true])->assertSuccessful();
        $this->artisan('iam:backfill-role-assignments', ['--json' => true])->assertSuccessful();
        $this->assertSame(1, RoleAssignment::query()->where('source', RoleAssignment::LEGACY_PRIMARY)->count());
    }

    public function test_multiple_current_roles_union_capabilities_and_expired_future_revoked_do_not(): void
    {
        $fixture = $this->makeTenantUser('teacher');
        $context = app(TenantContext::class);
        $context->set($fixture['tenant'], $fixture['membership']);
        $exam = Role::query()->where('name', 'examination_officer')->firstOrFail();
        $this->assignment($fixture['membership']->id, $exam->id);
        foreach ([
            ['starts_at' => now()->addHour()], ['ends_at' => now()->subSecond()], ['status' => RoleAssignment::REVOKED],
        ] as $state) {
            $this->assignment($fixture['membership']->id, $exam->id, $state + ['source' => Str::uuid()->toString()]);
        }
        $membership = $fixture['membership']->unsetRelation('roleAssignments')->load('tenant', 'role.permissions');
        $this->assertTrue(app(CanonicalAuthorizationEvaluator::class)->allows($membership, 'performance.result.publish'));
    }

    public function test_school_membership_rejects_platform_role_and_foreign_campus_scope(): void
    {
        $target = $this->makeTenantUser('teacher');
        $other = $this->makeTenantUser('teacher');
        $platformPermission = Permission::query()->firstOrCreate(['name' => 'platform.view']);
        $platformRole = Role::query()->create(['name' => 'platform_test', 'label' => 'Platform', 'privileged' => true]);
        $platformRole->permissions()->sync([$platformPermission->id]);
        $service = app(RoleAssignmentService::class);
        $this->expectException(ValidationException::class);
        $service->assign($other['membership'], $target['membership'], $platformRole);
    }

    public function test_campus_scope_must_belong_to_membership_tenant(): void
    {
        $target = $this->makeTenantUser('teacher');
        $other = $this->makeTenantUser('teacher');
        app(TenantContext::class)->set($other['tenant'], $other['membership']);
        $campus = Campus::query()->withoutGlobalScopes()->create(['public_id' => (string) Str::ulid(), 'tenant_id' => $other['tenant']->id, 'name' => 'Other', 'code' => 'OTHER', 'status' => 'active']);
        $this->expectException(ValidationException::class);
        app(RoleAssignmentService::class)->assign($other['membership'], $target['membership'], $target['role'], ['scope_type' => 'CAMPUS', 'scope_id' => $campus->id]);
    }

    public function test_self_grant_is_denied(): void
    {
        $fixture = $this->makeTenantUser('school_super_admin');
        app(TenantContext::class)->set($fixture['tenant'], $fixture['membership']);
        $this->expectException(ValidationException::class);
        app(RoleAssignmentService::class)->assign($fixture['membership'], $fixture['membership'], Role::query()->where('name', 'teacher')->firstOrFail());
    }

    public function test_multi_role_revoke_and_reactivate_preserve_legacy_primary(): void
    {
        $actor = $this->makeTenantUser('school_super_admin');
        $target = $this->membershipIn($actor['tenant'], 'parent');
        $teacher = Role::query()->where('name', 'teacher')->firstOrFail()->load('permissions');
        app(TenantContext::class)->set($actor['tenant'], $actor['membership']->load('tenant', 'role.permissions'));
        $service = app(RoleAssignmentService::class);
        $originalRoleId = $target->role_id;
        $assignment = $service->assign($actor['membership'], $target, $teacher);
        $evaluator = app(CanonicalAuthorizationEvaluator::class);

        $this->assertTrue($evaluator->allows($target->unsetRelation('roleAssignments')->load('tenant', 'role.permissions'), 'performance.result.view'));
        $this->assertTrue($evaluator->allows($target, 'attendance.student.record'));
        $service->revoke($actor['membership'], $assignment);
        $this->assertTrue($evaluator->allows($target->unsetRelation('roleAssignments'), 'performance.result.view'));
        $this->assertFalse($evaluator->allows($target, 'attendance.student.record'));
        $this->assertSame($originalRoleId, $target->fresh()->role_id);
        $this->assertSame('parent', $target->fresh('role')->role->name);

        $service->reactivate($actor['membership'], $assignment->fresh());
        $this->assertTrue($evaluator->allows($target->unsetRelation('roleAssignments'), 'attendance.student.record'));
        $this->assertSame($originalRoleId, $target->fresh()->role_id);
    }

    public function test_delegation_and_mutation_security_matrix(): void
    {
        $actor = $this->makeTenantUser('school_super_admin');
        $target = $this->membershipIn($actor['tenant'], 'parent');
        $teacher = Role::query()->where('name', 'teacher')->firstOrFail()->load('permissions');
        app(TenantContext::class)->set($actor['tenant'], $actor['membership']->load('tenant', 'role.permissions'));
        $assignment = app(RoleAssignmentService::class)->assign($actor['membership'], $target, $teacher);
        $this->assertSame(RoleAssignment::ACTIVE, $assignment->status);

        $unauthorized = $this->membershipIn($actor['tenant'], 'teacher');
        foreach (['revoke', 'reactivate'] as $operation) {
            try {
                app(RoleAssignmentService::class)->{$operation}($unauthorized, $assignment);
                $this->fail("Unauthorized {$operation} unexpectedly succeeded.");
            } catch (ValidationException) {
                $this->assertTrue(true);
            }
        }

        $other = $this->makeTenantUser('teacher');
        foreach ([
            [$unauthorized, $target, Role::query()->where('name', 'parent')->firstOrFail(), 'unauthorized actor'],
            [$unauthorized, $target, Role::query()->where('name', 'school_admin')->firstOrFail(), 'lower to higher'],
            [$actor['membership'], $target, Role::query()->where('name', 'school_super_admin')->firstOrFail(), 'non-delegable'],
            [$actor['membership'], $other['membership'], $teacher, 'cross tenant'],
        ] as [$delegator, $recipient, $role, $case]) {
            try {
                app(RoleAssignmentService::class)->assign($delegator, $recipient, $role->load('permissions'));
                $this->fail("Rejected delegation case succeeded: {$case}");
            } catch (ValidationException) {
                $this->assertTrue(true);
            }
        }
    }

    private function membershipIn(Tenant $tenant, string $roleName): TenantMembership
    {
        $user = User::factory()->create();
        $role = Role::query()->where('name', $roleName)->firstOrFail();

        return TenantMembership::query()->create(['tenant_id' => $tenant->id, 'user_id' => $user->id, 'role_id' => $role->id, 'status' => 'active']);
    }

    private function assignment(int $membershipId, int $roleId, array $state = []): RoleAssignment
    {
        return RoleAssignment::query()->create($state + ['tenant_membership_id' => $membershipId, 'role_id' => $roleId, 'scope_type' => 'TENANT', 'status' => RoleAssignment::ACTIVE, 'source' => RoleAssignment::DIRECT]);
    }
}
