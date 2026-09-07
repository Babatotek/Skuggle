<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SchoolModuleRecord;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HelpSupportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $paginator = SchoolModuleRecord::query()
            ->where('module', 'help-tickets')
            ->where('created_by', $request->user()->getKey())
            ->latest()
            ->paginate(min(max($request->integer('perPage', 20), 1), 100));

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (SchoolModuleRecord $item) => [
                'id' => $item->public_id,
                'title' => $item->title,
                'status' => $item->status,
                'payload' => $item->payload ?? [],
                'createdAt' => $item->created_at?->toIso8601String(),
            ])->values()->all(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(Request $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'body' => ['required', 'string', 'max:5000'],
        ]);
        $record = SchoolModuleRecord::query()->create([
            'module' => 'help-tickets',
            'title' => $data['title'],
            'status' => 'open',
            'payload' => ['body' => $data['body']],
            'created_by' => $request->user()->getKey(),
        ]);
        $audit->record('help.ticket.created', $record, [], ['title' => $record->title]);

        return ApiResponse::success([
            'id' => $record->public_id,
            'title' => $record->title,
            'status' => $record->status,
            'payload' => $record->payload,
            'createdAt' => $record->created_at?->toIso8601String(),
        ], [], 201);
    }
}
