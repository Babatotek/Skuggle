<?php

namespace Tests\Architecture;

use Tests\TestCase;

final class WaveThreeTenantContextArchitectureTest extends TestCase
{
    public function test_every_tenant_queue_job_declares_a_v2_envelope(): void
    {
        foreach (['GenerateReportJob.php', 'GenerateLibraryExportJob.php', 'ProcessSmartmarkBatch.php', 'SendOutboundDelivery.php'] as $job) {
            $source = file_get_contents(app_path('Jobs/'.$job));
            $this->assertStringContainsString('tenantEnvelope', $source, $job.' must serialize tenant context.');
            $this->assertStringContainsString('TenantJobEnvelope::fromArray', $source, $job.' must validate its envelope at execution.');
            $this->assertStringContainsString('$context->clear()', $source, $job.' must clear worker context in finally.');
        }
    }

    public function test_tenant_context_is_fail_closed_and_versioned(): void
    {
        $scope = file_get_contents(app_path('Domain/Tenancy/Scopes/TenantScope.php'));
        $context = file_get_contents(app_path('Domain/Tenancy/TenantContext.php'));
        $this->assertStringContainsString("whereRaw('1 = 0')", $scope);
        $this->assertStringContainsString('public const VERSION = 2', $context);
        $this->assertStringContainsString('immutable during a unit of work', $context);
    }

    public function test_context_namespaces_and_governance_documents_exist(): void
    {
        foreach (['PlatformContext.php', 'PublicTenantContext.php', 'TenantJobEnvelope.php'] as $file) {
            $this->assertFileExists(app_path('Domain/Tenancy/'.$file));
        }
        foreach (['architecture/TENANT_CONTEXT_CONTRACT.md', 'architecture/TENANT_CONTEXT_CURRENT_MAP.md', 'security/TENANT_JOB_ENVELOPE.md', 'security/TENANT_CACHE_STORAGE_CONTRACT.md', 'migration/WAVE_3_BASELINE.md', 'migration/WAVE_3_TENANT_CONTEXT_IMPLEMENTATION_REPORT.md', 'migration/WAVE_3_CHANGELOG.md'] as $file) {
            $this->assertFileExists(dirname(base_path()).'/docs/'.$file);
        }
    }
}
