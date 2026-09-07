<?php

namespace App\Support;

use App\Domain\Tenancy\TenantContext;
use InvalidArgumentException;

final class TenantStoragePath
{
    public function __construct(private readonly TenantContext $context) {}

    public function private(string $domain, string $resource, string $filename): string
    {
        return $this->make('private', $domain, $resource, $filename);
    }

    public function public(string $domain, string $resource, string $filename): string
    {
        return $this->make('public', $domain, $resource, $filename);
    }

    private function make(string $classification, string $domain, string $resource, string $filename): string
    {
        foreach ([$domain, $resource, $filename] as $segment) {
            if ($segment === '' || str_contains($segment, '..') || str_contains($segment, '/') || str_contains($segment, '\\')) {
                throw new InvalidArgumentException('Unsafe tenant storage path segment.');
            }
        }

        return sprintf('tenants/%s/%s/%s/%s/%s', $this->context->tenant()->public_id, $classification, $domain, $resource, $filename);
    }
}
