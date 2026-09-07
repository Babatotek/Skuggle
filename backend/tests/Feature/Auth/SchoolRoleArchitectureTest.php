<?php

namespace Tests\Feature\Auth;

use App\Domain\Identity\SchoolRoles;
use App\Models\RoleAssignment;
use App\Models\Student;
use App\Models\TenantMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class SchoolRoleArchitectureTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_school_registration_assigns_school_super_admin(): void
    {
        $this->seedAccessControl();

        $this->postJson('/api/v1/schools/register', [
            'schoolName' => 'Authority Academy',
            'adminName' => 'Founder',
            'adminEmail' => 'founder@authority.example',
            'password' => 'Pass123!',
            'password_confirmation' => 'Pass123!',
        ], ['Idempotency-Key' => '11111111-1111-4111-8111-111111111111'])->assertCreated();

        $this->assertDatabaseHas('roles', ['name' => SchoolRoles::SCHOOL_SUPER_ADMIN, 'privileged' => true]);
        $this->assertDatabaseHas('roles', ['name' => SchoolRoles::SCHOOL_ADMIN, 'privileged' => false]);
    }

    public function test_school_super_admin_can_create_school_admin_and_officer_cannot_promote_self(): void
    {
        ['tenant' => $tenant, 'user' => $super] = $this->makeTenantUser('school_super_admin');

        $this->actingAsTenantUser($super, $tenant)
            ->postJson('/api/v1/school/memberships', [
                'name' => 'Ada Officer',
                'email' => 'ada.officer@example.com',
                'password' => 'Pass12345!',
                'role' => SchoolRoles::SCHOOL_ADMIN,
            ], ['Idempotency-Key' => '22222222-2222-4222-8222-222222222222'])
            ->assertCreated()
            ->assertJsonPath('data.membership.role', SchoolRoles::SCHOOL_ADMIN);

        $created = TenantMembership::query()->whereHas('user', fn ($query) => $query->where('email', 'ada.officer@example.com'))->firstOrFail();
        $this->assertSame(1, RoleAssignment::query()->where('tenant_membership_id', $created->id)->where('role_id', $created->role_id)->where('source', RoleAssignment::LEGACY_PRIMARY)->count());

        ['tenant' => $otherTenant, 'user' => $officer] = $this->makeTenantUser('school_admin');

        $this->actingAsTenantUser($officer, $otherTenant)
            ->postJson('/api/v1/school/memberships', [
                'name' => 'Escalation',
                'email' => 'escalate@example.com',
                'password' => 'Pass12345!',
                'role' => SchoolRoles::SCHOOL_ADMIN,
            ], ['Idempotency-Key' => '33333333-3333-4333-8333-333333333333'])
            ->assertForbidden();

        $this->actingAsTenantUser($officer, $otherTenant)
            ->getJson('/api/v1/dashboards/superadmin')
            ->assertForbidden();
    }

    public function test_school_admin_cannot_change_super_admin_or_inject_tenant_id(): void
    {
        ['tenant' => $tenantA, 'user' => $super, 'membership' => $superMembership] = $this->makeTenantUser('school_super_admin');
        ['tenant' => $tenantB, 'user' => $officer] = $this->makeTenantUser('school_admin');

        $this->actingAsTenantUser($officer, $tenantB)
            ->patchJson('/api/v1/school/memberships/'.$superMembership->getKey(), [
                'role' => 'teacher',
                'tenant_id' => $tenantA->getKey(),
            ], ['Idempotency-Key' => '44444444-4444-4444-8444-444444444444'])
            ->assertForbidden();

        $this->actingAsTenantUser($super, $tenantA)
            ->patchJson('/api/v1/school/memberships/'.$superMembership->getKey(), [
                'role' => SchoolRoles::SCHOOL_ADMIN,
                'currentPassword' => 'password',
            ], ['Idempotency-Key' => '55555555-5555-4555-8555-555555555555'])
            ->assertForbidden();
    }

    public function test_superadmin_dashboard_returns_tenant_scoped_real_counts(): void
    {
        ['tenant' => $tenantA, 'user' => $superA] = $this->makeTenantUser('school_super_admin');
        ['tenant' => $tenantB, 'user' => $superB] = $this->makeTenantUser('school_super_admin');

        $this->makeStudentForTenant($tenantA, ['first_name' => 'Ada']);
        $this->makeStudentForTenant($tenantA, ['first_name' => 'Chidi']);
        $this->makeStudentForTenant($tenantB, ['first_name' => 'Other']);

        $this->actingAsTenantUser($superA, $tenantA)
            ->getJson('/api/v1/dashboards/superadmin')
            ->assertOk()
            ->assertJsonPath('data.experience', 'superadmin')
            ->assertJsonPath('data.metrics.0.value', 2);

        $this->actingAsTenantUser($superB, $tenantB)
            ->getJson('/api/v1/dashboards/superadmin')
            ->assertOk()
            ->assertJsonPath('data.metrics.0.value', 1);

        $this->actingAsTenantUser($superA, $tenantA)
            ->getJson('/api/v1/students/'.Student::query()->withoutGlobalScopes()->where('first_name', 'Other')->firstOrFail()->public_id)
            ->assertNotFound();
    }

    public function test_school_admin_cannot_invite_school_super_admin(): void
    {
        ['tenant' => $tenant, 'user' => $officer] = $this->makeTenantUser('school_admin');

        $this->actingAsTenantUser($officer, $tenant)
            ->postJson('/api/v1/invites', [
                'email' => 'new-super@example.com',
                'role' => SchoolRoles::SCHOOL_SUPER_ADMIN,
            ], ['Idempotency-Key' => '66666666-6666-4666-8666-666666666666'])
            ->assertStatus(422);
    }
}
