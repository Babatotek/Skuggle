<?php

namespace App\Http\Middleware;

use App\Domain\Tenancy\TenantContext;
use App\Models\IdempotencyKey;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

final class Idempotency
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next, string $required = 'optional'): Response
    {
        $key = trim((string) $request->header('Idempotency-Key'));
        if ($key === '') {
            return $required === 'required'
                ? ApiResponse::error('IDEMPOTENCY_KEY_REQUIRED', 'An Idempotency-Key header is required.', 422)
                : $next($request);
        }

        if (! preg_match('/^[A-Za-z0-9._:-]{16,120}$/', $key)) {
            return ApiResponse::error('INVALID_IDEMPOTENCY_KEY', 'The idempotency key format is invalid.', 422);
        }

        $tenantId = $this->context->hasTenant() ? $this->context->tenantId() : null;
        $userId = $request->user()?->getKey();
        $hash = hash('sha256', $request->method().'|'.$request->path().'|'.json_encode($request->all(), JSON_THROW_ON_ERROR));
        $lockKey = sprintf('skuggle:v1:idempotency:%s:%s:%s', $tenantId ?? 'global', $userId ?? hash('sha256', $request->ip()), $key);

        $process = function () use ($request, $next, $key, $hash, $tenantId, $userId): Response {
            $record = IdempotencyKey::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('user_id', $userId)
                ->where('key', $key)
                ->where('expires_at', '>', now())
                ->first();

            if ($record) {
                if (! hash_equals($record->request_hash, $hash)) {
                    return ApiResponse::error('IDEMPOTENCY_CONFLICT', 'This idempotency key was already used for a different request.', 409);
                }

                return response($record->response_body, $record->response_status, [
                    'Content-Type' => 'application/json',
                    'X-Idempotent-Replay' => 'true',
                ]);
            }

            $response = $next($request);
            if ($response->getStatusCode() < 500 && str_contains((string) $response->headers->get('Content-Type'), 'application/json')) {
                try {
                    IdempotencyKey::query()->withoutGlobalScopes()->create([
                        'tenant_id' => $tenantId,
                        'user_id' => $userId,
                        'key' => $key,
                        'request_hash' => $hash,
                        'response_status' => $response->getStatusCode(),
                        'response_body' => $response->getContent(),
                        'expires_at' => now()->addDay(),
                    ]);
                } catch (\Throwable) {
                    // Concurrent writers: unique key conflict — replay the stored response.
                    $existing = IdempotencyKey::query()
                        ->withoutGlobalScopes()
                        ->where('tenant_id', $tenantId)
                        ->where('user_id', $userId)
                        ->where('key', $key)
                        ->first();
                    if ($existing && hash_equals($existing->request_hash, $hash)) {
                        return response($existing->response_body, $existing->response_status, [
                            'Content-Type' => 'application/json',
                            'X-Idempotent-Replay' => 'true',
                        ]);
                    }
                }
            }

            return $response;
        };

        // Shared hosting uses the database cache driver (cache_locks table). If locks are
        // unavailable, fall back to unique-constraint conflict handling above.
        try {
            return Cache::lock($lockKey, 30)->block(5, $process);
        } catch (\Throwable) {
            return $process();
        }
    }
}
