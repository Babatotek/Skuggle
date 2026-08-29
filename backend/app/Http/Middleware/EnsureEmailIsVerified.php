<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasVerifiedEmail()) {
            return ApiResponse::error(
                'EMAIL_UNVERIFIED',
                'Verify your email address before continuing.',
                403,
                $user?->email ? ['email' => [(string) $user->email]] : [],
            );
        }

        return $next($request);
    }
}
