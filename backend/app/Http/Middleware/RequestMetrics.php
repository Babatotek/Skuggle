<?php

namespace App\Http\Middleware;

use App\Domain\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

final class RequestMetrics
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);
        $response = $next($request);
        $elapsed = round((hrtime(true) - $startedAt) / 1_000_000, 2);
        $context = app(TenantContext::class);

        Log::info('request.completed', [
            'request_id' => $request->attributes->get('request_id'),
            'tenant_id' => $context->hasTenant() ? $context->tenantId() : null,
            'user_id' => $request->user()?->getKey(),
            'method' => $request->method(),
            'route' => $request->route()?->getName(),
            'status' => $response->getStatusCode(),
            'response_time_ms' => $elapsed,
            'memory_bytes' => memory_get_peak_usage(true),
        ]);

        if ($elapsed >= (float) config('skuggle.observability.slow_request_ms', 500)) {
            Log::warning('request.slow', ['request_id' => $request->attributes->get('request_id'), 'response_time_ms' => $elapsed]);
        }

        return $response;
    }
}
