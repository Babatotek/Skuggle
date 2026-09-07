<?php

namespace App\Support;

use App\Domain\Tenancy\TenantContext;
use InvalidArgumentException;

final class TenantCacheKey
{
    public function __construct(private readonly TenantContext $context) {}

    /** @param array<string, int|string|null> $scope */
    public function make(string $resource, array $scope = []): string
    {
        if (! preg_match('/^[a-z0-9._-]+$/', $resource)) {
            throw new InvalidArgumentException('Cache resource names must be canonical.');
        }
        ksort($scope);
        $parts = array_map(fn ($key, $value) => rawurlencode((string) $key).'='.rawurlencode((string) $value), array_keys($scope), $scope);

        return sprintf('skuggle:v2:%s:tenant:%d:%s%s', app()->environment(), $this->context->tenantId(), $resource, $parts ? ':'.implode(':', $parts) : '');
    }

    /** @param array<string, int|string|null> $scope */
    public static function platform(string $resource, array $scope = []): string
    {
        ksort($scope);
        $suffix = $scope ? ':'.hash('sha256', json_encode($scope, JSON_THROW_ON_ERROR)) : '';

        return sprintf('skuggle:v2:%s:platform:%s%s', app()->environment(), $resource, $suffix);
    }
}
