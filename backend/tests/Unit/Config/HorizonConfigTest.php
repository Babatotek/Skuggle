<?php

namespace Tests\Unit\Config;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class HorizonConfigTest extends TestCase
{
    private function config(): array
    {
        return require config_path('horizon.php');
    }

    #[Test]
    public function horizon_config_file_exists(): void
    {
        $this->assertFileExists(config_path('horizon.php'),
            'config/horizon.php must exist');
    }

    #[Test]
    public function horizon_config_has_production_environment(): void
    {
        $config = $this->config();

        $this->assertArrayHasKey('production', $config['environments'],
            'Horizon must define a production environment');
    }

    #[Test]
    public function production_environment_has_separate_ai_supervisor(): void
    {
        $config = $this->config();
        $prod = $config['environments']['production'];

        $queues = collect($prod)->flatMap(fn ($s) => (array) ($s['queue'] ?? []))->all();

        $this->assertContains('ai', $queues,
            'Production must have a supervisor handling the ai queue in isolation');
    }

    #[Test]
    public function production_environment_has_separate_exports_supervisor(): void
    {
        $config = $this->config();
        $prod = $config['environments']['production'];

        $queues = collect($prod)->flatMap(fn ($s) => (array) ($s['queue'] ?? []))->all();

        $this->assertContains('exports', $queues,
            'Production must have a supervisor for exports queue');
        $this->assertContains('reports', $queues,
            'Production must have a supervisor for reports queue');
    }

    #[Test]
    public function production_supervisors_use_autoscaling(): void
    {
        $config = $this->config();
        $defaultSupervisor = $config['environments']['production']['supervisor-default'] ?? null;

        $this->assertNotNull($defaultSupervisor, 'supervisor-default must exist');
        $this->assertSame('auto', $defaultSupervisor['balance'],
            'Default supervisor should use auto-balancing for elastic scaling');
    }

    #[Test]
    public function production_ai_supervisor_has_correct_timeout(): void
    {
        $config = $this->config();
        $aiSup = $config['environments']['production']['supervisor-ai'] ?? null;

        $this->assertNotNull($aiSup, 'supervisor-ai must exist in production');

        // Timeout should be AI_REQUEST_TIMEOUT + buffer (not less than 45s)
        $this->assertGreaterThanOrEqual(45, $aiSup['timeout'],
            'AI supervisor timeout must accommodate AI request timeout');
    }

    #[Test]
    public function horizon_service_provider_exists(): void
    {
        $this->assertFileExists(
            app_path('Providers/HorizonServiceProvider.php'),
            'HorizonServiceProvider must exist'
        );
    }

    #[Test]
    public function horizon_service_provider_gates_production_access(): void
    {
        $source = file_get_contents(app_path('Providers/HorizonServiceProvider.php'));

        $this->assertStringContainsString('viewHorizon', $source,
            'HorizonServiceProvider must define the viewHorizon gate');
        $this->assertStringContainsString('production', $source,
            'Gate must restrict access in production environment');
        $this->assertStringContainsString('HORIZON_ADMIN_EMAILS', $source,
            'Gate must use HORIZON_ADMIN_EMAILS env var for allow-listing');
    }

    #[Test]
    public function env_example_documents_horizon_vars(): void
    {
        $example = file_get_contents(base_path('.env.example'));

        $this->assertStringContainsString('HORIZON_ADMIN_EMAILS', $example,
            '.env.example must document HORIZON_ADMIN_EMAILS');
        $this->assertStringContainsString('HORIZON_MAX_PROCESSES', $example,
            '.env.example must document HORIZON_MAX_PROCESSES');
    }

    #[Test]
    public function horizon_requires_redis_in_production(): void
    {
        $config = $this->config();
        $prod = $config['environments']['production'];

        foreach ($prod as $supervisor) {
            $this->assertSame('redis', $supervisor['connection'],
                "All production supervisors must use redis connection — '{$supervisor['connection']}' found");
        }
    }

    #[Test]
    public function trim_settings_keep_failed_jobs_long_enough_for_debugging(): void
    {
        $config = $this->config();
        $failed = $config['trim']['failed'] ?? 0;

        $this->assertGreaterThanOrEqual(
            60 * 24, // at least 24 hours in minutes
            $failed,
            'Failed jobs must be retained for at least 24 hours for debugging'
        );
    }
}
