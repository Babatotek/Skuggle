<?php

namespace Tests\Feature\Authorization;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Tenancy\TenantContext;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class RoleAssignmentBackfillRemediationTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['skuggle.iam.role_assignments.mode' => 'OFF']);
    }

    public function test_complete_run_processes_each_eligible_membership_once_and_second_run_is_idempotent(): void
    {
        $a = $this->makeTenantUser('teacher');
        $this->addMemberships($a['tenant'], 2, 'teacher');
        $b = $this->makeTenantUser('parent');
        $this->addMemberships($b['tenant'], 2, 'parent');

        $first = $this->runBackfill();
        $this->assertSame(6, $first['reconciliation']['eligible']);
        $this->assertSame(6, $first['processed_unique']);
        $this->assertSame(6, $first['created']);
        $this->assertSame(0, $first['existing']);
        $this->assertReconciled($first);

        $second = $this->runBackfill();
        $this->assertSame(6, $second['processed_unique']);
        $this->assertSame(0, $second['created']);
        $this->assertSame(6, $second['existing']);
        $this->assertReconciled($second);
    }

    public function test_dry_run_reports_would_create_without_mutating(): void
    {
        $this->makeTenantUser('teacher');
        $report = $this->runBackfill(['--dry-run' => true]);

        $this->assertSame(1, $report['eligible']);
        $this->assertSame(1, $report['processed_unique']);
        $this->assertSame(0, $report['created']);
        $this->assertSame(1, $report['would_create']);
        $this->assertSame(0, RoleAssignment::query()->count());
    }

    public function test_partial_cursor_resume_is_monotonic_and_covers_each_membership_once(): void
    {
        $fixture = $this->makeTenantUser('teacher');
        $this->addMemberships($fixture['tenant'], 4, 'teacher');

        $partial = $this->runBackfill(['--limit' => 2]);
        $this->assertSame(2, $partial['processed_unique']);
        $this->assertSame(2, $partial['created']);
        $this->assertGreaterThan(0, $partial['resume_after']);

        $resume = $this->runBackfill(['--after' => $partial['resume_after']]);
        $this->assertSame(3, $resume['processed_unique']);
        $this->assertSame(3, $resume['created']);
        $this->assertGreaterThan($partial['resume_after'], $resume['resume_after']);
        $this->assertSame(5, RoleAssignment::query()->where('source', RoleAssignment::LEGACY_PRIMARY)->count());
        $this->assertReconciled($resume);
    }

    public function test_tenant_filter_is_exact_and_reconciliation_is_filter_specific(): void
    {
        $a = $this->makeTenantUser('teacher');
        $this->addMemberships($a['tenant'], 2, 'teacher');
        $b = $this->makeTenantUser('parent');
        $this->addMemberships($b['tenant'], 1, 'parent');

        $report = $this->runBackfill(['--tenant' => $a['tenant']->public_id]);
        $this->assertSame($a['tenant']->public_id, $report['tenant']);
        $this->assertSame(3, $report['reconciliation']['eligible']);
        $this->assertSame(3, $report['processed_unique']);
        $this->assertReconciled($report);
        $this->assertSame(3, RoleAssignment::query()->whereHas('membership', fn ($q) => $q->where('tenant_id', $a['tenant']->id))->count());
        $this->assertSame(0, RoleAssignment::query()->whereHas('membership', fn ($q) => $q->where('tenant_id', $b['tenant']->id))->count());
    }

    public function test_all_membership_statuses_receive_compatibility_history_but_only_active_authorizes(): void
    {
        $active = $this->makeTenantUser('teacher');
        $inactive = $this->addMemberships($active['tenant'], 1, 'teacher', 'inactive')->first();
        $revoked = $this->addMemberships($active['tenant'], 1, 'teacher', 'revoked')->first();
        $report = $this->runBackfill();

        $this->assertSame(3, $report['processed_unique']);
        $this->assertSame(3, $report['created']);
        $this->assertReconciled($report);
        $context = app(TenantContext::class);
        $context->set($active['tenant'], $active['membership']);
        $evaluator = app(CanonicalAuthorizationEvaluator::class);
        $this->assertTrue($evaluator->allows($active['membership']->load('tenant', 'role.permissions'), 'students.profile.view'));
        $this->assertFalse($evaluator->allows($inactive->load('tenant', 'role.permissions'), 'students.profile.view'));
        $this->assertFalse($evaluator->allows($revoked->load('tenant', 'role.permissions'), 'students.profile.view'));
    }

    /** @return Collection<int, TenantMembership> */
    private function addMemberships(Tenant $tenant, int $count, string $roleName, string $status = 'active')
    {
        $role = Role::query()->where('name', $roleName)->firstOrFail();

        return collect(range(1, $count))->map(function () use ($tenant, $role, $status): TenantMembership {
            $user = User::factory()->create();

            return TenantMembership::query()->create(['tenant_id' => $tenant->id, 'user_id' => $user->id, 'role_id' => $role->id, 'status' => $status]);
        });
    }

    private function runBackfill(array $options = []): array
    {
        Artisan::call('iam:backfill-role-assignments', $options + ['--reconcile' => true, '--json' => true, '--batch' => 2]);
        $lines = array_values(array_filter(explode("\n", trim(Artisan::output()))));

        return json_decode((string) end($lines), true, flags: JSON_THROW_ON_ERROR);
    }

    private function assertReconciled(array $report): void
    {
        $this->assertSame(0, $report['skipped']);
        $this->assertSame(0, $report['failures']);
        $this->assertSame(0, $report['reconciliation']['missing']);
        $this->assertSame(0, $report['reconciliation']['duplicates']);
        $this->assertSame(0, $report['reconciliation']['invalid']);
    }
}
