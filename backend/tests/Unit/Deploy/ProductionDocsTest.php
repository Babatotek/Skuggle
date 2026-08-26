<?php

namespace Tests\Unit\Deploy;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductionDocsTest extends TestCase
{
    #[Test]
    public function secrets_rotation_runbook_exists(): void
    {
        $path = base_path('deploy/SECRETS_ROTATION.md');

        $this->assertFileExists($path);
        $contents = file_get_contents($path);
        $this->assertStringContainsString('APP_KEY', $contents);
        $this->assertStringContainsString('PAYMENT_WEBHOOK_SECRET', $contents);
        $this->assertStringContainsString('Emergency', $contents);
    }

    #[Test]
    public function penetration_testing_checklist_exists(): void
    {
        $path = base_path('deploy/PENETRATION_TESTING_CHECKLIST.md');

        $this->assertFileExists($path);
        $contents = file_get_contents($path);
        $this->assertStringContainsString('Multi-tenant isolation', $contents);
        $this->assertStringContainsString('File upload security', $contents);
        $this->assertStringContainsString('TenantIsolationTest', $contents);
    }
}
