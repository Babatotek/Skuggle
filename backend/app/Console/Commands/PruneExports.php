<?php

namespace App\Console\Commands;

use App\Models\ExportJob;
use App\Models\ReportJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneExports extends Command
{
    protected $signature = 'exports:prune';

    protected $description = 'Mark and delete expired export_jobs and report_jobs, removing storage files';

    public function handle(): int
    {
        $disk = Storage::disk((string) config('skuggle.library.disk'));
        $exportCount = 0;
        $reportCount = 0;

        $exports = ExportJob::query()
            ->withoutGlobalScopes()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        foreach ($exports as $job) {
            if ($job->storage_key && $disk->exists($job->storage_key)) {
                $disk->delete($job->storage_key);
            }
            $job->update(['state' => 'expired', 'storage_key' => null]);
            $job->delete();
            $exportCount++;
        }

        $reports = ReportJob::query()
            ->withoutGlobalScopes()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        foreach ($reports as $job) {
            if ($job->storage_key && $disk->exists($job->storage_key)) {
                $disk->delete($job->storage_key);
            }
            $job->update(['state' => 'expired', 'storage_key' => null]);
            $job->delete();
            $reportCount++;
        }

        $this->info("Pruned {$exportCount} export jobs and {$reportCount} report jobs.");

        return self::SUCCESS;
    }
}
