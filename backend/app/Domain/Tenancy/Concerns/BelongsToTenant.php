<?php

namespace App\Domain\Tenancy\Concerns;

use App\Domain\Tenancy\Scopes\TenantScope;
use App\Domain\Tenancy\TenantContext;
use LogicException;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model): void {
            /** @var TenantContext $context */
            $context = app(TenantContext::class);
            if (! $context->hasTenant()) {
                throw new LogicException('Tenant-owned records require an authorised tenant context.');
            }
            $model->tenant_id = $context->tenantId();
        });
    }
}
