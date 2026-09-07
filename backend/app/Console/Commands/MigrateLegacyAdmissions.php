<?php

namespace App\Console\Commands;

use App\Services\Admissions\LegacyAdmissionsMigrationService;
use Illuminate\Console\Command;

class MigrateLegacyAdmissions extends Command
{
    protected $signature = 'admissions:migrate-legacy {--tenant=} {--dry-run} {--json}';

    protected $description = 'Idempotently migrate legacy Admissions module records into the typed domain';

    public function handle(LegacyAdmissionsMigrationService $migration): int
    {
        $report = $migration->migrate(
            $this->option('tenant') ? (string) $this->option('tenant') : null,
            (bool) $this->option('dry-run'),
        );

        if (! $this->option('json')) {
            $this->info(sprintf(
                'Admissions migration: source=%d migrated=%d would_migrate=%d existing=%d issues=%d parity=%d',
                $report['source'],
                $report['migrated'],
                $report['would_migrate'],
                $report['existing'],
                $report['issues'],
                $report['parity'],
            ));
        }
        $this->line(json_encode($report, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));

        return $report['parity_ok'] && $report['issues'] === 0 ? self::SUCCESS : self::FAILURE;
    }
}
