<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = Announcement::query()->latest('published_at')->latest()->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (Announcement $item) => $this->present($item)),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:220'],
            'body' => ['required', 'string'],
            'audience' => ['required', 'array', 'min:1'],
            'audience.*' => ['string', 'max:64'],
            'status' => ['nullable', 'string', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
        ]);

        $status = $data['status'] ?? 'draft';
        $announcement = Announcement::query()->create([
            'title' => $data['title'],
            'body' => $data['body'],
            'audience' => $data['audience'],
            'status' => $status,
            'published_at' => $status === 'published' ? ($data['published_at'] ?? now()) : ($data['published_at'] ?? null),
            'created_by' => $request->user()->getKey(),
        ]);

        return ApiResponse::success($this->present($announcement), [], 201);
    }

    private function present(Announcement $item): array
    {
        return [
            'id' => $item->public_id,
            'title' => $item->title,
            'body' => $item->body,
            'audience' => $item->audience,
            'status' => $item->status,
            'publishedAt' => $item->published_at?->toIso8601String(),
            'createdAt' => $item->created_at?->toIso8601String(),
        ];
    }
}
