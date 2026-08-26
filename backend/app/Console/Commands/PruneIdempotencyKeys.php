<?php

namespace App\Console\Commands;

use App\Models\IdempotencyKey;
use Illuminate\Console\Command;

class PruneIdempotencyKeys extends Command
{
    protected $signature = 'idempotency:prune';

    protected $description = 'Delete expired idempotency key records';

    public function handle(): int
    {
        $deleted = IdempotencyKey::query()
            ->where('expires_at', '<', now())
            ->delete();

        $this->info("Pruned {$deleted} expired idempotency keys.");

        return self::SUCCESS;
    }
}
