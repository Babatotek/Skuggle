<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class LoginWorkspaceIsolationTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function spaHeaders(): array
    {
        return [
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/',
        ];
    }

    public function test_school_code_opens_the_requested_demo_workspace(): void
    {
        ['user' => $admin] = $this->makeTenantUser('school_super_admin', [
            'name' => 'DemoTenant',
            'slug' => 'demo-tenant',
            'code' => 'DEMO-TENANT',
        ], [
            'email' => 'admin@demotenant.test',
            'password' => 'SkuggleDemo!2026',
        ]);

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'SkuggleDemo!2026',
            'school_code' => 'DEMO-TENANT',
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email', 'admin@demotenant.test')
            ->assertJsonPath('data.user.tenant.code', 'DEMO-TENANT');
    }

    public function test_real_school_admin_cannot_open_demo_tenant_with_school_code(): void
    {
        ['user' => $realAdmin] = $this->makeTenantUser('school_super_admin', [
            'name' => 'Fanimo Academy',
            'code' => 'FANIMO-ACAD',
        ], [
            'email' => 'tosinfanimo3@example.com',
            'password' => 'RealSchool!2026',
        ]);

        $this->makeTenantUser('school_super_admin', [
            'name' => 'DemoTenant',
            'slug' => 'demo-tenant',
            'code' => 'DEMO-TENANT',
        ], [
            'email' => 'admin@demotenant.test',
            'password' => 'SkuggleDemo!2026',
        ]);

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => $realAdmin->email,
            'password' => 'RealSchool!2026',
            'school_code' => 'DEMO-TENANT',
        ])
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'WORKSPACE_UNAVAILABLE');
    }

    public function test_login_does_not_keep_the_previous_account_workspace(): void
    {
        ['user' => $realAdmin] = $this->makeTenantUser('school_super_admin', [
            'name' => 'Fanimo Academy',
            'code' => 'FANIMO-ACAD',
        ], [
            'email' => 'tosinfanimo3@example.com',
            'password' => 'RealSchool!2026',
        ]);

        ['user' => $demoAdmin] = $this->makeTenantUser('school_super_admin', [
            'name' => 'DemoTenant',
            'slug' => 'demo-tenant',
            'code' => 'DEMO-TENANT',
        ], [
            'email' => 'admin@demotenant.test',
            'password' => 'SkuggleDemo!2026',
        ]);

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => $realAdmin->email,
            'password' => 'RealSchool!2026',
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email', 'tosinfanimo3@example.com')
            ->assertJsonPath('data.user.tenant.code', 'FANIMO-ACAD');

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => $demoAdmin->email,
            'password' => 'SkuggleDemo!2026',
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email', 'admin@demotenant.test')
            ->assertJsonPath('data.user.tenant.code', 'DEMO-TENANT');
    }
}
