<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PersonalPlanItem;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($response = $this->requirePersonalWorkspace($request)) {
            return $response;
        }

        $items = PersonalPlanItem::query()
            ->where('user_id', $request->user()->getKey())
            ->orderBy('completed')
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date')
            ->latest('updated_at')
            ->limit(250)
            ->get();

        return ApiResponse::success($items->map(fn (PersonalPlanItem $item) => $this->present($item)));
    }

    public function store(Request $request): JsonResponse
    {
        if ($response = $this->requirePersonalWorkspace($request)) {
            return $response;
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'dueDate' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $item = PersonalPlanItem::query()->create([
            'user_id' => $request->user()->getKey(),
            'title' => trim($data['title']),
            'due_date' => $data['dueDate'] ?? null,
        ]);

        return ApiResponse::success($this->present($item), [], 201);
    }

    public function update(Request $request, string $planItem): JsonResponse
    {
        if ($response = $this->requirePersonalWorkspace($request)) {
            return $response;
        }

        $item = $this->ownedItem($request, $planItem);
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:160'],
            'dueDate' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'completed' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('title', $data)) {
            $item->title = trim($data['title']);
        }
        if (array_key_exists('dueDate', $data)) {
            $item->due_date = $data['dueDate'];
        }
        if (array_key_exists('completed', $data)) {
            $item->completed = $data['completed'];
            $item->completed_at = $data['completed'] ? now() : null;
        }
        $item->save();

        return ApiResponse::success($this->present($item));
    }

    public function destroy(Request $request, string $planItem): JsonResponse
    {
        if ($response = $this->requirePersonalWorkspace($request)) {
            return $response;
        }

        $this->ownedItem($request, $planItem)->delete();

        return response()->json(null, 204);
    }

    private function requirePersonalWorkspace(Request $request): ?JsonResponse
    {
        if ($request->attributes->get('tenant')?->type === 'individual') {
            return null;
        }

        return ApiResponse::error('PERSONAL_WORKSPACE_REQUIRED', 'Switch to My Skuggle to manage personal plans.', 403);
    }

    private function ownedItem(Request $request, string $publicId): PersonalPlanItem
    {
        return PersonalPlanItem::query()
            ->where('user_id', $request->user()->getKey())
            ->where('public_id', $publicId)
            ->firstOrFail();
    }

    private function present(PersonalPlanItem $item): array
    {
        return [
            'id' => $item->public_id,
            'title' => $item->title,
            'dueDate' => $item->due_date?->format('Y-m-d'),
            'completed' => (bool) $item->completed,
            'createdAt' => $item->created_at?->toIso8601String(),
            'updatedAt' => $item->updated_at?->toIso8601String(),
        ];
    }
}
