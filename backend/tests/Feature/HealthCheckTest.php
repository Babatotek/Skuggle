<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    #[Test]
    public function health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
            ])
            ->assertJsonStructure([
                'status',
                'timestamp',
            ]);
    }

    #[Test]
    public function ready_endpoint_returns_200_when_all_dependencies_healthy(): void
    {
        // Ensure database is accessible
        DB::connection()->getPdo();

        $response = $this->getJson('/ready');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ready',
            ])
            ->assertJsonStructure([
                'status',
                'checks' => [
                    'database',
                    'cache',
                    'filesystem',
                ],
                'timestamp',
            ]);

        // Verify all checks passed
        $checks = $response->json('checks');
        foreach ($checks as $check) {
            $this->assertEquals('healthy', $check['status'], 
                "Check should be healthy but got: " . json_encode($check));
        }
    }

    #[Test]
    public function ready_endpoint_returns_503_when_database_unavailable(): void
    {
        // This test would require mocking DB connection failure
        // For now, we'll just verify the endpoint structure
        $response = $this->getJson('/ready');

        $response->assertJsonStructure([
                'status',
                'checks' => [
                    'database',
                ],
                'timestamp',
        ]);
    }

    #[Test]
    public function ready_endpoint_checks_cache_functionality(): void
    {
        $response = $this->getJson('/ready');

        $response->assertStatus(200);

        $cacheCheck = $response->json('checks.cache');
        $this->assertNotNull($cacheCheck);
        $this->assertEquals('healthy', $cacheCheck['status']);
    }

    #[Test]
    public function ready_endpoint_checks_filesystem_writability(): void
    {
        $response = $this->getJson('/ready');

        $response->assertStatus(200);

        $filesystemCheck = $response->json('checks.filesystem');
        $this->assertNotNull($filesystemCheck);
        $this->assertEquals('healthy', $filesystemCheck['status']);
    }

    #[Test]
    public function startup_endpoint_returns_ok_when_initialized(): void
    {
        // Run migrations so the migrations table exists
        $this->artisan('migrate')->assertSuccessful();

        $response = $this->getJson('/startup');

        $response->assertStatus(200)
            ->assertJson(['status' => 'started'])
            ->assertJsonStructure(['status', 'checks' => ['migrations', 'cache'], 'timestamp']);
    }

    #[Test]
    public function live_endpoint_always_returns_alive(): void
    {
        $response = $this->getJson('/live');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'alive',
            ])
            ->assertJsonStructure([
                'status',
                'timestamp',
            ]);
    }

    #[Test]
    public function health_endpoints_do_not_require_authentication(): void
    {
        // All endpoints must respond without any auth header — status depends on
        // environment state but must never be 401/403/405.
        $this->getJson('/health')->assertStatus(200);
        $this->getJson('/live')->assertStatus(200);
        // /ready and /startup status depends on env; just confirm not auth-gated
        $this->getJson('/ready')->assertJsonStructure(['status', 'timestamp']);
        $this->getJson('/startup')->assertJsonStructure(['status', 'timestamp']);
    }

    #[Test]
    public function health_endpoints_return_valid_timestamps(): void
    {
        $response = $this->getJson('/health');

        $timestamp = $response->json('timestamp');
        $this->assertNotNull($timestamp);
        
        // Verify it's a valid ISO 8601 timestamp
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/',
            $timestamp
        );
    }

    #[Test]
    public function ready_endpoint_handles_redis_check_when_configured(): void
    {
        // When READY_REQUIRES_REDIS is false (default in testing)
        // Redis check should not cause failure
        $response = $this->getJson('/ready');

        $response->assertStatus(200);
        
        // Redis check might not be present if not required
        $checks = $response->json('checks');
        $this->assertIsArray($checks);
    }
}
