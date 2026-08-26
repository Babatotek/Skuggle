<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = Department::query()->orderBy('name')->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (Department $item) => $this->present($item)),
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
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:32'],
        ]);

        $department = Department::query()->create([
            'name' => $data['name'],
            'code' => strtoupper($data['code']),
        ]);

        return ApiResponse::success($this->present($department), [], 201);
    }

    private function present(Department $item): array
    {
        return [
            'id' => $item->public_id,
            'name' => $item->name,
            'code' => $item->code,
        ];
    }
}
