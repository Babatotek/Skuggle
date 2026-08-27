<?php

namespace App\Http\Middleware;

use App\Domain\Tenancy\TenantContext;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
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
        if ($headerTenant !== '') {
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

        $this->context->set($membership->tenant, $membership);
        $request->attributes->set('tenant', $membership->tenant);
        $request->attributes->set('membership', $membership);

        try {
            return $next($request);
        } finally {
            $this->context->clear();
        }
    }
}
