<?php

namespace App\Domain\Authorization;

use App\Domain\Tenancy\TenantContext;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\Tenant;
use App\Models\TenantMembership;
use Illuminate\Support\Facades\Log;

final class CanonicalAuthorizationEvaluator
{
    /** @var array<string, array<string, true>> */
    private array $requestCache = [];

    public function __construct(private readonly TenantContext $context) {}

    public function allows(TenantMembership $membership, string $capability): bool
    {
        if (! isset(PermissionRegistry::definitions()[$capability])) {
            Log::warning('canonical_authorization_unknown_permission', ['reason_code' => 'UNKNOWN_PERMISSION', 'capability' => $capability, 'correlation_id' => $this->context->hasTenant() ? $this->context->correlationId() : null]);

            return false;
        }
        $tenant = $membership->tenant;
        if (! $tenant instanceof Tenant || $membership->status !== 'active' || ! in_array($tenant->status, ['active', 'trial'], true)) {
            return false;
        }
        if (! $this->context->hasTenant() || $this->context->tenantId() !== (int) $membership->tenant_id) {
            return false;
        }
        if (str_starts_with($capability, 'platform.') && $tenant->type !== 'platform') {
            return false;
        }

        return isset($this->effective($membership)[$capability]);
    }

    /** @return list<string> */
    public function capabilities(TenantMembership $membership): array
    {
        $keys = array_keys($this->effective($membership));
        sort($keys);

        return $keys;
    }

    public function forget(): void
    {
        $this->requestCache = [];
    }

    /** @return array<string, true> */
    private function effective(TenantMembership $membership): array
    {
        // Mutations go through RoleAssignmentService, which clears this request-scoped
        // cache. Including the current second makes temporal boundaries visible
        // without issuing a cache-version query on every authorization check.
        $cacheKey = PermissionRegistry::VERSION.':'.$membership->getKey().':'.$membership->role_id.':'.$membership->updated_at?->getTimestamp().':'.now()->getTimestamp();
        if (isset($this->requestCache[$cacheKey])) {
            return $this->requestCache[$cacheKey];
        }

        $legacyRole = $membership->role;
        $assignments = $membership->relationLoaded('roleAssignments')
            ? $membership->roleAssignments->filter(fn ($assignment): bool => $assignment instanceof RoleAssignment && $assignment->isEffective())
            : RoleAssignment::query()->effective()->where('tenant_membership_id', $membership->getKey())->with('role.permissions')->get();
        $roles = collect();
        // role_id remains an implicit assignment. A backfilled copy is de-duplicated by role key.
        if ($legacyRole instanceof Role) {
            $roles->push($legacyRole->loadMissing('permissions'));
        }
        $roles = $roles->merge($assignments->pluck('role')->filter());
        $grants = $roles->unique('id')->flatMap(fn (Role $role) => $role->permissions->pluck('name'))->all();
        $effective = [];
        foreach ($grants as $grant) {
            $canonical = PermissionRegistry::canonicalFor((string) $grant);
            if ($canonical !== null) {
                $effective[$canonical] = true;
                if ($canonical !== $grant) {
                    Log::info('canonical_authorization_legacy_alias_used', ['reason_code' => 'LEGACY_ALIAS_USED', 'capability' => $canonical, 'correlation_id' => $this->context->correlationId()]);
                }
            }
        }

        return $this->requestCache[$cacheKey] = $effective;
    }
}
