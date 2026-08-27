<?php

namespace Tests\Unit\Config;

use Laravel\Pulse\Recorders\SlowRequests;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PulseConfigTest extends TestCase
{
    private function config(): array
    {
        return require config_path('pulse.php');
    }

    #[Test]
    public function pulse_config_file_exists(): void
    {
        $this->assertFileExists(config_path('pulse.php'));
    }

    #[Test]
    public function pulse_enabled_flag_is_configurable(): void
    {
        $config = $this->config();

        $this->assertArrayHasKey('enabled', $config);
        // phpunit.xml sets PULSE_ENABLED=false so APM does not run during tests
        $this->assertFalse((bool) $config['enabled']);
    }

    #[Test]
    public function env_example_defaults_pulse_to_enabled(): void
    {
        $example = file_get_contents(base_path('.env.example'));

        $this->assertMatchesRegularExpression('/^PULSE_ENABLED=true$/m', $example);
    }

    #[Test]
    public function pulse_path_defaults_to_pulse(): void
    {
        $config = $this->config();

        $this->assertSame('pulse', $config['path']);
    }

    #[Test]
    public function storage_driver_defaults_to_database(): void
    {
        $config = $this->config();

        $this->assertSame('database', $config['storage']['driver']);
    }

    #[Test]
    public function slow_request_threshold_matches_app_slo(): void
    {
        $config = $this->config();
        $recorder = $config['recorders'][SlowRequests::class] ?? null;

        $this->assertNotNull($recorder);
        $this->assertSame(500, (int) $recorder['threshold']);
    }

    #[Test]
    public function health_endpoints_are_ignored_by_slow_request_recorder(): void
    {
        $config = $this->config();
        $ignore = $config['recorders'][SlowRequests::class]['ignore'] ?? [];

        $joined = implode(' ', $ignore);

        $this->assertStringContainsString('health', $joined);
        $this->assertStringContainsString('ready', $joined);
    }

    #[Test]
    public function pulse_service_provider_exists(): void
    {
        $this->assertFileExists(app_path('Providers/PulseServiceProvider.php'));
    }

    #[Test]
    public function pulse_service_provider_defines_view_pulse_gate(): void
    {
        $source = file_get_contents(app_path('Providers/PulseServiceProvider.php'));

        $this->assertStringContainsString('viewPulse', $source);
        $this->assertStringContainsString('PULSE_ADMIN_EMAILS', $source);
    }

    #[Test]
    public function pulse_service_provider_is_registered(): void
    {
        $source = file_get_contents(base_path('bootstrap/app.php'));

        $this->assertStringContainsString('PulseServiceProvider', $source);
    }

    #[Test]
    public function pulse_is_listed_as_composer_suggestion_or_requirement(): void
    {
        $composer = json_decode(file_get_contents(base_path('composer.json')), true, 512, JSON_THROW_ON_ERROR);
        $inRequire = isset($composer['require']['laravel/pulse']);
        $inSuggest = isset($composer['suggest']['laravel/pulse']);

        $this->assertTrue($inRequire || $inSuggest, 'laravel/pulse must be in require or suggest');
    }
}
