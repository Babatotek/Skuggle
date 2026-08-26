<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\SchoolClass;
use App\Services\LookupCacheService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = SchoolClass::query()->orderBy('name')->orderBy('arm')->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (SchoolClass $item) => $this->present($item)),
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
            'name' => ['required', 'string', 'max:100'],
            'arm' => ['nullable', 'string', 'max:40'],
            'campus_id' => ['nullable', 'string'],
            'educational_level' => ['nullable', 'string', 'max:80'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string', 'max:24'],
        ]);

        $campusId = null;
        if (! empty($data['campus_id'])) {
            $campusId = Campus::query()->where('public_id', $data['campus_id'])->firstOrFail()->getKey();
        }

        $class = SchoolClass::query()->create([
            'name' => $data['name'],
            'arm' => $data['arm'] ?? null,
            'campus_id' => $campusId,
            'educational_level' => $data['educational_level'] ?? null,
            'capacity' => $data['capacity'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        app(LookupCacheService::class)->forgetAll();

        return ApiResponse::success($this->present($class), [], 201);
    }

    private function present(SchoolClass $item): array
    {
        return [
            'id' => $item->public_id,
            'name' => $item->name,
            'arm' => $item->arm,
            'educationalLevel' => $item->educational_level,
            'capacity' => $item->capacity,
            'status' => $item->status,
        ];
    }
}
