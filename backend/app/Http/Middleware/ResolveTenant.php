<?php

namespace App\Http\Middleware;

use App\Domain\Tenancy\TenantContext;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

final class ResolveTenant
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return ApiResponse::error('UNAUTHENTICATED', 'Authentication is required.', 401);
        }

        $requestedPublicId = null;
        if ($request->hasSession()) {
            $requestedPublicId = $request->session()->get('tenant_public_id');
        }
        $headerTenant = trim((string) $request->header('X-Tenant-Id', ''));
        if ($headerTenant !== '' && $requestedPublicId !== null && ! hash_equals((string) $requestedPublicId, $headerTenant)) {
            Log::warning('tenant_context_mismatch', ['reason_code' => 'TENANT_HEADER_SESSION_MISMATCH', 'correlation_id' => (string) $request->attributes->get('request_id'), 'route' => $request->route()?->getName() ?? 'unnamed']);
            if (! $request->is('api/v1/auth/switch-workspace')) {
                return ApiResponse::error('TENANT_CONTEXT_MISMATCH', 'The requested workspace does not match the authenticated session.', 403);
            }
        }
        if ($headerTenant !== '' && $requestedPublicId === null) {
            $requestedPublicId = $headerTenant;
        }

        $memberships = $user->memberships()
            ->with(['tenant', 'role.permissions'])
            ->where('status', 'active')
            ->get();

        $membership = $requestedPublicId
            ? $memberships->first(function ($item) use ($requestedPublicId) {
                $tenant = $item->tenant;
                if (! $tenant) {
                    return false;
                }

                return hash_equals((string) $tenant->public_id, (string) $requestedPublicId);
            })
            : $memberships->first(fn ($item) => $item->tenant !== null);

        if (! $membership || ! $membership->tenant) {
            return ApiResponse::error('TENANT_MEMBERSHIP_REQUIRED', 'No active school or learning workspace is available.', 403);
        }

        if (! in_array($membership->tenant->status, ['active', 'trial'], true)) {
            return ApiResponse::error('TENANT_UNAVAILABLE', 'This workspace is not currently active.', 403);
        }

        $this->context->set($membership->tenant, $membership, (string) $request->attributes->get('request_id'));
        $request->attributes->set('tenant', $membership->tenant);
        $request->attributes->set('membership', $membership);
        $request->attributes->set('tenant_context_version', TenantContext::VERSION);

        try {
            return $next($request);
        } finally {
            $this->context->clear();
        }
    }
}
