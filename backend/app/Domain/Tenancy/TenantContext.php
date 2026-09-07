<?php

namespace App\Domain\Tenancy;

use App\Models\Tenant;
use App\Models\TenantMembership;
use LogicException;

final class TenantContext
{
    public const VERSION = 2;

    private ?Tenant $tenant = null;

    private ?TenantMembership $membership = null;

    private ?string $correlationId = null;

    private ?string $workspaceType = null;

    private ?string $principal = null;

    public function set(Tenant $tenant, ?TenantMembership $membership = null, ?string $correlationId = null, ?string $principal = null): void
    {
        if ($this->tenant !== null && $this->tenant->isNot($tenant)) {
            throw new LogicException('Tenant context is immutable during a unit of work; clear it before activating another tenant.');
        }

        if ($membership !== null && ((int) $membership->tenant_id !== (int) $tenant->getKey())) {
            throw new LogicException('Tenant membership does not belong to the activated tenant.');
        }

        $this->tenant = $tenant;
        $this->membership = $membership;
        $this->correlationId = $correlationId ?? $this->correlationId ?? (string) str()->uuid();
        $this->workspaceType = (string) ($tenant->type ?? 'school');
        $this->principal = $membership !== null ? 'membership' : ($principal ?? 'internal_system');
    }

    public function setPublicTenant(Tenant $tenant): void
    {
        $this->set($tenant, null, null, 'legacy_public_compatibility');
    }

    public function clear(): void
    {
        $this->tenant = null;
        $this->membership = null;
        $this->correlationId = null;
        $this->workspaceType = null;
        $this->principal = null;
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

    public function correlationId(): string
    {
        return $this->correlationId ?? throw new LogicException('No tenant correlation ID is active.');
    }

    public function workspaceType(): string
    {
        return $this->workspaceType ?? throw new LogicException('No tenant workspace is active.');
    }

    public function actorId(): ?int
    {
        return $this->membership ? (int) $this->membership->user_id : null;
    }

    public function membershipId(): ?int
    {
        return $this->membership ? (int) $this->membership->getKey() : null;
    }

    public function principal(): string
    {
        return $this->principal ?? throw new LogicException('No tenant principal is active.');
    }

    public function cacheKey(string $suffix): string
    {
        return sprintf('skuggle:v2:%s:tenant:%d:%s', app()->environment(), $this->tenantId(), ltrim($suffix, ':'));
    }
}
