<?php

namespace App\Policies;

use App\Domain\Tenancy\TenantContext;
use App\Models\ReportJob;
use App\Models\User;

class ReportJobPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'reports.view');
    }

    public function view(User $user, ReportJob $job): bool
    {
        return $this->sameTenant($job) && $this->allows($user, 'reports.view');
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'reports.export');
    }

    private function allows(User $user, string $permission): bool
    {
        $context = app(TenantContext::class);
        if (! $context->hasTenant()) {
            return false;
        }

        return in_array($permission, $context->membership()->permissionNames(), true);
    }

    private function sameTenant(ReportJob $job): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && (int) $job->tenant_id === $context->tenantId();
    }
}
