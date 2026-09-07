<?php

namespace App\Domain\Authorization;

use App\Domain\Tenancy\TenantContext;
use App\Models\TenantMembership;
use Illuminate\Support\Facades\Log;

final class AuthorizationShadowEvaluator
{
    public function __construct(
        private readonly CanonicalAuthorizationEvaluator $canonical,
        private readonly TenantContext $context,
    ) {}

    /** @return array{legacy:bool,canonical:bool,category:string,blocksEnforcement:bool} */
    public function compare(TenantMembership $membership, string $legacyPermission, string $capability): array
    {
        $legacy = in_array($legacyPermission, $membership->permissionNames(), true);
        $canonical = $this->canonical->allows($membership, $capability);
        $category = match ([$legacy, $canonical]) {
            [true, true] => 'ALLOW_ALLOW',
            [false, false] => 'DENY_DENY',
            [true, false] => 'LEGACY_ALLOW_CANONICAL_DENY',
            [false, true] => 'LEGACY_DENY_CANONICAL_ALLOW',
        };
        $definition = PermissionRegistry::definitions()[$capability] ?? null;
        $privileged = in_array($definition['privilege'] ?? null, [PrivilegeClass::PRIVILEGED->value, PrivilegeClass::PLATFORM_CRITICAL->value], true);
        $blocks = $legacy !== $canonical && $privileged;

        Log::info('authorization_shadow_evaluated', [
            'reason_code' => $category,
            'capability' => $capability,
            'tenant_cohort' => (string) config('skuggle.authz.mode', 'shadow'),
            'correlation_id' => $this->context->correlationId(),
            'blocks_enforcement' => $blocks,
        ]);

        return ['legacy' => $legacy, 'canonical' => $canonical, 'category' => $category, 'blocksEnforcement' => $blocks];
    }

    /** @return array{category:string,legacy:list<string>,assignments:list<string>,blocksEnforcement:bool} */
    public function compareCapabilitySets(TenantMembership $membership): array
    {
        $legacy = collect($membership->permissionNames())->map(fn ($name) => PermissionRegistry::canonicalFor($name))->filter()->unique()->sort()->values();
        $assignments = collect($this->canonical->capabilities($membership))->sort()->values();
        $legacyOnly = $legacy->diff($assignments)->values();
        $assignmentOnly = $assignments->diff($legacy)->values();
        $category = $legacyOnly->isEmpty() && $assignmentOnly->isEmpty() ? 'MATCH' : ($legacyOnly->isNotEmpty() ? 'LEGACY_ONLY_CAPABILITY' : 'ASSIGNMENT_ONLY_CAPABILITY');
        $mismatches = $legacyOnly->merge($assignmentOnly);
        $blocks = $mismatches->contains(fn ($capability) => in_array(PermissionRegistry::definitions()[$capability]['privilege'] ?? null, [PrivilegeClass::PRIVILEGED->value, PrivilegeClass::PLATFORM_CRITICAL->value], true));
        Log::info('role_assignment_shadow_parity', ['reason_code' => $category, 'tenant_id' => $membership->tenant_id, 'membership_id' => $membership->getKey(), 'blocks_enforcement' => $blocks]);

        return ['category' => $category, 'legacy' => $legacyOnly->all(), 'assignments' => $assignmentOnly->all(), 'blocksEnforcement' => $blocks];
    }
}
