<?php

namespace Tests\Feature\School;

use App\Models\Role;
use App\Models\TenantAccessRole;
use App\Models\WorkforcePosition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class WorkforceIamBoundaryTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_workforce_employment_status_is_tenant_scoped_persisted_and_audited(): void
    {
        ['tenant' => $a, 'user' => $adminA] = $this->makeTenantUser('school_super_admin');
        ['tenant' => $b, 'user' => $adminB] = $this->makeTenantUser('school_super_admin');

        $created = $this->actingAsTenantUser($adminA, $a)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/employees', [
                'employee_number' => 'RGA-E-002',
                'name' => 'Mrs. Adeyemi',
                'employment_type' => 'full_time',
                'status' => 'active',
                'staff_category' => 'teaching',
            ])->assertCreated();

        $id = $created->json('data.id');
        $this->actingAsTenantUser($adminB, $b)->getJson('/api/v1/employees/'.$id)->assertNotFound();
        $this->actingAsTenantUser($adminB, $b)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->patchJson('/api/v1/employees/'.$id, ['status' => 'terminated'])->assertNotFound();

        $this->actingAsTenantUser($adminA, $a)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->patchJson('/api/v1/employees/'.$id, ['status' => 'on_leave'])
            ->assertOk()
            ->assertJsonPath('data.status', 'on_leave');

        $this->actingAsTenantUser($adminA, $a)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->patchJson('/api/v1/employees/'.$id, ['status' => 'terminated'])
            ->assertOk()
            ->assertJsonPath('data.status', 'terminated');

        $this->assertDatabaseHas('employees', [
            'public_id' => $id,
            'tenant_id' => $a->getKey(),
            'status' => 'terminated',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'tenant_id' => $a->getKey(),
            'action' => 'workforce.employment_status.changed',
        ]);
        $this->assertDatabaseHas('employees', ['public_id' => $id, 'status' => 'terminated']);
    }

    public function test_position_is_separate_from_access_role_and_optional_account_link(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_super_admin');
        $position = $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/workforce/positions', ['name' => 'School Admin Officer', 'category' => 'non_teaching'])
            ->assertCreated()
            ->json('data.id');

        $employee = $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/employees', [
                'employee_number' => 'RGA-E-010',
                'name' => 'Mrs. Okonkwo',
                'employment_type' => 'full_time',
                'staff_category' => 'non_teaching',
                'position_id' => $position,
            ])->assertCreated()->json('data');

        $this->assertSame('School Admin Officer', $employee['position']['name']);
        $this->assertNull($employee['linkedUser']);

        $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/employees/'.$employee['id'].'/access', [
                'email' => 'admin.officer@example.test',
                'password' => 'TemporaryPass10',
                'role' => 'school_admin',
            ])->assertCreated();

        $fresh = $this->actingAsTenantUser($admin, $tenant)->getJson('/api/v1/employees/'.$employee['id'])->assertOk()->json('data');
        $this->assertSame('School Admin Officer', $fresh['position']['name']);
        $this->assertNotNull($fresh['linkedUser']);
        $this->assertDatabaseHas('workforce_positions', ['public_id' => $position, 'name' => 'School Admin Officer']);
        $this->assertTrue(Role::query()->where('name', 'school_admin')->exists());
        $this->assertNotEquals(
            WorkforcePosition::query()->where('public_id', $position)->value('id'),
            Role::query()->where('name', 'school_admin')->value('id')
        );
    }

    public function test_access_catalog_excludes_employment_status_and_supports_custom_roles(): void
    {
        ['tenant' => $a, 'user' => $adminA] = $this->makeTenantUser('school_super_admin');
        ['tenant' => $b, 'user' => $adminB] = $this->makeTenantUser('school_super_admin');

        $catalog = $this->actingAsTenantUser($adminA, $a)->getJson('/api/v1/school/access-catalog')->assertOk()->json('data');
        $this->assertArrayHasKey('templates', $catalog);
        $this->assertNotEmpty($catalog['templates']);
        $templateKeys = collect($catalog['roles'])->pluck('templateKey')->filter()->values()->all();
        $this->assertContains('teacher', $templateKeys);
        $this->assertContains('principal', $templateKeys);
        foreach ($catalog['roles'] as $role) {
            $this->assertArrayNotHasKey('status', $role);
            $this->assertArrayHasKey('memberCount', $role);
            $this->assertContains($role['type'], ['Default', 'Custom']);
            $this->assertFalse($role['protected'] ?? false);
        }

        $created = $this->actingAsTenantUser($adminA, $a)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/school/access-roles', [
                'name' => 'Academic Approver',
                'description' => 'Reviews academic decisions',
                'category' => 'Academic Leadership',
            ])->assertCreated()->json('data');

        $this->assertSame('Custom', $created['type']);
        $this->assertDatabaseHas('tenant_access_roles', [
            'tenant_id' => $a->getKey(),
            'name' => 'Academic Approver',
        ]);
        $this->assertSame(0, TenantAccessRole::query()->where('tenant_id', $b->getKey())->count());

        $this->actingAsTenantUser($adminB, $b)->getJson('/api/v1/school/access-catalog')
            ->assertOk()
            ->assertJsonMissing(['name' => 'Academic Approver']);

        $memberships = $this->actingAsTenantUser($adminA, $a)->getJson('/api/v1/school/memberships')->assertOk()->json('data.data');
        $this->assertNotEmpty($memberships);
        $this->assertArrayHasKey('accountType', $memberships[0]);
        $this->assertArrayHasKey('linkedProfile', $memberships[0]);
    }

    public function test_membership_suspend_does_not_change_employment_status(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_super_admin');
        $employee = $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/employees', [
                'employee_number' => 'RGA-E-020',
                'name' => 'Mr. Adewale',
                'employment_type' => 'full_time',
                'status' => 'active',
            ])->assertCreated()->json('data');

        $access = $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/employees/'.$employee['id'].'/access', [
                'email' => 'adewale@example.test',
                'password' => 'TemporaryPass10',
                'role' => 'teacher',
            ])->assertCreated()->json('data.membership');

        $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->patchJson('/api/v1/school/memberships/'.$access['id'], ['status' => 'suspended'])
            ->assertOk();

        $this->assertDatabaseHas('employees', ['public_id' => $employee['id'], 'status' => 'active']);
        $this->assertDatabaseHas('tenant_memberships', ['id' => $access['id'], 'status' => 'suspended']);
    }

    public function test_custom_role_permissions_are_tenant_scoped_and_delegable_only(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_super_admin');
        $created = $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/school/access-roles', [
                'name' => 'Assessment Viewer',
                'templateKey' => 'teacher',
            ])->assertCreated()->json('data');

        $this->assertNotEmpty($created['permissions']);
        $this->assertFalse(in_array('identity.role.manage', $created['permissions'], true));

        $updated = $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->patchJson('/api/v1/school/access-roles/'.$created['id'], [
                'permissions' => ['assessment.assessment.view', 'identity.role.manage', 'platform.tenant.manage'],
            ])->assertOk()->json('data');

        $this->assertSame(['assessment.assessment.view'], $updated['permissions']);
        $roleId = TenantAccessRole::withoutGlobalScopes()->where('public_id', $created['id'])->value('id');
        $this->assertNotNull($roleId);
        $this->assertDatabaseHas('tenant_access_role_permission', [
            'tenant_access_role_id' => $roleId,
        ]);
    }

    public function test_workforce_csv_import_creates_employees_without_accounts(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_super_admin');
        $csv = "employee_number,name,employment_type,status,staff_category,position_name,email\n"
            ."RGA-E-301,Mrs. Import Test,full_time,active,teaching,Classroom Teacher,import@example.test\n";

        $path = tempnam(sys_get_temp_dir(), 'wf');
        file_put_contents($path, $csv);

        $validated = $this->actingAsTenantUser($admin, $tenant)
            ->post('/api/v1/employees/imports/validate', ['file' => new UploadedFile($path, 'staff.csv', 'text/csv', null, true)])
            ->assertOk()
            ->json('data');

        $this->assertSame(1, $validated['validCount']);

        $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/employees/imports/confirm', ['rows' => $validated['rows']])
            ->assertCreated()
            ->assertJsonPath('data.imported', 1);

        $this->assertDatabaseHas('employees', [
            'tenant_id' => $tenant->getKey(),
            'employee_number' => 'RGA-E-301',
            'name' => 'Mrs. Import Test',
            'user_id' => null,
        ]);
        @unlink($path);
    }

    public function test_employee_number_is_auto_generated_from_tenant_name(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_super_admin');
        $tenant->forceFill(['name' => 'Fiwasaye Girls Grammar School'])->save();

        $created = $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/employees', [
                'name' => 'New Staff Member',
                'employment_type' => 'full_time',
            ])->assertCreated()->json('data');

        $this->assertStringStartsWith('FGGS-E-', $created['employeeNumber']);
        $lookups = $this->actingAsTenantUser($admin, $tenant)->getJson('/api/v1/employees/lookups')->assertOk()->json('data');
        $this->assertSame('FGGS', $lookups['schoolCode']);
        $this->assertStringStartsWith('FGGS-E-', $lookups['nextEmployeeNumber']);
    }

    public function test_employee_numbers_realign_when_school_name_changes(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_super_admin');
        $tenant->forceFill(['name' => 'Royal Gateway Academy'])->save();

        $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/employees', [
                'name' => 'Staff One',
                'employment_type' => 'full_time',
            ])->assertCreated()
            ->assertJsonPath('data.employeeNumber', 'RGA-E-001');

        $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->putJson('/api/v1/settings/branding', ['schoolName' => 'Fiwasaye Girls Grammar School'])
            ->assertOk();

        $this->assertDatabaseHas('employees', [
            'tenant_id' => $tenant->getKey(),
            'name' => 'Staff One',
            'employee_number' => 'FGGS-E-001',
        ]);
    }

    public function test_custom_role_creation_rejects_reserved_system_names(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_super_admin');
        $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/school/access-roles', ['name' => 'school_super_admin'])
            ->assertStatus(422);
        $this->actingAsTenantUser($admin, $tenant)
            ->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/school/access-roles', ['name' => 'Super Admin'])
            ->assertStatus(422);
    }
}
