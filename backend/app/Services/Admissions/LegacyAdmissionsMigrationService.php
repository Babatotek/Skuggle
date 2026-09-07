<?php

namespace App\Services\Admissions;

use App\Domain\Admissions\ApplicationStatus;
use App\Domain\Admissions\DecisionType;
use App\Domain\Admissions\ScreeningStatus;
use App\Domain\Tenancy\TenantContext;
use App\Models\AdmissionApplication;
use App\Models\AdmissionCycle;
use App\Models\AdmissionDecision;
use App\Models\AdmissionOfferLetter;
use App\Models\AdmissionScreening;
use App\Models\AdmissionWorkflowHistory;
use App\Models\SchoolModuleRecord;
use App\Models\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class LegacyAdmissionsMigrationService
{
    public const MODULES = [
        'admissions-applications',
        'admissions-screening',
        'admissions-decisions',
        'admissions-letters',
        'admissions-waiting',
        'admissions-settings',
    ];

    public function __construct(private readonly TenantContext $context) {}

    /**
     * @return array{source:int,migrated:int,would_migrate:int,existing:int,issues:int,parity:int,parity_ok:bool,by_module:array<string, array<string, int>>,dry_run:bool}
     */
    public function migrate(?string $tenantPublicId = null, bool $dryRun = false): array
    {
        $query = SchoolModuleRecord::query()->withoutGlobalScopes()
            ->whereIn('module', self::MODULES)
            ->orderByRaw("case when module = 'admissions-applications' then 0 else 1 end")
            ->orderBy('id');
        if ($tenantPublicId) {
            $tenantId = Tenant::query()->where('public_id', $tenantPublicId)->value('id');
            if (! $tenantId) {
                throw new \InvalidArgumentException('Tenant not found.');
            }
            $query->where('tenant_id', $tenantId);
        }

        $report = [
            'source' => 0, 'migrated' => 0, 'would_migrate' => 0, 'existing' => 0,
            'issues' => 0, 'parity' => 0, 'parity_ok' => true, 'by_module' => [],
            'dry_run' => $dryRun,
        ];
        foreach (self::MODULES as $module) {
            $report['by_module'][$module] = ['source' => 0, 'migrated' => 0, 'would_migrate' => 0, 'existing' => 0, 'issues' => 0];
        }

        foreach ($query->lazyById(200) as $source) {
            $report['source']++;
            $report['by_module'][$source->module]['source']++;
            $tenant = Tenant::query()->findOrFail($source->tenant_id);
            $this->context->set($tenant);
            try {
                $outcome = $this->migrateRecord($source, $dryRun);
            } finally {
                $this->context->clear();
            }
            $report[$outcome]++;
            $report['by_module'][$source->module][$outcome]++;
        }

        $report['parity'] = $report['migrated'] + $report['would_migrate'] + $report['existing'] + $report['issues'];
        $report['parity_ok'] = $report['source'] === $report['parity'];

        return $report;
    }

    private function migrateRecord(SchoolModuleRecord $source, bool $dryRun): string
    {
        if ($this->targetExists($source)) {
            return 'existing';
        }

        $rawPayload = $source->getAttribute('payload');
        $payload = is_array($rawPayload) ? $rawPayload : [];
        if ($source->module !== 'admissions-applications' && $source->module !== 'admissions-settings') {
            $applicant = $this->applicantName($source);
            $application = $this->findApplication($applicant);
            if (! $application) {
                if ($dryRun && $this->legacyApplicantCount($source->tenant_id, $applicant) === 1) {
                    return 'would_migrate';
                }

                return $this->issue($source, 'APPLICATION_NOT_FOUND', ['applicant' => $applicant], $dryRun);
            }
        }

        if ($dryRun) {
            return 'would_migrate';
        }

        try {
            DB::transaction(function () use ($source, $payload): void {
                match ($source->module) {
                    'admissions-applications' => $this->migrateApplication($source, $payload),
                    'admissions-screening' => $this->migrateScreening($source, $payload),
                    'admissions-decisions' => $this->migrateDecision($source, $payload),
                    'admissions-letters' => $this->migrateLetter($source, $payload),
                    'admissions-waiting' => $this->migrateWaiting($source, $payload),
                    'admissions-settings' => $this->migrateSettings($source, $payload),
                    default => throw new \LogicException('Unsupported legacy Admissions module.'),
                };
            });
        } catch (\Throwable $exception) {
            return $this->issue($source, 'MAPPING_FAILED', ['exception' => class_basename($exception)], false);
        }

        return 'migrated';
    }

    /** @param array<string, mixed> $payload */
    private function migrateApplication(SchoolModuleRecord $source, array $payload): void
    {
        $name = $this->applicantName($source);
        [$first, $middle, $last] = $this->splitName($name);
        AdmissionApplication::query()->create([
            'reference' => $source->reference ?: 'LEGACY-'.$source->public_id,
            'status' => $this->applicationStatus($source->status),
            'first_name' => $first,
            'middle_name' => $middle,
            'last_name' => $last,
            'guardian_name' => $payload['guardian'] ?? null,
            'guardian_phone' => $payload['phone'] ?? null,
            'guardian_email' => isset($payload['email']) ? mb_strtolower((string) $payload['email']) : null,
            'notes' => $payload['notes'] ?? null,
            'custom_fields' => ['legacy' => $payload],
            'submitted_at' => $source->created_at,
            'status_changed_at' => $source->updated_at,
            'created_by' => $source->created_by,
            'updated_by' => $source->created_by,
            'legacy_source_module' => $source->module,
            'legacy_source_id' => $source->getKey(),
            'created_at' => $source->created_at,
            'updated_at' => $source->updated_at,
        ]);
    }

    /** @param array<string, mixed> $payload */
    private function migrateScreening(SchoolModuleRecord $source, array $payload): void
    {
        $application = $this->findApplication($this->applicantName($source));
        AdmissionScreening::query()->create([
            'admission_application_id' => $application->getKey(),
            'status' => in_array($source->status, ['scheduled', 'passed', 'failed'], true) ? $source->status : ScreeningStatus::Scheduled->value,
            'scheduled_at' => $source->status === ScreeningStatus::Scheduled->value ? $source->created_at : null,
            'completed_at' => $source->status !== ScreeningStatus::Scheduled->value ? $source->updated_at : null,
            'score' => is_numeric($payload['score'] ?? null) ? $payload['score'] : null,
            'notes' => $payload['notes'] ?? null,
            'assessed_by' => $source->created_by,
            'legacy_source_module' => $source->module,
            'legacy_source_id' => $source->getKey(),
            'created_at' => $source->created_at,
            'updated_at' => $source->updated_at,
        ]);
    }

    /** @param array<string, mixed> $payload */
    private function migrateDecision(SchoolModuleRecord $source, array $payload): void
    {
        $application = $this->findApplication($this->applicantName($source));
        $legacyDecision = strtolower((string) ($payload['decision'] ?? $source->status));
        $decision = match ($legacyDecision) {
            'rejected' => DecisionType::Rejected,
            'waitlisted', 'waiting' => DecisionType::Waitlisted,
            default => DecisionType::Offered,
        };
        AdmissionDecision::query()->create([
            'admission_application_id' => $application->getKey(),
            'decision' => $decision,
            'offer_reference' => $source->reference,
            'notes' => $payload['notes'] ?? null,
            'decided_at' => $source->updated_at,
            'decided_by' => $source->created_by,
            'legacy_source_module' => $source->module,
            'legacy_source_id' => $source->getKey(),
            'created_at' => $source->created_at,
            'updated_at' => $source->updated_at,
        ]);
        $status = match ($legacyDecision) {
            'accepted' => ApplicationStatus::Accepted,
            'declined' => ApplicationStatus::Declined,
            'rejected' => ApplicationStatus::Rejected,
            'waitlisted', 'waiting' => ApplicationStatus::Waitlisted,
            default => ApplicationStatus::Offered,
        };
        $application->update(['status' => $status, 'status_changed_at' => $source->updated_at]);
    }

    /** @param array<string, mixed> $payload */
    private function migrateLetter(SchoolModuleRecord $source, array $payload): void
    {
        $application = $this->findApplication($this->applicantName($source));
        AdmissionOfferLetter::query()->create([
            'admission_application_id' => $application->getKey(),
            'reference' => $payload['letter_ref'] ?? $source->reference,
            'status' => in_array($source->status, ['draft', 'issued'], true) ? $source->status : 'draft',
            'issued_at' => $this->date($payload['issued_at'] ?? null) ?? ($source->status === 'issued' ? $source->updated_at : null),
            'content' => ['legacy' => $payload],
            'created_by' => $source->created_by,
            'legacy_source_module' => $source->module,
            'legacy_source_id' => $source->getKey(),
            'created_at' => $source->created_at,
            'updated_at' => $source->updated_at,
        ]);
    }

    /** @param array<string, mixed> $payload */
    private function migrateWaiting(SchoolModuleRecord $source, array $payload): void
    {
        $application = $this->findApplication($this->applicantName($source));
        $target = match ($source->status) {
            'offered' => ApplicationStatus::Offered,
            'withdrawn' => ApplicationStatus::Withdrawn,
            default => ApplicationStatus::Waitlisted,
        };
        $from = $application->status;
        $application->update(['status' => $target, 'status_changed_at' => $source->updated_at]);
        AdmissionWorkflowHistory::query()->create([
            'admission_application_id' => $application->getKey(),
            'from_status' => $from,
            'to_status' => $target,
            'reason' => 'Migrated waiting-list state',
            'metadata' => ['legacy' => $payload],
            'changed_by' => $source->created_by,
            'changed_at' => $source->updated_at,
            'legacy_source_module' => $source->module,
            'legacy_source_id' => $source->getKey(),
        ]);
    }

    /** @param array<string, mixed> $payload */
    private function migrateSettings(SchoolModuleRecord $source, array $payload): void
    {
        AdmissionCycle::query()->create([
            'name' => (string) ($payload['window'] ?? $source->title),
            'status' => $source->status === 'active' ? 'active' : 'closed',
            'currency' => strtoupper((string) ($payload['currency'] ?? 'NGN')),
            'application_fee_minor' => $this->minorUnits($payload['fee'] ?? 0),
            'settings' => ['policy' => $payload['policy'] ?? null, 'legacy' => $payload],
            'created_by' => $source->created_by,
            'legacy_source_module' => $source->module,
            'legacy_source_id' => $source->getKey(),
            'created_at' => $source->created_at,
            'updated_at' => $source->updated_at,
        ]);
    }

    private function targetExists(SchoolModuleRecord $source): bool
    {
        $query = match ($source->module) {
            'admissions-applications' => AdmissionApplication::query(),
            'admissions-screening' => AdmissionScreening::query(),
            'admissions-decisions' => AdmissionDecision::query(),
            'admissions-letters' => AdmissionOfferLetter::query(),
            'admissions-waiting' => AdmissionWorkflowHistory::query(),
            'admissions-settings' => AdmissionCycle::query(),
            default => throw new \LogicException('Unsupported legacy Admissions module.'),
        };

        return $query->where('legacy_source_module', $source->module)
            ->where('legacy_source_id', $source->getKey())
            ->exists();
    }

    private function applicantName(SchoolModuleRecord $source): string
    {
        return trim((string) (data_get($source->payload, 'applicant') ?: $source->title));
    }

    private function findApplication(string $name): ?AdmissionApplication
    {
        $normalized = $this->normalize($name);
        $matches = AdmissionApplication::query()->get()->filter(
            fn (AdmissionApplication $application) => $this->normalize($application->full_name) === $normalized,
        );

        return $matches->count() === 1 ? $matches->first() : null;
    }

    private function legacyApplicantCount(int $tenantId, string $name): int
    {
        $normalized = $this->normalize($name);

        return SchoolModuleRecord::query()->withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('module', 'admissions-applications')
            ->get()
            ->filter(fn (SchoolModuleRecord $record) => $this->normalize($this->applicantName($record)) === $normalized)
            ->count();
    }

    /** @return array{string, ?string, string} */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $first = array_shift($parts) ?: 'Unknown';
        $last = count($parts) > 0 ? array_pop($parts) : 'Applicant';
        $middle = $parts !== [] ? implode(' ', $parts) : null;

        return [$first, $middle, $last];
    }

    private function normalize(string $value): string
    {
        return Str::lower((string) preg_replace('/[^a-z0-9]+/i', '', $value));
    }

    private function applicationStatus(string $status): ApplicationStatus
    {
        return match ($status) {
            'submitted' => ApplicationStatus::Submitted,
            'screening' => ApplicationStatus::Screening,
            'offered' => ApplicationStatus::Offered,
            'waitlisted', 'waiting' => ApplicationStatus::Waitlisted,
            'accepted' => ApplicationStatus::Accepted,
            'declined' => ApplicationStatus::Declined,
            'rejected' => ApplicationStatus::Rejected,
            'withdrawn' => ApplicationStatus::Withdrawn,
            'enrolled' => ApplicationStatus::Enrolled,
            default => ApplicationStatus::Draft,
        };
    }

    /** @param array<string, mixed> $details */
    private function issue(SchoolModuleRecord $source, string $reason, array $details, bool $dryRun): string
    {
        if (! $dryRun) {
            DB::table('admission_migration_issues')->updateOrInsert(
                [
                    'tenant_id' => $source->tenant_id,
                    'source_module' => $source->module,
                    'source_id' => $source->getKey(),
                    'reason_code' => $reason,
                ],
                ['details' => json_encode($details, JSON_THROW_ON_ERROR), 'updated_at' => now(), 'created_at' => now()],
            );
        }

        return 'issues';
    }

    private function minorUnits(mixed $fee): int
    {
        if (! is_numeric($fee)) {
            return 0;
        }

        return max(0, (int) round(((float) $fee) * 100));
    }

    private function date(mixed $value): ?Carbon
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }
}
