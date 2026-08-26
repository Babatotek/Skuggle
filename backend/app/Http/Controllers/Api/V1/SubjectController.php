<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Services\LookupCacheService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);

        // Only cache the unpaginated all-subjects list (perPage = default 20 = full list for most tenants)
        // For custom pagination requests bypass cache to avoid key explosion
        if ($perPage === 20 && ! $request->has('page')) {
            $lookup = app(LookupCacheService::class);
            $all = $lookup->rememberSubjects(function (): array {
                return Subject::query()->where('status', 'active')->orderBy('name')->get()
                    ->map(fn (Subject $item) => $this->present($item))
                    ->values()
                    ->all();
            });

            return ApiResponse::success([
                'data' => $all,
                'meta' => ['currentPage' => 1, 'perPage' => count($all), 'total' => count($all), 'lastPage' => 1],
            ]);
        }

        $paginator = Subject::query()->orderBy('name')->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (Subject $item) => $this->present($item)),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage'     => $paginator->perPage(),
                'total'       => $paginator->total(),
                'lastPage'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:120'],
            'code'   => ['required', 'string', 'max:32'],
            'status' => ['nullable', 'string', 'max:24'],
        ]);

        $subject = Subject::query()->create([
            'name'   => $data['name'],
            'code'   => strtoupper($data['code']),
            'status' => $data['status'] ?? 'active',
        ]);

        // Bust lookup caches so the new subject appears immediately
        app(LookupCacheService::class)->forgetAll();

        return ApiResponse::success($this->present($subject), [], 201);
    }

    private function present(Subject $item): array
    {
        return [
            'id'     => $item->public_id,
            'name'   => $item->name,
            'code'   => $item->code,
            'status' => $item->status,
        ];
    }
}
