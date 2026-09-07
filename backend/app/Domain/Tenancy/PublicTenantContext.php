<?php

namespace App\Domain\Tenancy;

use App\Models\Tenant;
use LogicException;

final class PublicTenantContext
{
    private ?Tenant $tenant = null;

    private ?string $correlationId = null;

    public function activate(Tenant $tenant, string $correlationId): void
    {
        if ($this->tenant !== null && $this->tenant->isNot($tenant)) {
            throw new LogicException('Public tenant context is immutable during a unit of work.');
        }

        $this->tenant = $tenant;
        $this->correlationId = $correlationId;
    }

    public function tenant(): Tenant
    {
        return $this->tenant ?? throw new LogicException('No public tenant projection is active.');
    }

    public function correlationId(): string
    {
        return $this->correlationId ?? throw new LogicException('No public tenant correlation ID is active.');
    }

    public function clear(): void
    {
        $this->tenant = null;
        $this->correlationId = null;
    }
}
