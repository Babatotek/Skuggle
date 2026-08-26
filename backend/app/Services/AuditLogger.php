<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

final class AuditLogger
{
    public function __construct(private readonly TenantContext $context) {}

    public function record(
        string $action,
        Model|string|null $resource = null,
        array $before = [],
        array $after = [],
        array $metadata = [],
    ): void {
        /** @var Request|null $request */
        $request = app()->bound('request') ? request() : null;

        AuditLog::query()->withoutGlobalScopes()->create([
            'tenant_id' => $this->context->hasTenant() ? $this->context->tenantId() : null,
            'actor_id' => $request?->user()?->getKey(),
            'action' => $action,
            'resource_type' => $resource instanceof Model ? $resource::class : (is_string($resource) ? $resource : null),
            'resource_id' => $resource instanceof Model ? (string) ($resource->public_id ?? $resource->getKey()) : null,
            'request_id' => $request?->attributes->get('request_id'),
            'ip_hash' => $request?->ip() ? hash_hmac('sha256', $request->ip(), (string) config('app.key')) : null,
            'user_agent' => mb_substr((string) $request?->userAgent(), 0, 500),
            'before_values' => $this->redact($before),
            'after_values' => $this->redact($after),
            'metadata' => $metadata,
            'occurred_at' => now(),
        ]);
    }

    private function redact(array $values): array
    {
        $blocked = ['password', 'password_confirmation', 'token', 'secret', 'pin', 'api_key'];

        return collect($values)->mapWithKeys(function ($value, string $key) use ($blocked): array {
            $sensitive = collect($blocked)->contains(fn (string $needle) => str_contains(strtolower($key), $needle));

            return [$key => $sensitive ? '[REDACTED]' : $value];
        })->all();
    }
}
