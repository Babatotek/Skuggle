<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class NotificationController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $limit = min(max($request->integer('limit', 30), 1), 100);
        $query = $request->user()->notifications()
            ->where(fn ($builder) => $builder->where('tenant_id', $context->tenantId())->orWhereNull('tenant_id'));

        return ApiResponse::success([
            'unreadCount' => (clone $query)->whereNull('read_at')->count(),
            'data' => $query->latest()->limit($limit)->get()->map(fn ($item) => [
                'id' => $item->id,
                'title' => data_get($item->data, 'title', 'Notification'),
                'description' => data_get($item->data, 'description', data_get($item->data, 'message')),
                'type' => data_get($item->data, 'type', 'info'),
                'actionUrl' => data_get($item->data, 'actionUrl'),
                'read' => filled($item->read_at),
                'createdAt' => $item->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function markRead(Request $request, TenantContext $context, string $notification): JsonResponse
    {
        $item = $request->user()->notifications()
            ->where(fn ($builder) => $builder->where('tenant_id', $context->tenantId())->orWhereNull('tenant_id'))
            ->whereKey($notification)
            ->firstOrFail();
        $item->markAsRead();

        return ApiResponse::success(['id' => $item->id, 'read' => true]);
    }

    public function markAllRead(Request $request, TenantContext $context): JsonResponse
    {
        $updated = $request->user()->unreadNotifications()
            ->where(fn ($builder) => $builder->where('tenant_id', $context->tenantId())->orWhereNull('tenant_id'))
            ->update(['read_at' => now()]);

        return ApiResponse::success(['updated' => $updated]);
    }
}
