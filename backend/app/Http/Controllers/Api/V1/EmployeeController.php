<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Employee;
use App\Services\CustomFieldRegistry;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly CustomFieldRegistry $customFields,
    ) {}

    public function lookups(): JsonResponse
    {
        return ApiResponse::success([
            'customFields' => $this->customFields->definitions(
                $this->context->tenant(),
                CustomFieldRegistry::ENTITY_STAFF,
                true,
            ),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = Employee::query()->with('department')->orderBy('name')->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (Employee $item) => $this->present($item)),
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
            'employee_number' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:180'],
            'employment_type' => ['required', 'string', 'max:48'],
            'department_id' => ['nullable', 'string'],
            'started_at' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:24'],
            'countryCode' => ['nullable', 'string', 'max:8'],
            'stateRegion' => ['nullable', 'string', 'max:120'],
            'localGovernmentArea' => ['nullable', 'string', 'max:120'],
            'customFields' => ['nullable'],
        ]);

        $departmentId = null;
        if (! empty($data['department_id'])) {
            $departmentId = Department::query()->where('public_id', $data['department_id'])->firstOrFail()->getKey();
        }

        $customFieldValues = $this->resolveCustomFieldInput($request);
        $validatedCustomFields = $this->customFields->validateValues(
            $this->context->tenant(),
            CustomFieldRegistry::ENTITY_STAFF,
            $customFieldValues,
            true,
        );

        $employee = Employee::query()->create([
            'employee_number' => $data['employee_number'],
            'name' => $data['name'],
            'employment_type' => $data['employment_type'],
            'department_id' => $departmentId,
            'started_at' => $data['started_at'] ?? null,
            'status' => $data['status'] ?? 'active',
            'country_code' => $data['countryCode'] ?? null,
            'state_region' => $data['stateRegion'] ?? null,
            'local_government_area' => $data['localGovernmentArea'] ?? null,
            'metadata' => $validatedCustomFields === [] ? null : ['custom_fields' => $validatedCustomFields],
        ]);

        return ApiResponse::success($this->present($employee->load('department')), [], 201);
    }

    private function present(Employee $item): array
    {
        $meta = is_array($item->metadata) ? $item->metadata : [];

        return [
            'id' => $item->public_id,
            'employeeNumber' => $item->employee_number,
            'name' => $item->name,
            'employmentType' => $item->employment_type,
            'status' => $item->status,
            'startedAt' => $item->started_at?->toDateString(),
            'department' => $item->relationLoaded('department') && $item->department
                ? ['id' => $item->department->public_id, 'name' => $item->department->name]
                : null,
            'countryCode' => $item->country_code,
            'stateRegion' => $item->state_region,
            'localGovernmentArea' => $item->local_government_area,
            'customFields' => is_array($meta['custom_fields'] ?? null) ? $meta['custom_fields'] : [],
        ];
    }

    /** @return array<string, mixed> */
    private function resolveCustomFieldInput(Request $request): array
    {
        if ($request->has('customFields')) {
            $raw = $request->input('customFields');
            if (is_string($raw)) {
                $decoded = json_decode($raw, true);

                return is_array($decoded) ? $decoded : [];
            }

            return is_array($raw) ? $raw : [];
        }

        return [];
    }
}
