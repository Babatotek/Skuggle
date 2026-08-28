<?php

namespace Tests\Feature;

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
            ->assertJsonPath('data.user.role', 'school_admin');

        $this->withHeaders($headers)
            ->getJson('/api/v1/students?perPage=100')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.meta.total', 9)
            ->assertJsonCount(9, 'data.data');

        $this->withHeaders($headers)
            ->getJson('/api/v1/dashboards/operations')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(4, 'data.metrics');
    }
}
