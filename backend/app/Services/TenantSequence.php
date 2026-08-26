<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;

final class TenantSequence
{
    public function __construct(private readonly TenantContext $context) {}

    public function next(string $name): int
    {
        return DB::transaction(function () use ($name): int {
            $row = DB::table('tenant_sequences')->where('tenant_id', $this->context->tenantId())->where('name', $name)->lockForUpdate()->first();
            if (! $row) {
                DB::table('tenant_sequences')->insert(['tenant_id' => $this->context->tenantId(), 'name' => $name, 'next_value' => 2, 'created_at' => now(), 'updated_at' => now()]);

                return 1;
            }
            DB::table('tenant_sequences')->where('id', $row->id)->update(['next_value' => $row->next_value + 1, 'updated_at' => now()]);

            return (int) $row->next_value;
        });
    }
}
