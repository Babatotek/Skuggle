<?php

namespace App\Domain\Tenancy;

use App\Models\Tenant;
use App\Models\TenantMembership;
use LogicException;

final class TenantContext
{
    private ?Tenant $tenant = null;

    private ?TenantMembership $membership = null;

    public function set(Tenant $tenant, ?TenantMembership $membership = null): void
    {
        $this->tenant = $tenant;
        $this->membership = $membership;
    }

    public function setPublicTenant(Tenant $tenant): void
    {
        $this->set($tenant);
    }

    public function clear(): void
    {
        $this->tenant = null;
        $this->membership = null;
    }

    public function hasTenant(): bool
    {
        return $this->tenant !== null;
    }

    public function tenant(): Tenant
    {
        return $this->tenant ?? throw new LogicException('No authorised tenant is active.');
    }

    public function membership(): TenantMembership
    {
        return $this->membership ?? throw new LogicException('No authorised tenant membership is active.');
    }

    public function tenantId(): int
    {
        return (int) $this->tenant()->getKey();
    }

    public function cacheKey(string $suffix): string
    {
        return sprintf('skuggle:v1:tenant:%d:%s', $this->tenantId(), ltrim($suffix, ':'));
    }
}
