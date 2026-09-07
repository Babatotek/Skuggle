<?php

namespace App\Domain\Tenancy;

use App\Models\Tenant;
use App\Models\TenantMembership;
use Illuminate\Contracts\Support\Arrayable;
use RuntimeException;

/** @implements Arrayable<string, int|string|null> */
final readonly class TenantJobEnvelope implements Arrayable
{
    public const VERSION = 2;

    public function __construct(
        public int $tenantId,
        public string $workspaceType,
        public ?int $actorId,
        public ?int $membershipId,
        public string $systemPrincipal,
        public string $correlationId,
        public int $version = self::VERSION,
    ) {
        if ($tenantId < 1 || $workspaceType === '' || $correlationId === '') {
            throw new RuntimeException('Malformed tenant job envelope.');
        }
        if ($actorId === null && $systemPrincipal === '') {
            throw new RuntimeException('Tenant job envelope requires an actor or system principal.');
        }
    }

    public static function fromContext(TenantContext $context): self
    {
        return new self($context->tenantId(), $context->workspaceType(), $context->actorId(), $context->membershipId(), $context->actorId() ? '' : $context->principal(), $context->correlationId());
    }

    /** @param array<string, mixed> $payload */
    public static function fromArray(array $payload): self
    {
        if ((int) ($payload['version'] ?? 0) !== self::VERSION) {
            throw new RuntimeException('Unsupported tenant job envelope version.');
        }

        return new self((int) ($payload['tenantId'] ?? 0), (string) ($payload['workspaceType'] ?? ''), isset($payload['actorId']) ? (int) $payload['actorId'] : null, isset($payload['membershipId']) ? (int) $payload['membershipId'] : null, (string) ($payload['systemPrincipal'] ?? ''), (string) ($payload['correlationId'] ?? ''), (int) $payload['version']);
    }

    public function activate(TenantContext $context): void
    {
        $tenant = Tenant::query()->find($this->tenantId);
        if (! $tenant || ! in_array($tenant->status, ['active', 'trial'], true) || (string) $tenant->type !== $this->workspaceType) {
            throw new RuntimeException('Tenant job context restoration failed.');
        }

        $membership = null;
        if ($this->actorId !== null) {
            $membership = TenantMembership::query()->with(['tenant', 'role.permissions'])
                ->whereKey($this->membershipId)
                ->where('tenant_id', $this->tenantId)
                ->where('user_id', $this->actorId)
                ->where('status', 'active')
                ->first();
            if (! $membership) {
                throw new RuntimeException('Tenant job membership is stale or revoked.');
            }
        }

        $context->set($tenant, $membership, $this->correlationId, $this->systemPrincipal);
    }

    public function toArray(): array
    {
        return ['version' => $this->version, 'tenantId' => $this->tenantId, 'workspaceType' => $this->workspaceType, 'actorId' => $this->actorId, 'membershipId' => $this->membershipId, 'systemPrincipal' => $this->systemPrincipal, 'correlationId' => $this->correlationId];
    }
}
