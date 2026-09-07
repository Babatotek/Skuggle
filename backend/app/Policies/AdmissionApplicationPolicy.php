<?php

namespace App\Policies;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Authorization\PermissionRegistry;
use App\Domain\Tenancy\TenantContext;
use App\Models\AdmissionApplication;
use App\Models\User;

class AdmissionApplicationPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->allowsAny(['admissions.application.view', 'admissions.application.manage']);
    }

    public function view(User $user, AdmissionApplication $application): bool
    {
        return $this->sameTenant($application)
            && $this->allowsAny(['admissions.application.view', 'admissions.application.manage']);
    }

    public function create(User $user): bool
    {
        return $this->allowsAny(['admissions.application.create', 'admissions.application.manage']);
    }

    public function update(User $user, AdmissionApplication $application): bool
    {
        return $this->sameTenant($application)
            && $this->allowsAny(['admissions.application.update', 'admissions.application.manage']);
    }

    public function screen(User $user, AdmissionApplication $application): bool
    {
        return $this->sameTenant($application) && $this->allowsAny(['admissions.screening.manage']);
    }

    public function decide(User $user, AdmissionApplication $application): bool
    {
        return $this->sameTenant($application) && $this->allowsAny(['admissions.decision.manage']);
    }

    public function convert(User $user, AdmissionApplication $application): bool
    {
        return $this->sameTenant($application) && $this->allowsAny(['admissions.enrolment.convert']);
    }

    public function manageDocuments(User $user, AdmissionApplication $application): bool
    {
        return $this->sameTenant($application) && $this->allowsAny(['admissions.document.manage']);
    }

    /** @param list<string> $capabilities */
    private function allowsAny(array $capabilities): bool
    {
        $context = app(TenantContext::class);
        if (! $context->hasTenant()) {
            return false;
        }

        $evaluator = app(CanonicalAuthorizationEvaluator::class);
        $membership = $context->membership();
        foreach ($capabilities as $capability) {
            $canonical = PermissionRegistry::canonicalFor($capability) ?? $capability;
            if ($evaluator->allows($membership, $canonical)) {
                return true;
            }
        }

        $legacy = $membership->permissionNames();

        return collect($capabilities)->contains(fn (string $capability) => in_array($capability, $legacy, true)
            || in_array('admissions.manage', $legacy, true) && str_starts_with($capability, 'admissions.'));
    }

    private function sameTenant(AdmissionApplication $application): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && (int) $application->tenant_id === $context->tenantId();
    }
}
