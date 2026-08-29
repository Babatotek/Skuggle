<?php

namespace App\Http\Middleware;

use App\Domain\Tenancy\TenantContext;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAccountModuleAccess
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next, string $module): Response
    {
        $tenantType = (string) $this->context->tenant()->type;
        $role = (string) $this->context->membership()->role?->name;

        $allowed = match ($module) {
            'launch', 'invitations' => $tenantType === 'school' && $role === 'school_admin',
            'subscription' => $tenantType === 'personal'
                || ($tenantType === 'school' && in_array($role, ['school_admin', 'bursar'], true)),
            'platform-configuration' => $tenantType === 'platform'
                && in_array($role, ['platform_owner', 'platform_super_admin'], true),
            default => false,
        };

        if (! $allowed) {
            return ApiResponse::error('FORBIDDEN', 'This module is not available for the active workspace and role.', 403);
        }

        return $next($request);
    }
}
