<?php

namespace Tests\Unit\Security;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Verifies that required security scanning workflows exist and contain
 * the expected job definitions and tool integrations.
 */
class CiSecurityWorkflowTest extends TestCase
{
    private function rootWorkflowPath(string $file): string
    {
        // Workflows are at the monorepo root, two levels above base_path()
        return dirname(base_path()).DIRECTORY_SEPARATOR.'.github'
            .DIRECTORY_SEPARATOR.'workflows'
            .DIRECTORY_SEPARATOR.$file;
    }

    private function backendWorkflowPath(string $file): string
    {
        return base_path('.github/workflows/'.$file);
    }

    // -----------------------------------------------------------------------
    // Root security workflow
    // -----------------------------------------------------------------------

    #[Test]
    public function root_security_workflow_exists(): void
    {
        $this->assertFileExists(
            $this->rootWorkflowPath('security.yml'),
            'Root security workflow must exist at .github/workflows/security.yml'
        );
    }

    #[Test]
    public function root_security_workflow_has_composer_audit_job(): void
    {
        $workflow = file_get_contents($this->rootWorkflowPath('security.yml'));

        $this->assertStringContainsString('composer audit', $workflow,
            'Security workflow must run composer audit');
    }

    #[Test]
    public function root_security_workflow_has_static_analysis_job(): void
    {
        $workflow = file_get_contents($this->rootWorkflowPath('security.yml'));

        $this->assertStringContainsString('phpstan', strtolower($workflow),
            'Security workflow must run PHPStan / Larastan static analysis');
    }

    #[Test]
    public function root_security_workflow_has_secrets_scanning(): void
    {
        $workflow = file_get_contents($this->rootWorkflowPath('security.yml'));

        $this->assertStringContainsString('gitleaks', strtolower($workflow),
            'Security workflow must include Gitleaks secrets scanning');
    }

    #[Test]
    public function root_security_workflow_has_npm_audit_job(): void
    {
        $workflow = file_get_contents($this->rootWorkflowPath('security.yml'));

        $this->assertStringContainsString('npm audit', $workflow,
            'Security workflow must run npm audit for frontend dependencies');
    }

    #[Test]
    public function root_security_workflow_has_scheduled_run(): void
    {
        $workflow = file_get_contents($this->rootWorkflowPath('security.yml'));

        $this->assertStringContainsString('schedule', $workflow,
            'Security workflow must run on a schedule to catch newly disclosed CVEs');
        $this->assertStringContainsString('cron', $workflow);
    }

    #[Test]
    public function root_security_workflow_has_scope_bypass_check(): void
    {
        $workflow = file_get_contents($this->rootWorkflowPath('security.yml'));

        $this->assertStringContainsString('check-global-scope-bypass', $workflow,
            'Security workflow must enforce withoutGlobalScopes() call count');
    }

    // -----------------------------------------------------------------------
    // Backend-level security workflow
    // -----------------------------------------------------------------------

    #[Test]
    public function backend_security_workflow_exists(): void
    {
        $this->assertFileExists(
            $this->backendWorkflowPath('security-checks.yml'),
            'Backend security workflow must exist'
        );
    }

    #[Test]
    public function backend_security_workflow_has_env_file_check(): void
    {
        $workflow = file_get_contents($this->backendWorkflowPath('security-checks.yml'));

        $this->assertStringContainsString('env', strtolower($workflow),
            'Backend workflow must check for committed .env files');
    }

    #[Test]
    public function backend_security_workflow_runs_security_unit_tests(): void
    {
        $workflow = file_get_contents($this->backendWorkflowPath('security-checks.yml'));

        $this->assertStringContainsString('phpunit', strtolower($workflow),
            'Backend workflow must run PHPUnit security tests');
    }

    #[Test]
    public function backend_security_workflow_has_composer_audit(): void
    {
        $workflow = file_get_contents($this->backendWorkflowPath('security-checks.yml'));

        $this->assertStringContainsString('composer audit', $workflow,
            'Backend workflow must run composer audit');
    }
}
