<?php

namespace App\Http\Middleware;

use App\Domain\Tenancy\TenantContext;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsurePermission
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $granted = $this->context->membership()->permissionNames();
        $allowed = collect($permissions)->contains(fn (string $permission) => in_array($permission, $granted, true));

        if (! $allowed) {
            return ApiResponse::error('FORBIDDEN', 'You do not have permission to perform this action.', 403);
        }

        return $next($request);
    }
}
