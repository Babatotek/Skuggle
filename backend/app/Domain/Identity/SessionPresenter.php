<?php

namespace App\Domain\Identity;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Authorization\PermissionRegistry;
use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Campus;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\TenantMembership;
use App\Models\Term;
use App\Models\User;

final class SessionPresenter
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly CanonicalAuthorizationEvaluator $authorization,
    ) {}

    public function present(User $user, ?TenantMembership $membership = null): array
    {
        $membership ??= $this->context->membership();
        $tenant = $membership->tenant;
        $role = $membership->role;
        if (! $role instanceof Role) {
            throw new \LogicException('Active membership has no compatibility role.');
        }
        $mfaPolicyEnabled = (bool) data_get($tenant->settings, 'security.require_mfa_for_privileged_roles', false);
        $campus = $this->findContextModel(Campus::class, session('campus_public_id'));
        $academicSession = $this->findContextModel(AcademicSession::class, session('academic_session_public_id'));
        $term = $this->findContextModel(Term::class, session('term_public_id'));

        $legacyPermissions = $membership->permissionNames();
        $capabilities = $this->authorization->capabilities($membership);
        $assignments = RoleAssignment::query()->effective()->where('tenant_membership_id', $membership->getKey())
            ->with('role:id,name,label,privileged')->orderByDesc('is_primary')->orderBy('id')->get();
        $roles = $assignments->pluck('role')->filter()->push($role)->unique('id')->values();

        return [
            'id' => $user->public_id,
            'name' => $user->name,
            'email' => $user->email,
            'emailVerified' => $user->hasVerifiedEmail(),
            'role' => $role->name,
            'roleLabel' => $role->label,
            'roles' => $roles->map(fn (Role $item) => ['name' => $item->name, 'label' => $item->label, 'privileged' => (bool) $item->privileged])->all(),
            'assignments' => $assignments->map(fn (RoleAssignment $assignment) => [
                'id' => $assignment->public_id,
                'role' => $assignment->role?->name,
                'scopeType' => $assignment->scope_type,
                'startsAt' => $assignment->starts_at?->toIso8601String(),
                'endsAt' => $assignment->ends_at?->toIso8601String(),
                'source' => $assignment->source,
                'primary' => $assignment->is_primary,
            ])->all(),
            'personaHint' => $role->name,
            'permissions' => $legacyPermissions,
            'access' => [
                'capabilities' => $capabilities,
                'legacyPermissions' => $legacyPermissions,
                'registryVersion' => PermissionRegistry::VERSION,
            ],
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
                ->filter(function ($item): bool {
                    if (! $item instanceof TenantMembership) {
                        return false;
                    }
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
                ->map(function ($item) use ($tenant): array {
                    if (! $item instanceof TenantMembership) {
                        throw new \LogicException('Membership collection contains an invalid model.');
                    }
                    $itemRole = $item->role;

                    return [
                        'tenantId' => $item->tenant->public_id,
                        'tenantName' => $item->tenant->name,
                        'tenantCode' => $item->tenant->code,
                        'tenantType' => $item->tenant->type,
                        'tenantStatus' => $item->tenant->status,
                        'role' => $itemRole instanceof Role ? $itemRole->name : null,
                        'roleLabel' => $itemRole instanceof Role ? $itemRole->label : null,
                        'logoUrl' => data_get($item->tenant->settings, 'branding.logo_url'),
                        'current' => $item->tenant->public_id === $tenant->public_id,
                    ];
                })
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
