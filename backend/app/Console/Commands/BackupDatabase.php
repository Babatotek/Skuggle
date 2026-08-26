<?php

namespace App\Console\Commands;

use App\Services\DatabaseBackupService;
use Illuminate\Console\Command;
use Throwable;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database
        {--trigger=scheduled : Snapshot trigger label (scheduled|manual|predeploy)}';

    protected $description = 'Create a compressed logical database dump and register it in platform backup snapshots';

    public function handle(DatabaseBackupService $backups): int
    {
        $this->info('Starting database backup…');

        try {
            $result = $backups->create(null, (string) $this->option('trigger'));
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('Backup completed: '.$result['path']);
        $this->info('Size: '.$result['bytes'].' bytes');
        $this->info('Snapshot id: '.$result['snapshot']->public_id);

        return self::SUCCESS;
    }
}
