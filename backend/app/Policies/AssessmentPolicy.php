<?php

namespace App\Policies;

use App\Domain\Authorization\PermissionRegistry;
use App\Domain\Tenancy\TenantContext;
use App\Models\Assessment;
use App\Models\User;
use App\Services\AssessmentAccess;

class AssessmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'assessments.view');
    }

    public function view(User $user, Assessment $assessment): bool
    {
        return $this->sameTenant($assessment) && $this->allows($user, 'assessments.view') && app(AssessmentAccess::class)->resource($assessment);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'assessment.create');
    }

    public function updateScores(User $user, Assessment $assessment): bool
    {
        return $this->view($user, $assessment) && $this->allows($user, 'scores.edit') && in_array($assessment->status, ['draft', 'ready', 'scheduled', 'active', 'completed', 'marking', 'reopened', 'submitted', 'moderation', 'under_review'], true);
    }

    private function allows(User $user, string $permission): bool
    {
        $context = app(TenantContext::class);
        if (! $context->hasTenant()) {
            return false;
        }

        $canonical = PermissionRegistry::canonicalFor($permission);

        return $canonical !== null && app(AssessmentAccess::class)->allows($canonical);
    }

    private function sameTenant(Assessment $assessment): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && (int) $assessment->tenant_id === $context->tenantId();
    }
}
