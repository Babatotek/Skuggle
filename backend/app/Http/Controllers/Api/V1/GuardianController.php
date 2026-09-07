<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Student;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuardianController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $query = Guardian::query()->with(['user:id,public_id,name,email', 'students:id,public_id,first_name,last_name'])->latest();
        if ($search = $request->string('q')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        $paginator = $query->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (Guardian $item) => $this->present($item))->values()->all(),
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
            'name' => ['required', 'string', 'max:180'],
            'email' => ['nullable', 'email:rfc', 'max:254'],
            'phone' => ['nullable', 'string', 'max:32'],
            'studentId' => ['nullable', 'string'],
            'relationship' => ['nullable', 'string', 'max:40'],
        ]);
        $guardian = Guardian::query()->create([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? 'not-provided',
        ]);
        if (! empty($data['studentId'])) {
            $student = Student::query()->where('public_id', $data['studentId'])->firstOrFail();
            $guardian->students()->attach($student->getKey(), [
                'tenant_id' => $guardian->tenant_id,
                'relationship' => $data['relationship'] ?? 'guardian',
            ]);
        }

        return ApiResponse::success($this->present($guardian->load(['user:id,public_id,name,email', 'students:id,public_id,first_name,last_name'])), [], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Guardian $item): array
    {
        return [
            'id' => $item->public_id,
            'name' => $item->name,
            'email' => $item->email,
            'phone' => $item->phone,
            'students' => $item->relationLoaded('students')
                ? $item->students->map(fn (Student $student) => trim($student->first_name.' '.$student->last_name))->values()->all()
                : [],
        ];
    }
}
