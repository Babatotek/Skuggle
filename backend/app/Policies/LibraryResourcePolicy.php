<?php

namespace App\Policies;

use App\Domain\Tenancy\TenantContext;
use App\Models\LibraryResource;
use App\Models\User;

class LibraryResourcePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'library.view');
    }

    public function view(User $user, LibraryResource $resource): bool
    {
        return $this->sameTenant($resource) && $this->allows($user, 'library.view');
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'library.create');
    }

    public function update(User $user, LibraryResource $resource): bool
    {
        return $this->sameTenant($resource) && $this->allows($user, 'library.create');
    }

    public function export(User $user): bool
    {
        return $this->allows($user, 'library.export');
    }

    private function allows(User $user, string $permission): bool
    {
        $context = app(TenantContext::class);
        if (! $context->hasTenant()) {
            return false;
        }

        return in_array($permission, $context->membership()->permissionNames(), true);
    }

    private function sameTenant(LibraryResource $resource): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && (int) $resource->tenant_id === $context->tenantId();
    }
}
