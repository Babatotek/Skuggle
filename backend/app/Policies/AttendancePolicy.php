<?php

namespace App\Policies;

use App\Domain\Tenancy\TenantContext;
use App\Models\SchoolClass;
use App\Models\User;

class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'attendance.view');
    }

    public function view(User $user, SchoolClass $class): bool
    {
        return $this->sameTenant($class) && $this->allows($user, 'attendance.view');
    }

    public function update(User $user, SchoolClass $class): bool
    {
        return $this->sameTenant($class) && $this->allows($user, 'attendance.create');
    }

    private function allows(User $user, string $permission): bool
    {
        $context = app(TenantContext::class);
        if (! $context->hasTenant()) {
            return false;
        }

        return in_array($permission, $context->membership()->permissionNames(), true);
    }

    private function sameTenant(SchoolClass $class): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && (int) $class->tenant_id === $context->tenantId();
    }
}
