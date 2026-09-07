<?php

namespace Tests\Feature\Admissions;

use App\Domain\Tenancy\TenantContext;
use App\Models\SchoolModuleRecord;
use App\Services\Admissions\LegacyAdmissionsMigrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class LegacyAdmissionsMigrationTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    public function test_six_legacy_modules_have_dry_run_parity_and_idempotent_migration(): void
    {
        ['tenant' => $tenant, 'membership' => $membership] = $this->makeTenantUser('admission_officer');
        $context = app(TenantContext::class);
        $context->set($tenant, $membership);

        foreach ([
            ['admissions-applications', 'Ada Obi', 'submitted', ['applicant' => 'Ada Obi', 'guardian' => 'Ngozi Obi', 'phone' => '+2348000000010']],
            ['admissions-screening', 'Ada Obi', 'passed', ['applicant' => 'Ada Obi', 'score' => '82']],
            ['admissions-decisions', 'Ada Obi', 'accepted', ['applicant' => 'Ada Obi', 'decision' => 'accepted']],
            ['admissions-letters', 'Ada Obi', 'issued', ['applicant' => 'Ada Obi', 'letter_ref' => 'LTR-001']],
            ['admissions-waiting', 'Ada Obi', 'offered', ['applicant' => 'Ada Obi', 'priority' => '1']],
            ['admissions-settings', '2026 Admissions', 'active', ['window' => '2026 Admissions', 'fee' => '25000']],
        ] as [$module, $title, $status, $payload]) {
            SchoolModuleRecord::query()->create(compact('module', 'title', 'status', 'payload'));
        }
        $context->clear();

        $migration = app(LegacyAdmissionsMigrationService::class);
        $dryRun = $migration->migrate($tenant->public_id, true);
        $this->assertSame(6, $dryRun['source']);
        $this->assertSame(6, $dryRun['would_migrate'], json_encode($dryRun));
        $this->assertTrue($dryRun['parity_ok']);

        $first = $migration->migrate($tenant->public_id);
        $this->assertSame(6, $first['migrated'], json_encode($first));
        $this->assertTrue($first['parity_ok']);

        $second = $migration->migrate($tenant->public_id);
        $this->assertSame(6, $second['existing'], json_encode($second));
        $this->assertTrue($second['parity_ok']);

        $this->assertDatabaseCount('admission_applications', 1);
        $this->assertDatabaseCount('admission_screenings', 1);
        $this->assertDatabaseCount('admission_decisions', 1);
        $this->assertDatabaseCount('admission_offer_letters', 1);
        $this->assertDatabaseCount('admission_workflow_history', 1);
        $this->assertDatabaseCount('admission_cycles', 1);
        $this->assertDatabaseCount('admission_migration_issues', 0);
    }

    public function test_unmatched_legacy_rows_are_reported_without_breaking_parity(): void
    {
        ['tenant' => $tenant, 'membership' => $membership] = $this->makeTenantUser('admission_officer');
        $context = app(TenantContext::class);
        $context->set($tenant, $membership);
        SchoolModuleRecord::query()->create([
            'module' => 'admissions-screening',
            'title' => 'Missing Applicant',
            'status' => 'scheduled',
            'payload' => ['applicant' => 'Missing Applicant'],
        ]);
        $context->clear();

        $report = app(LegacyAdmissionsMigrationService::class)->migrate($tenant->public_id);
        $this->assertSame(1, $report['issues']);
        $this->assertTrue($report['parity_ok']);

        $this->assertDatabaseHas('admission_migration_issues', [
            'tenant_id' => $tenant->getKey(),
            'source_module' => 'admissions-screening',
            'reason_code' => 'APPLICATION_NOT_FOUND',
        ]);
    }
}
