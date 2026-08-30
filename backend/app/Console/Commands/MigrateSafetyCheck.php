<?php

namespace App\Console\Commands;

use App\Support\MigrationSafetyClassifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateSafetyCheck extends Command
{
    protected $signature = 'migrate:safety-check
        {--pending : Only classify migrations that have not run yet}
        {--allow-destructive : Permit DESTRUCTIVE pending migrations (requires an explicit deploy flag)}';

    protected $description = 'Classify pending Laravel migrations (SAFE / CAUTION / DESTRUCTIVE) before production migrate';

    public function handle(MigrationSafetyClassifier $classifier): int
    {
        $reports = $classifier->classifyDirectory(database_path('migrations'));
        if ($this->option('pending')) {
            $ran = $this->ranMigrationNames();
            $reports = array_values(array_filter(
                $reports,
                fn (array $report) => ! in_array($report['name'], $ran, true)
            ));
        }

        if ($reports === []) {
            $this->info('No migrations to classify.');

            return self::SUCCESS;
        }

        $destructive = [];
        foreach ($reports as $report) {
            $hits = $report['hits'] === [] ? 'none' : implode(', ', $report['hits']);
            $line = "[{$report['level']}] {$report['name']} ({$hits})";
            match ($report['level']) {
                MigrationSafetyClassifier::DESTRUCTIVE => $this->error($line),
                MigrationSafetyClassifier::CAUTION => $this->warn($line),
                default => $this->line($line),
            };
            if ($report['level'] === MigrationSafetyClassifier::DESTRUCTIVE) {
                $destructive[] = $report['name'];
            }
        }

        if ($destructive === []) {
            $this->info('Migration safety check passed. Production must not roll back migrations automatically.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->error('DESTRUCTIVE up() changes require expand → deploy → contract, not a same-release drop.');
        $this->error('Dropped columns/tables make filesystem rollback leave an incompatible database.');

        if ($this->option('allow-destructive') || filter_var((string) getenv('ALLOW_DESTRUCTIVE_MIGRATIONS'), FILTER_VALIDATE_BOOLEAN)) {
            $this->warn('ALLOW_DESTRUCTIVE_MIGRATIONS is set; continuing.');

            return self::SUCCESS;
        }

        $this->error('Re-run with --allow-destructive or ALLOW_DESTRUCTIVE_MIGRATIONS=true only after a compatibility release.');

        return self::FAILURE;
    }

    /**
     * @return list<string>
     */
    private function ranMigrationNames(): array
    {
        if (! Schema::hasTable('migrations')) {
            return [];
        }

        return DB::table('migrations')->pluck('migration')->map(fn ($name) => (string) $name)->all();
    }
}
