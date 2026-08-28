<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LessonPlan;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LessonPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = LessonPlan::query()->where('created_by', $request->user()->getKey())->latest()->limit(100)->get()->map(fn (LessonPlan $item) => $this->present($item));
        return ApiResponse::success(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePlan($request);
        $item = LessonPlan::query()->create(['title' => $data['title'], 'content' => json_encode($data['content'], JSON_THROW_ON_ERROR), 'status' => $data['status'] ?? 'draft', 'created_by' => $request->user()->getKey()]);
        return ApiResponse::success($this->present($item), [], 201);
    }

    public function update(Request $request, string $lessonPlan): JsonResponse
    {
        $item = LessonPlan::query()->where('public_id', $lessonPlan)->where('created_by', $request->user()->getKey())->firstOrFail();
        $data = $this->validatePlan($request);
        $item->update(['title' => $data['title'], 'content' => json_encode($data['content'], JSON_THROW_ON_ERROR), 'status' => $data['status'] ?? $item->status, 'revision' => $item->revision + 1]);
        return ApiResponse::success($this->present($item));
    }

    private function validatePlan(Request $request): array
    {
        return $request->validate(['title' => ['required', 'string', 'max:220'], 'content' => ['required', 'array'], 'status' => ['nullable', 'in:draft,reviewed,published']]);
    }

    private function present(LessonPlan $item): array
    {
        return ['id' => $item->public_id, 'title' => $item->title, 'content' => json_decode($item->content, true, flags: JSON_THROW_ON_ERROR), 'status' => $item->status, 'revision' => (int) $item->revision, 'createdAt' => $item->created_at?->toIso8601String()];
    }
}
