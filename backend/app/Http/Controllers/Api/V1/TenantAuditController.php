<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantAuditController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = AuditLog::query()
            ->where('tenant_id', $context->tenantId())
            ->orderByDesc('occurred_at')
            ->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (AuditLog $item) => [
                'id' => $item->getKey(),
                'action' => $item->action,
                'resource' => class_basename((string) $item->resource_type),
                'occurredAt' => optional($item->occurred_at)?->toIso8601String(),
                'actorId' => $item->actor_id,
            ])->values()->all(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }
}
