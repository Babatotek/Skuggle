<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = Campus::query()->orderBy('name')->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (Campus $item) => $this->present($item)),
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
            'name' => ['required', 'string', 'max:160'],
            'code' => ['required', 'string', 'max:32'],
            'status' => ['nullable', 'string', 'max:24'],
        ]);

        $campus = Campus::query()->create([
            'name' => $data['name'],
            'code' => strtoupper($data['code']),
            'status' => $data['status'] ?? 'active',
        ]);

        return ApiResponse::success($this->present($campus), [], 201);
    }

    private function present(Campus $item): array
    {
        return [
            'id' => $item->public_id,
            'name' => $item->name,
            'code' => $item->code,
            'status' => $item->status,
        ];
    }
}
