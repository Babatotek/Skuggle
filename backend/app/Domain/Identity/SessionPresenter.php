<?php

namespace App\Domain\Identity;

use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Campus;
use App\Models\TenantMembership;
use App\Models\Term;
use App\Models\User;

final class SessionPresenter
{
    public function __construct(private readonly TenantContext $context) {}

    public function present(User $user, ?TenantMembership $membership = null): array
    {
        $membership ??= $this->context->membership();
        $tenant = $membership->tenant;
        $role = $membership->role;
        $mfaPolicyEnabled = (bool) data_get($tenant->settings, 'security.require_mfa_for_privileged_roles', false);
        $campus = $this->findContextModel(Campus::class, session('campus_public_id'));
        $academicSession = $this->findContextModel(AcademicSession::class, session('academic_session_public_id'));
        $term = $this->findContextModel(Term::class, session('term_public_id'));

        return [
            'id' => $user->public_id,
            'name' => $user->name,
            'email' => $user->email,
            'emailVerified' => $user->hasVerifiedEmail(),
            'role' => $role->name,
            'roleLabel' => $role->label,
            'permissions' => $membership->permissionNames(),
            'avatarUrl' => $user->avatar_url ?: data_get($user->preferences, 'avatar_url'),
            'privileged' => (bool) $role->privileged,
            'mfaConfirmed' => filled($user->two_factor_confirmed_at),
            'mfaPolicyEnabled' => $mfaPolicyEnabled,
            'mfaRequired' => $mfaPolicyEnabled && (bool) $role->privileged,
            'tenant' => [
                'id' => $tenant->public_id,
                'name' => $tenant->name,
                'code' => $tenant->code,
                'type' => $tenant->type,
                'status' => $tenant->status,
                'logoUrl' => data_get($tenant->settings, 'branding.logo_url'),
                'className' => data_get($tenant->settings, 'profile.class_name'),
            ],
            'memberships' => $user->memberships()
                ->with(['tenant', 'role'])
                ->where('status', 'active')
                ->get()
                ->filter(function (TenantMembership $item): bool {
                    $t = $item->tenant;
                    if (! $t) {
                        return false;
                    }
                    if ($t->type === 'individual') {
                        return in_array($t->status, ['active', 'trial'], true);
                    }

                    // Members can switch into trial schools; suspended stay hidden.
                    return in_array($t->status, ['active', 'trial'], true);
                })
                ->map(fn (TenantMembership $item) => [
                    'tenantId' => $item->tenant->public_id,
                    'tenantName' => $item->tenant->name,
                    'tenantCode' => $item->tenant->code,
                    'tenantType' => $item->tenant->type,
                    'tenantStatus' => $item->tenant->status,
                    'role' => $item->role->name,
                    'roleLabel' => $item->role->label,
                    'logoUrl' => data_get($item->tenant->settings, 'branding.logo_url'),
                    'current' => $item->tenant->public_id === $tenant->public_id,
                ])
                ->values(),
            'context' => array_filter([
                'campus' => $campus ? ['id' => $campus->public_id, 'name' => $campus->name] : null,
                'session' => $academicSession ? ['id' => $academicSession->public_id, 'name' => $academicSession->name] : null,
                'term' => $term ? ['id' => $term->public_id, 'name' => $term->name] : null,
            ]),
        ];
    }

    private function findContextModel(string $model, ?string $publicId)
    {
        return $publicId ? $model::query()->where('public_id', $publicId)->first() : null;
    }
}
