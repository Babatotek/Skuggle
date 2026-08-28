<?php

namespace Tests\Feature\Settings;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class ModuleDataTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_admin_can_persist_timetable_with_optimistic_concurrency(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin', userOverrides: ['two_factor_confirmed_at' => now()]);
        $headers = ['Idempotency-Key' => 'timetable-save-1'];

        $this->actingAsTenantUser($user, $tenant)->getJson('/api/v1/module-data/timetable')
            ->assertOk()->assertJsonPath('data.revision', 0);

        $this->actingAsTenantUser($user, $tenant)->putJson('/api/v1/module-data/timetable', [
            'revision' => 0,
            'payload' => ['selectedClass' => 'JSS 1', 'periods' => [['day' => 'Monday', 'periodNumber' => 1]]],
        ], $headers)->assertOk()->assertJsonPath('data.revision', 1);

        $this->actingAsTenantUser($user, $tenant)->putJson('/api/v1/module-data/timetable', [
            'revision' => 0, 'payload' => ['periods' => []],
        ], ['Idempotency-Key' => 'timetable-save-stale'])->assertStatus(409)
            ->assertJsonPath('error.code', 'REVISION_CONFLICT');
    }

    public function test_module_payload_is_tenant_scoped(): void
    {
        ['tenant' => $tenantA, 'user' => $userA] = $this->makeTenantUser('school_admin', userOverrides: ['two_factor_confirmed_at' => now()]);
        ['tenant' => $tenantB, 'user' => $userB] = $this->makeTenantUser('school_admin', userOverrides: ['two_factor_confirmed_at' => now()]);

        $this->actingAsTenantUser($userA, $tenantA)->putJson('/api/v1/module-data/fee-structure', [
            'revision' => 0, 'payload' => ['items' => [['name' => 'Tenant A tuition']]],
        ], ['Idempotency-Key' => 'fee-structure-save-tenant-a'])->assertOk();

        $this->actingAsTenantUser($userB, $tenantB)->getJson('/api/v1/module-data/fee-structure')
            ->assertOk()->assertJsonPath('data.payload', []);
    }
}
