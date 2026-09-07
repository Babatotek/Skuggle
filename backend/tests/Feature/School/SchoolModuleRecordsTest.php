<?php

namespace Tests\Feature\School;

use App\Models\SchoolModuleRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class SchoolModuleRecordsTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_super_admin_can_create_and_list_generic_operations_records(): void
    {
        ['tenant' => $tenant, 'user' => $super] = $this->makeTenantUser('school_super_admin');

        $this->actingAsTenantUser($super, $tenant)
            ->withHeader('Idempotency-Key', '11111111-1111-4111-8111-aaaaaaaaaaaa')
            ->postJson('/api/v1/school-modules/facilities', [
                'title' => 'Science Laboratory',
                'status' => 'active',
                'payload' => ['name' => 'Science Laboratory', 'location' => 'Block A'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Science Laboratory');

        $this->actingAsTenantUser($super, $tenant)
            ->getJson('/api/v1/school-modules/facilities')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);

        $this->assertDatabaseHas('school_module_records', [
            'tenant_id' => $tenant->getKey(),
            'module' => 'facilities',
            'title' => 'Science Laboratory',
        ]);
    }

    public function test_teacher_cannot_create_operations_records(): void
    {
        ['tenant' => $tenant, 'user' => $teacher] = $this->makeTenantUser('teacher');

        $this->actingAsTenantUser($teacher, $tenant)
            ->withHeader('Idempotency-Key', '22222222-2222-4222-8222-bbbbbbbbbbbb')
            ->postJson('/api/v1/school-modules/facilities', [
                'title' => 'Should fail',
                'payload' => ['name' => 'X'],
            ])
            ->assertForbidden();
    }

    public function test_records_are_tenant_isolated(): void
    {
        ['tenant' => $tenantA, 'user' => $superA] = $this->makeTenantUser('school_super_admin');
        ['tenant' => $tenantB, 'user' => $superB] = $this->makeTenantUser('school_super_admin');

        $this->actingAsTenantUser($superA, $tenantA)
            ->withHeader('Idempotency-Key', '33333333-3333-4333-8333-cccccccccccc')
            ->postJson('/api/v1/school-modules/houses', [
                'title' => 'Blue House',
                'payload' => ['name' => 'Blue House'],
            ])
            ->assertCreated();

        $this->actingAsTenantUser($superB, $tenantB)
            ->getJson('/api/v1/school-modules/houses')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->assertSame(1, SchoolModuleRecord::query()->withoutGlobalScopes()->where('tenant_id', $tenantA->getKey())->count());
    }

    public function test_school_profile_and_performance_endpoints(): void
    {
        ['tenant' => $tenant, 'user' => $super] = $this->makeTenantUser('school_super_admin');

        $this->actingAsTenantUser($super, $tenant)
            ->getJson('/api/v1/school-structure/profile')
            ->assertOk()
            ->assertJsonPath('data.name', $tenant->name);

        $this->actingAsTenantUser($super, $tenant)
            ->getJson('/api/v1/performance/at-risk')
            ->assertOk()
            ->assertJsonStructure(['data' => ['rows']]);
    }
}
