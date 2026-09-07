<?php

namespace App\Http\Middleware;

use App\Domain\Authorization\AuthorizationShadowEvaluator;
use App\Domain\Authorization\PermissionRegistry;
use App\Domain\Tenancy\TenantContext;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsurePermission
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly AuthorizationShadowEvaluator $shadow,
    ) {}

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $granted = $this->context->membership()->permissionNames();
        $allowed = collect($permissions)->contains(fn (string $permission) => in_array($permission, $granted, true));
        $canonicalAllowed = false;
        $privilegedMismatch = false;
        foreach ($permissions as $permission) {
            $capability = PermissionRegistry::canonicalFor($permission);
            if ($capability === null) {
                continue;
            }
            $comparison = $this->shadow->compare($this->context->membership(), $permission, $capability);
            $canonicalAllowed = $canonicalAllowed || $comparison['canonical'];
            $privilegedMismatch = $privilegedMismatch || $comparison['blocksEnforcement'];
        }

        $mode = (string) config('skuggle.authz.mode', 'shadow');
        $tenant = (string) $this->context->tenant()->public_id;
        $canary = in_array($tenant, (array) config('skuggle.authz.canary_tenants', []), true);
        $canonicalEnforced = in_array($mode, ['internal', 'default_canonical'], true) || ($mode === 'canary' && $canary);
        if ($canonicalEnforced && ! $privilegedMismatch) {
            $allowed = $canonicalAllowed;
        }

        if (! $allowed) {
            return ApiResponse::error('FORBIDDEN', 'You do not have permission to perform this action.', 403);
        }

        return $next($request);
    }
}
