<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = Message::query()
            ->where('recipient_id', $request->user()->getKey())
            ->with('sender:id,public_id,name')
            ->latest()
            ->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (Message $item) => $this->present($item)),
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
            'recipient_id' => ['required', 'string'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $recipient = User::query()->where('public_id', $data['recipient_id'])->firstOrFail();

        $message = Message::query()->create([
            'sender_id' => $request->user()->getKey(),
            'recipient_id' => $recipient->getKey(),
            'body' => $data['body'],
        ]);

        return ApiResponse::success($this->present($message->load('sender:id,public_id,name')), [], 201);
    }

    private function present(Message $item): array
    {
        return [
            'id' => $item->public_id,
            'body' => $item->body,
            'readAt' => $item->read_at?->toIso8601String(),
            'createdAt' => $item->created_at?->toIso8601String(),
            'sender' => $item->relationLoaded('sender') && $item->sender
                ? ['id' => $item->sender->public_id, 'name' => $item->sender->name]
                : null,
        ];
    }
}
