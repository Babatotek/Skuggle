<?php

namespace App\Domain\Tenancy;

use LogicException;

final class PlatformContext
{
    private ?int $actorId = null;

    private ?string $capability = null;

    private ?string $correlationId = null;

    public function activate(int $actorId, string $capability, string $correlationId): void
    {
        if ($this->actorId !== null) {
            throw new LogicException('Platform context is immutable during a unit of work.');
        }

        $this->actorId = $actorId;
        $this->capability = $capability;
        $this->correlationId = $correlationId;
    }

    public function require(string $capability): void
    {
        if ($this->actorId === null || ! hash_equals((string) $this->capability, $capability)) {
            throw new LogicException('An explicit platform principal with the required capability is required.');
        }
    }

    public function actorId(): int
    {
        return $this->actorId ?? throw new LogicException('No platform principal is active.');
    }

    public function correlationId(): string
    {
        return $this->correlationId ?? throw new LogicException('No platform correlation ID is active.');
    }

    public function clear(): void
    {
        $this->actorId = null;
        $this->capability = null;
        $this->correlationId = null;
    }
}
