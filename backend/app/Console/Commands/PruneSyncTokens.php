<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PruneSyncTokens extends Command
{
    protected $signature = 'sync:prune-tokens';

    protected $description = 'Delete device sync tokens older than 90 days';

    public function handle(): int
    {
        if (! Schema::hasTable('device_sync_tokens')) {
            $this->warn('device_sync_tokens table does not exist; skipping.');

            return self::SUCCESS;
        }

        $cutoff = now()->subDays(90);

        $deleted = DB::table('device_sync_tokens')
            ->whereRaw('COALESCE(last_synced_at, created_at) < ?', [$cutoff])
            ->delete();

        $this->info("Pruned {$deleted} device sync tokens older than 90 days.");

        return self::SUCCESS;
    }
}
