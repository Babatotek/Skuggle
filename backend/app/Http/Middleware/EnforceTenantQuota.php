<?php

namespace App\Http\Middleware;

use App\Domain\Tenancy\TenantContext;
use App\Models\AiRequest;
use App\Models\Student;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnforceTenantQuota
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next, string $quota): Response
    {
        $tenant = $this->context->tenant();
        $limits = $tenant->quota_limits ?? [];
        $limit = $limits[$quota] ?? null;

        if (! is_numeric($limit)) {
            return $next($request);
        }

        $usage = $this->currentUsage($quota, $tenant->quota_usage ?? []);

        if ($usage >= (int) $limit) {
            return ApiResponse::error('QUOTA_EXCEEDED', 'This workspace has reached its plan limit for this operation.', 429);
        }

        return $next($request);
    }

    /**
     * @param  array<string, mixed>  $storedUsage
     */
    private function currentUsage(string $quota, array $storedUsage): int
    {
        return match ($quota) {
            'ai_requests_per_day' => AiRequest::query()
                ->whereDate('created_at', today())
                ->count(),
            'students' => Student::query()->count(),
            default => (int) ($storedUsage[$quota] ?? 0),
        };
    }
}
