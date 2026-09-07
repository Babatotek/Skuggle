<?php

namespace App\Console\Commands;

use App\Domain\Authorization\RoleAssignmentService;
use App\Models\RoleAssignment;
use App\Models\TenantMembership;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class BackfillRoleAssignments extends Command
{
    protected $signature = 'iam:backfill-role-assignments {--tenant=} {--after=0} {--batch=200} {--limit=0} {--dry-run} {--reconcile} {--json}';

    protected $description = 'Idempotently backfill legacy membership roles into bounded role assignment batches';

    public function handle(RoleAssignmentService $service): int
    {
        $batch = max(1, min(1000, (int) $this->option('batch')));
        $limit = max(0, (int) $this->option('limit'));
        $after = max(0, (int) $this->option('after'));
        $processed = $created = $wouldCreate = $existing = $skipped = $failures = 0;
        $lastId = $after;

        $query = TenantMembership::query()->with(['tenant', 'role.permissions'])->whereNotNull('role_id')->where('id', '>', $after);
        if ($tenant = $this->option('tenant')) {
            $query->whereHas('tenant', fn ($q) => $q->where('public_id', $tenant));
        }

        foreach ($query->lazyById($batch, 'id') as $membership) {
            if ($limit && $processed >= $limit) {
                break;
            }
            $processed++;
            $lastId = (int) $membership->getKey();
            $exists = RoleAssignment::query()->where('tenant_membership_id', $membership->getKey())->where('role_id', $membership->role_id)->where('source', RoleAssignment::LEGACY_PRIMARY)->exists();
            if ($exists) {
                $existing++;

                continue;
            }
            if ($this->option('dry-run')) {
                $wouldCreate++;

                continue;
            }
            try {
                $service->syncLegacyPrimary($membership);
                $created++;
            } catch (\Throwable $e) {
                $failures++;
                Log::error('role_assignment_backfill_failed', ['membership_id' => $membership->getKey(), 'tenant_id' => $membership->tenant_id, 'reason_code' => class_basename($e)]);
            }
            if (! $this->option('json')) {
                $this->line("processed_unique={$processed} created={$created} existing={$existing} skipped={$skipped} failures={$failures} resume_after={$lastId}");
            }
        }

        $report = [
            'tenant' => $tenant ?: null,
            'after' => $after,
            'processed_unique' => $processed,
            'created' => $created,
            'would_create' => $wouldCreate,
            'existing' => $existing,
            'skipped' => $skipped,
            'failures' => $failures,
            'resume_after' => $lastId,
            'dry_run' => (bool) $this->option('dry-run'),
        ];
        if ($this->option('reconcile')) {
            $report['reconciliation'] = $this->reconcile($tenant ?? null);
            $report += $report['reconciliation'];
        }
        $this->line(json_encode($report, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));

        return $failures === 0 && (! isset($report['reconciliation']) || $report['reconciliation']['invalid'] === 0) ? self::SUCCESS : self::FAILURE;
    }

    private function reconcile(?string $tenantPublicId): array
    {
        $memberships = TenantMembership::query()->whereNotNull('role_id');
        if ($tenantPublicId) {
            $memberships->whereHas('tenant', fn ($q) => $q->where('public_id', $tenantPublicId));
        }
        $eligible = (clone $memberships)->count();
        $missing = (clone $memberships)->whereDoesntHave('roleAssignments', fn ($q) => $q->whereColumn('role_assignments.role_id', 'tenant_memberships.role_id')->where('source', RoleAssignment::LEGACY_PRIMARY))->count();
        $duplicateQuery = RoleAssignment::query()->selectRaw('tenant_membership_id, role_id, count(*) aggregate')
            ->where('source', RoleAssignment::LEGACY_PRIMARY);
        if ($tenantPublicId) {
            $duplicateQuery->whereHas('membership.tenant', fn ($q) => $q->where('public_id', $tenantPublicId));
        }
        $duplicates = $duplicateQuery->groupBy('tenant_membership_id', 'role_id')->havingRaw('count(*) > 1')->count();

        return [
            'tenant' => $tenantPublicId,
            'eligible' => $eligible,
            'missing' => $missing,
            'duplicates' => $duplicates,
            'invalid' => $missing + $duplicates,
        ];
    }
}
