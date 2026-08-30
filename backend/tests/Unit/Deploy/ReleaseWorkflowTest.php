<?php

namespace Tests\Unit\Deploy;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ReleaseWorkflowTest extends TestCase
{
    #[Test]
    public function remote_deploy_script_prepares_offline_and_locks(): void
    {
        $path = base_path('deploy/shared-hosting/remote-deploy.sh');
        $this->assertFileExists($path);
        $script = (string) file_get_contents($path);

        $this->assertStringContainsString('flock', $script);
        $this->assertStringContainsString('deployments/skuggle', $script);
        $this->assertStringContainsString('shared/storage', $script);
        $this->assertStringContainsString('release-manifest.json', $script);
        $this->assertStringContainsString('READY_FOR_ACTIVATION', $script);
        $this->assertStringContainsString('rollback_live', $script);
        $this->assertStringContainsString('verify_ready', $script);
        $this->assertStringContainsString('verify_frontend', $script);
        $this->assertStringContainsString('artisan" down', $script);
    }

    #[Test]
    public function remote_release_script_runs_composer_before_noting_completion(): void
    {
        $script = (string) file_get_contents(base_path('deploy/shared-hosting/remote-release.sh'));

        $this->assertStringContainsString('composer', $script);
        $this->assertStringContainsString('--no-dev', $script);
        $this->assertStringContainsString('migrate:safety-check', $script);
        $this->assertStringContainsString('migrate --force', $script);
        $this->assertStringContainsString('Staged shared-hosting prepare complete', $script);
        $this->assertStringNotContainsString('Shared hosting release complete', $script);
    }

    #[Test]
    public function public_htaccess_routes_version_probe_to_laravel(): void
    {
        $htaccess = (string) file_get_contents(base_path('deploy/shared-hosting/public_html/.htaccess'));

        $this->assertStringContainsString('^/ready$', $htaccess);
        $this->assertStringContainsString('^/live$', $htaccess);
        $this->assertStringContainsString('^/version$', $htaccess);
        $this->assertStringContainsString('immutable', $htaccess);
    }
}
