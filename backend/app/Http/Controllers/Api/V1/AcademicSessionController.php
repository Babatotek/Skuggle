<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Term;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = AcademicSession::query()
            ->with(['terms' => fn ($q) => $q->orderBy('sequence')])
            ->orderByDesc('starts_at')
            ->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (AcademicSession $item) => $this->present($item)),
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
            'name' => ['required', 'string', 'max:64'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'isCurrent' => ['nullable', 'boolean'],
            'terms' => ['required', 'array', 'min:1', 'max:12'],
            'terms.*.name' => ['required', 'string', 'max:64'],
            'terms.*.sequence' => ['required', 'integer', 'min:1', 'max:12'],
            'terms.*.startsAt' => ['required', 'date'],
            'terms.*.endsAt' => ['required', 'date'],
            'terms.*.isCurrent' => ['nullable', 'boolean'],
        ]);

        $session = DB::transaction(function () use ($data) {
            $isCurrent = (bool) ($data['isCurrent'] ?? true);

            if ($isCurrent) {
                AcademicSession::query()->update(['is_current' => false]);
                Term::query()->update(['is_current' => false]);
            }

            $session = AcademicSession::query()->create([
                'name' => $data['name'],
                'starts_at' => $data['startsAt'],
                'ends_at' => $data['endsAt'],
                'is_current' => $isCurrent,
                'status' => 'active',
            ]);

            foreach ($data['terms'] as $termData) {
                $termIsCurrent = (bool) ($termData['isCurrent'] ?? false);
                if ($termIsCurrent) {
                    Term::query()->update(['is_current' => false]);
                }

                Term::query()->create([
                    'academic_session_id' => $session->getKey(),
                    'name' => $termData['name'],
                    'sequence' => $termData['sequence'],
                    'starts_at' => $termData['startsAt'],
                    'ends_at' => $termData['endsAt'],
                    'is_current' => $termIsCurrent,
                ]);
            }

            if (! Term::query()->where('is_current', true)->exists()) {
                Term::query()
                    ->where('academic_session_id', $session->getKey())
                    ->orderBy('sequence')
                    ->limit(1)
                    ->update(['is_current' => true]);
            }

            return $session->load(['terms' => fn ($q) => $q->orderBy('sequence')]);
        });

        return ApiResponse::success($this->present($session), [], 201);
    }

    private function present(AcademicSession $item): array
    {
        return [
            'id' => $item->public_id,
            'name' => $item->name,
            'startsAt' => $item->starts_at?->toDateString(),
            'endsAt' => $item->ends_at?->toDateString(),
            'isCurrent' => (bool) $item->is_current,
            'status' => $item->status,
            'terms' => $item->relationLoaded('terms')
                ? $item->terms->map(fn (Term $term) => [
                    'id' => $term->public_id,
                    'name' => $term->name,
                    'sequence' => $term->sequence,
                    'startsAt' => $term->starts_at?->toDateString(),
                    'endsAt' => $term->ends_at?->toDateString(),
                    'isCurrent' => (bool) $term->is_current,
                ])->values()->all()
                : [],
        ];
    }
}
