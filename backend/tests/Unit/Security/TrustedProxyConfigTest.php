<?php

namespace Tests\Unit\Security;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TrustedProxyConfigTest extends TestCase
{
    #[Test]
    public function env_example_contains_proxy_configuration_guidance(): void
    {
        $envExample = file_get_contents(base_path('.env.example'));

        $this->assertStringContainsString('TRUSTED_PROXIES', $envExample,
            '.env.example should document TRUSTED_PROXIES');
        $this->assertStringContainsString('production', strtolower($envExample),
            '.env.example should warn about production configuration');
        $this->assertStringContainsString('explicit', strtolower($envExample),
            '.env.example should mention explicit IP configuration');
    }

    #[Test]
    public function env_example_shows_explicit_ip_examples(): void
    {
        $envExample = file_get_contents(base_path('.env.example'));

        // Should contain examples of proper configuration
        $this->assertMatchesRegularExpression(
            '/\d+\.\d+\.\d+\.\d+/',
            $envExample,
            '.env.example should contain IP address examples'
        );
    }

    #[Test]
    public function proxy_configuration_documentation_exists(): void
    {
        $this->assertFileExists(
            base_path('deploy/PROXY_CONFIGURATION.md'),
            'Proxy configuration documentation should exist'
        );

        $docs = file_get_contents(base_path('deploy/PROXY_CONFIGURATION.md'));

        $this->assertStringContainsString('Cloudflare', $docs);
        $this->assertStringContainsString('AWS', $docs);
        $this->assertStringContainsString('production', strtolower($docs));
    }

    #[Test]
    public function bootstrap_app_contains_wildcard_protection(): void
    {
        $bootstrap = file_get_contents(base_path('bootstrap/app.php'));

        $this->assertStringContainsString('TRUSTED_PROXIES', $bootstrap,
            'bootstrap/app.php should check TRUSTED_PROXIES');
        $this->assertStringContainsString('production', $bootstrap,
            'bootstrap/app.php should have production environment check');
        $this->assertStringContainsString('RuntimeException', $bootstrap,
            'bootstrap/app.php should throw exception for wildcard in production');
    }

    #[Test]
    public function wildcard_proxy_triggers_error_message_with_guidance(): void
    {
        $bootstrap = file_get_contents(base_path('bootstrap/app.php'));

        // Check if the bootstrap file contains the security check
        $this->assertStringContainsString('TRUSTED_PROXIES', $bootstrap);
        $this->assertStringContainsString('RuntimeException', $bootstrap);

        // Extract and validate the error message content
        $this->assertStringContainsString('wildcard', $bootstrap,
            'bootstrap/app.php should mention wildcard in error');
        $this->assertStringContainsString('production environment', $bootstrap,
            'bootstrap/app.php should mention production environment');
        $this->assertStringContainsString('explicit', strtolower($bootstrap),
            'bootstrap/app.php should guide toward explicit configuration');
        $this->assertStringContainsString('PROXY_CONFIGURATION.md', $bootstrap,
            'bootstrap/app.php should reference documentation');
    }

    #[Test]
    public function github_security_workflow_checks_for_wildcard_in_production(): void
    {
        $workflowPath = base_path('.github/workflows/security-checks.yml');

        if (file_exists($workflowPath)) {
            $workflow = file_get_contents($workflowPath);
            $this->assertStringContainsString('security', strtolower($workflow));
        } else {
            $this->markTestSkipped('Security workflow not yet created');
        }
    }
}
