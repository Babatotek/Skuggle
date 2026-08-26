<?php

namespace App\Policies;

use App\Domain\Tenancy\TenantContext;
use App\Models\Assessment;
use App\Models\User;

class AssessmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'assessments.view');
    }

    public function view(User $user, Assessment $assessment): bool
    {
        return $this->sameTenant($assessment) && $this->allows($user, 'assessments.view');
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'assessment.create');
    }

    public function updateScores(User $user, Assessment $assessment): bool
    {
        return $this->sameTenant($assessment) && $this->allows($user, 'scores.edit');
    }

    private function allows(User $user, string $permission): bool
    {
        $context = app(TenantContext::class);
        if (! $context->hasTenant()) {
            return false;
        }

        return in_array($permission, $context->membership()->permissionNames(), true);
    }

    private function sameTenant(Assessment $assessment): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && (int) $assessment->tenant_id === $context->tenantId();
    }
}
