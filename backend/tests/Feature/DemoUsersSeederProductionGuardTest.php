<?php

namespace Tests\Feature;

use Database\Seeders\DemoUsersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DemoUsersSeederProductionGuardTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function allows_non_production_without_flag(): void
    {
        config(['skuggle.seed_demo_tenant' => false]);

        $this->assertTrue(DemoUsersSeeder::allowedInCurrentEnvironment());
    }

    #[Test]
    public function refuses_production_without_flag(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        config(['skuggle.seed_demo_tenant' => false]);

        $this->assertFalse(DemoUsersSeeder::allowedInCurrentEnvironment());

        (new DemoUsersSeeder)->run();

        $this->assertDatabaseMissing('users', ['email' => DemoUsersSeeder::DEMO_TENANT_EMAIL]);
        $this->assertDatabaseMissing('tenants', ['slug' => DemoUsersSeeder::DEMO_SCHOOL_SLUG]);
    }

    #[Test]
    public function allows_production_when_flag_enabled(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        config(['skuggle.seed_demo_tenant' => true]);

        $this->assertTrue(DemoUsersSeeder::allowedInCurrentEnvironment());
    }

    #[Test]
    public function release_script_seeds_when_flag_is_set(): void
    {
        $script = (string) file_get_contents(base_path('deploy/shared-hosting/remote-release.sh'));

        $this->assertStringContainsString('SEED_DEMO_TENANT', $script);
        $this->assertStringContainsString('DemoUsersSeeder', $script);
        $this->assertStringContainsString('db:seed', $script);
    }
}
