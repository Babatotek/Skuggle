<?php

namespace Tests\Feature;

use App\Models\RoleAssignment;
use App\Models\TenantMembership;
use Database\Seeders\DemoUsersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoTenantSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_tenant_seeder_is_repeatable_and_endpoints_use_seeded_database_data(): void
    {
        $this->seed(DemoUsersSeeder::class);
        $this->seed(DemoUsersSeeder::class);
        $this->assertSame(TenantMembership::query()->count(), RoleAssignment::query()->where('source', RoleAssignment::LEGACY_PRIMARY)->count());
        foreach (TenantMembership::query()->get() as $membership) {
            $this->assertSame(1, RoleAssignment::query()->where('tenant_membership_id', $membership->id)->where('role_id', $membership->role_id)->where('source', RoleAssignment::LEGACY_PRIMARY)->count());
        }

        $headers = [
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/',
        ];

        $login = $this->withHeaders($headers)->postJson('/api/v1/auth/login', [
            'email' => DemoUsersSeeder::DEMO_TENANT_EMAIL,
            'password' => DemoUsersSeeder::DEMO_PASSWORD,
        ]);

        $login->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.tenant.name', 'DemoTenant')
            ->assertJsonPath('data.user.role', 'school_super_admin');

        $this->withHeaders($headers)
            ->getJson('/api/v1/students?perPage=100')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.meta.total', 11)
            ->assertJsonCount(11, 'data.data');

        $this->withHeaders($headers)
            ->getJson('/api/v1/dashboards/operations')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(4, 'data.metrics');
    }
}
