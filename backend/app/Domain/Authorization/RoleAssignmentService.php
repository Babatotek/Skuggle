<?php

namespace App\Domain\Authorization;

use App\Models\Campus;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class RoleAssignmentService
{
    public function __construct(
        private readonly CanonicalAuthorizationEvaluator $authorization,
        private readonly AuditLogger $audit,
    ) {}

    public function assign(TenantMembership $actor, TenantMembership $target, Role $role, array $attributes = []): RoleAssignment
    {
        $this->assertBoundary($target, $role, $attributes['scope_type'] ?? 'TENANT', $attributes['scope_id'] ?? null);
        if ((int) $actor->tenant_id !== (int) $target->tenant_id || $actor->status !== 'active') {
            $this->deny('role_assignment.cross_tenant_rejected', $target, $role, 'CROSS_TENANT_ACTOR');
        }
        if ((int) $actor->getKey() === (int) $target->getKey()) {
            $this->deny('role_assignment.self_grant_rejected', $target, $role, 'SELF_ELEVATION');
        }
        if (! $this->authorization->allows($actor, 'identity.role.manage')) {
            $this->deny('role_assignment.denied', $target, $role, 'ACTOR_NOT_AUTHORIZED');
        }

        $actorCapabilities = array_flip($this->authorization->capabilities($actor));
        foreach ($role->permissions as $permission) {
            if (! $permission instanceof Permission) {
                continue;
            }
            $canonical = PermissionRegistry::canonicalFor($permission->name);
            $definition = $canonical ? PermissionRegistry::definitions()[$canonical] : null;
            if (! $definition || ! $definition['delegable'] || ! isset($actorCapabilities[$canonical])) {
                $this->deny('role_assignment.delegation_rejected', $target, $role, 'NON_DELEGABLE_OR_ABOVE_ACTOR');
            }
        }

        $actorUser = $actor->user()->first();

        return $this->write($target, $role, $actorUser instanceof User ? $actorUser : null, $attributes);
    }

    public function syncLegacyPrimary(TenantMembership $membership, ?User $actor = null): RoleAssignment
    {
        $role = $membership->role()->with('permissions')->firstOrFail();
        if (! $role instanceof Role) {
            throw new \LogicException('Membership role is invalid.');
        }
        $this->assertBoundary($membership, $role, 'TENANT', null);

        return $this->write($membership, $role, $actor, ['source' => RoleAssignment::LEGACY_PRIMARY, 'is_primary' => true]);
    }

    public function revoke(TenantMembership $actor, RoleAssignment $assignment, ?string $reason = null): RoleAssignment
    {
        if ((int) $actor->tenant_id !== (int) $assignment->membership()->value('tenant_id') || (int) $actor->getKey() === (int) $assignment->tenant_membership_id || ! $this->authorization->allows($actor, 'identity.role.manage')) {
            $target = $assignment->membership()->first();
            $role = $assignment->role()->first();
            if (! $target instanceof TenantMembership || ! $role instanceof Role) {
                throw new \LogicException('Assignment references are invalid.');
            }
            $this->deny('role_assignment.revoke_rejected', $target, $role, 'REVOKE_NOT_AUTHORIZED');
        }

        return DB::transaction(function () use ($assignment, $reason): RoleAssignment {
            $locked = RoleAssignment::query()->lockForUpdate()->findOrFail($assignment->getKey());
            $locked->update(['status' => RoleAssignment::REVOKED, 'reason' => $reason]);
            $this->authorization->forget();
            $this->audit->record('role_assignment.revoked', $locked, [], ['membership_id' => $locked->tenant_membership_id, 'role_id' => $locked->role_id]);

            return $locked;
        });
    }

    public function reactivate(TenantMembership $actor, RoleAssignment $assignment, ?string $reason = null): RoleAssignment
    {
        $target = $assignment->membership()->first();
        $role = $assignment->role()->with('permissions')->first();
        if (! $target instanceof TenantMembership || ! $role instanceof Role) {
            throw new \LogicException('Assignment references are invalid.');
        }
        $reactivated = $this->assign($actor, $target, $role, [
            'scope_type' => $assignment->scope_type,
            'scope_id' => $assignment->scope_id,
            'source' => $assignment->source,
            'is_primary' => $assignment->is_primary,
            'starts_at' => $assignment->starts_at,
            'ends_at' => $assignment->ends_at,
            'reason' => $reason,
        ]);
        $this->audit->record('role_assignment.reactivated', $reactivated, [], ['membership_id' => $target->getKey(), 'role_id' => $role->getKey()]);

        return $reactivated;
    }

    /** @return list<array{assignment:RoleAssignment|null,role:Role|null,implicit:bool}> */
    public function effectiveAssignments(TenantMembership $membership): array
    {
        $explicit = RoleAssignment::query()->effective()->where('tenant_membership_id', $membership->getKey())->with('role')->get();
        $result = $explicit->map(fn (RoleAssignment $assignment): array => ['assignment' => $assignment, 'role' => $assignment->role, 'implicit' => false])->all();
        if (! $explicit->contains(fn (RoleAssignment $assignment): bool => (int) $assignment->role_id === (int) $membership->role_id)) {
            $legacyRole = $membership->role;
            array_unshift($result, ['assignment' => null, 'role' => $legacyRole instanceof Role ? $legacyRole : null, 'implicit' => true]);
        }

        return array_values($result);
    }

    private function write(TenantMembership $membership, Role $role, ?User $actor, array $attributes): RoleAssignment
    {
        return DB::transaction(function () use ($membership, $role, $actor, $attributes): RoleAssignment {
            $membership = TenantMembership::query()->lockForUpdate()->findOrFail($membership->getKey());
            $source = $attributes['source'] ?? RoleAssignment::DIRECT;
            $scopeType = strtoupper((string) ($attributes['scope_type'] ?? 'TENANT'));
            $scopeId = $attributes['scope_id'] ?? null;
            $scopeKey = $scopeType === 'TENANT' ? 'TENANT' : 'CAMPUS:'.$scopeId;
            $assignment = RoleAssignment::query()->firstOrNew([
                'tenant_membership_id' => $membership->getKey(), 'role_id' => $role->getKey(),
                'scope_key' => $scopeKey, 'source' => $source,
            ]);
            $assignment->fill([
                'scope_type' => $scopeType, 'scope_id' => $scopeId,
                'status' => RoleAssignment::ACTIVE, 'starts_at' => $attributes['starts_at'] ?? null,
                'ends_at' => $attributes['ends_at'] ?? null, 'is_primary' => (bool) ($attributes['is_primary'] ?? false),
                'assigned_by' => $actor?->getKey(), 'reason' => $attributes['reason'] ?? null,
            ])->save();
            $this->authorization->forget();
            $this->audit->record('role_assignment.assigned', $assignment, [], ['membership_id' => $membership->getKey(), 'role_id' => $role->getKey(), 'scope_type' => $scopeType, 'source' => $source]);

            return $assignment;
        });
    }

    private function assertBoundary(TenantMembership $membership, Role $role, string $scopeType, mixed $scopeId): void
    {
        $tenant = $membership->tenant()->firstOrFail();
        if (! $tenant instanceof Tenant) {
            throw new \LogicException('Membership tenant is invalid.');
        }
        $platformRole = $role->permissions()->where('name', 'like', 'platform.%')->exists();
        if (($tenant->type === 'platform') !== $platformRole) {
            $this->deny('role_assignment.realm_rejected', $membership, $role, 'PRIVILEGE_BOUNDARY_MISMATCH');
        }
        $scopeType = strtoupper($scopeType);
        if (! in_array($scopeType, ['TENANT', 'CAMPUS'], true) || ($scopeType === 'TENANT' && $scopeId !== null)) {
            throw ValidationException::withMessages(['scope' => ['Invalid assignment scope.']]);
        }
        if ($scopeType === 'CAMPUS' && (! $scopeId || ! Campus::query()->whereKey($scopeId)->where('tenant_id', $membership->tenant_id)->exists())) {
            $this->deny('role_assignment.scope_rejected', $membership, $role, 'FOREIGN_OR_UNKNOWN_CAMPUS');
        }
    }

    private function deny(string $event, TenantMembership $membership, Role $role, string $reason): never
    {
        $this->audit->record($event, $membership, [], ['role_id' => $role->getKey(), 'reason_code' => $reason]);
        throw ValidationException::withMessages(['role' => ['Role assignment is not permitted.']]);
    }
}
