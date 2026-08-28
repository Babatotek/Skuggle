<?php

namespace App\Http\Middleware;

use App\Domain\Tenancy\TenantContext;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireMfaForPrivilegedRole
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->context->hasTenant()) {
            return $next($request);
        }

        // Privileged users may read data and configure MFA; mutating actions require MFA.
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        if ($request->is('api/v1/auth/mfa/*') || $request->is('api/v1/auth/logout')) {
            return $next($request);
        }

        $membership = $this->context->membership();
        $policyEnabled = (bool) data_get(
            $membership->tenant->settings,
            'security.require_mfa_for_privileged_roles',
            false,
        );

        if ($policyEnabled && (bool) $membership->role->privileged && ! filled($request->user()?->two_factor_confirmed_at)) {
            return ApiResponse::error(
                'MFA_ENROLLMENT_REQUIRED',
                'Multi-factor authentication must be configured before performing privileged changes.',
                403,
            );
        }

        return $next($request);
    }
}
