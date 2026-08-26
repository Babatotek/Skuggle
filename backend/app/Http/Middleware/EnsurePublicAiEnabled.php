<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsurePublicAiEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('skuggle.ai.public_enabled', false)) {
            return ApiResponse::error('PUBLIC_AI_DISABLED', 'Public AI assistance is not available.', 403);
        }

        return $next($request);
    }
}
