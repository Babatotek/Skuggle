<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\SchoolRoles;
use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\Department;
use App\Models\Employee;
use App\Models\WorkforcePosition;
use App\Services\AuditLogger;
use App\Services\CustomFieldRegistry;
use App\Services\EmployeeNumberGenerator;
use App\Support\ApiResponse;
use App\Support\SchoolCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    private const STATUSES = ['active', 'probation', 'on_leave', 'suspended', 'resigned', 'retired', 'terminated', 'inactive'];

    private const RELATIONS = ['department', 'position', 'campus', 'reportingManager', 'user'];

    public function __construct(
        private readonly TenantContext $context,
        private readonly CustomFieldRegistry $customFields,
        private readonly EmployeeNumberGenerator $employeeNumbers,
    ) {}

    public function lookups(): JsonResponse
    {
        return ApiResponse::success([
            'positions' => WorkforcePosition::query()->orderBy('name')->get()->map(fn ($p) => ['id' => $p->public_id, 'name' => $p->name, 'category' => $p->category]),
            'departments' => Department::query()->orderBy('name')->get()->map(fn ($p) => ['id' => $p->public_id, 'name' => $p->name]),
            'campuses' => Campus::query()->orderBy('name')->get()->map(fn ($p) => ['id' => $p->public_id, 'name' => $p->name]),
            'managers' => Employee::query()->orderBy('name')->get()->map(fn ($p) => ['id' => $p->public_id, 'name' => $p->name]),
            'accessRoles' => SchoolRoles::invitableRolesFor($this->context->membership()->role?->name),
            'employmentStatuses' => self::STATUSES,
            'schoolCode' => SchoolCode::forTenant($this->context->tenant()),
            'nextEmployeeNumber' => $this->employeeNumbers->preview(),
            'employeeNumberPattern' => $this->employeeNumbers->pattern(),
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
        $paginator = Employee::query()->with(self::RELATIONS)->orderBy('name')->paginate($perPage);

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

    public function store(Request $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'employee_number' => ['nullable', 'string', 'max:64', Rule::unique('employees')->where('tenant_id', $this->context->tenantId())],
            'name' => ['required', 'string', 'max:180'],
            'employment_type' => ['required', 'string', 'max:48'],
            'department_id' => ['nullable', 'string'],
            'started_at' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            ...$this->employmentRules(),
            'countryCode' => ['nullable', 'string', 'max:8'],
            'stateRegion' => ['nullable', 'string', 'max:120'],
            'localGovernmentArea' => ['nullable', 'string', 'max:120'],
            'customFields' => ['nullable'],
        ]);

        $employeeNumber = trim((string) ($data['employee_number'] ?? ''));
        if ($employeeNumber === '') {
            $employeeNumber = $this->employeeNumbers->generate();
        }

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
            ...$this->employmentValues($data),
            'employee_number' => $employeeNumber,
            'name' => $data['name'],
            'employment_type' => $data['employment_type'],
            'department_id' => $departmentId,
            'started_at' => $data['started_at'] ?? null,
            'status' => $data['status'] ?? 'active',
            'country_code' => $data['countryCode'] ?? null,
            'state_region' => $data['stateRegion'] ?? null,
            'local_government_area' => $data['localGovernmentArea'] ?? null,
            'metadata' => ['custom_fields' => $validatedCustomFields, 'personal' => $data['personal'] ?? [], 'professional' => $data['professional'] ?? []],
        ]);

        $audit->record('workforce.created', $employee, [], ['employee_number' => $employee->employee_number, 'employment_status' => $employee->status]);

        return ApiResponse::success($this->present($employee->load(self::RELATIONS)), [], 201);
    }

    public function update(string $employee, Request $request, AuditLogger $audit): JsonResponse
    {
        $record = Employee::query()->where('public_id', $employee)->firstOrFail();
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:180'], 'employment_type' => ['sometimes', 'string', 'max:48'],
            'status' => ['sometimes', Rule::in(self::STATUSES)], 'started_at' => ['nullable', 'date'],
            'department_id' => ['nullable', 'string'],
            ...$this->employmentRules(),
        ]);
        $before = $record->only(['name', 'status', 'position_id', 'department_id', 'campus_id', 'staff_category', 'employment_type']);
        $values = $this->employmentValues($data);
        if (array_key_exists('department_id', $data)) {
            $values['department_id'] = $data['department_id'] ? Department::query()->where('public_id', $data['department_id'])->firstOrFail()->getKey() : null;
        }
        abort_if(($values['reporting_manager_id'] ?? null) === $record->getKey(), 422, 'A staff member cannot report to themselves.');
        $meta = $record->metadata ?? [];
        foreach (['personal', 'professional'] as $key) {
            if (array_key_exists($key, $data) && is_array($data[$key])) {
                $existing = is_array($meta[$key] ?? null) ? $meta[$key] : [];
                $meta[$key] = array_merge($existing, $data[$key]);
            }
        }
        $record->fill([...array_intersect_key($data, array_flip(['name', 'status', 'started_at', 'employment_type'])), ...$values, 'metadata' => $meta])->save();
        $after = $record->only(array_keys($before));
        $audit->record('workforce.updated', $record, $before, $after);
        if (array_key_exists('status', $data) && ($before['status'] ?? null) !== $record->status) {
            $audit->record('workforce.employment_status.changed', $record, ['status' => $before['status'] ?? null], ['status' => $record->status]);
        }

        return ApiResponse::success($this->present($record->fresh(self::RELATIONS)));
    }

    private function present(Employee $item): array
    {
        $meta = is_array($item->metadata) ? $item->metadata : [];

        $personal = is_array($meta['personal'] ?? null) ? $meta['personal'] : [];

        return [
            'id' => $item->public_id,
            'position' => $item->position ? ['id' => $item->position->public_id, 'name' => $item->position->name] : null,
            'staffCategory' => $item->staff_category,
            'campus' => $item->campus ? ['id' => $item->campus->public_id, 'name' => $item->campus->name] : null,
            'reportingManager' => $item->reportingManager ? ['id' => $item->reportingManager->public_id, 'name' => $item->reportingManager->name] : null,
            'linkedUser' => $item->user ? ['id' => $item->user->public_id, 'email' => $item->user->email] : null,
            'email' => $personal['email'] ?? $item->user?->email,
            'phone' => $personal['phone'] ?? null,
            'personal' => $personal,
            'professional' => $meta['professional'] ?? [],
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

    public function show(string $employee): JsonResponse
    {
        return ApiResponse::success($this->present(Employee::query()->with(self::RELATIONS)->where('public_id', $employee)->firstOrFail()));
    }

    public function storePosition(Request $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120', Rule::unique('workforce_positions')->where('tenant_id', $this->context->tenantId())], 'category' => ['required', 'in:teaching,non_teaching']]);
        $position = WorkforcePosition::query()->create($data);
        $audit->record('workforce.position.created', $position, [], $data);

        return ApiResponse::success(['id' => $position->public_id, ...$data], [], 201);
    }

    private function employmentRules(): array
    {
        return [
            'position_id' => ['nullable', 'string'], 'campus_id' => ['nullable', 'string'],
            'reporting_manager_id' => ['nullable', 'string'], 'staff_category' => ['nullable', 'in:teaching,non_teaching'],
            'personal' => ['sometimes', 'array:email,phone,address,gender,dateOfBirth,emergencyContact'],
            'personal.email' => ['nullable', 'email', 'max:254'], 'personal.phone' => ['nullable', 'string', 'max:40'],
            'personal.address' => ['nullable', 'string', 'max:1000'], 'personal.gender' => ['nullable', 'string', 'max:40'],
            'personal.dateOfBirth' => ['nullable', 'date', 'before:today'], 'personal.emergencyContact' => ['nullable', 'string', 'max:500'],
            'professional' => ['sometimes', 'array:qualifications,certifications,experience,subjects,classes,specializations'],
            'professional.*' => ['nullable', 'string', 'max:4000'],
        ];
    }

    private function employmentValues(array $data): array
    {
        $values = array_intersect_key($data, ['staff_category' => true]);
        foreach (['position_id' => WorkforcePosition::class, 'campus_id' => Campus::class, 'reporting_manager_id' => Employee::class] as $key => $model) {
            if (array_key_exists($key, $data)) {
                $values[$key] = $data[$key] ? $model::query()->where('public_id', $data[$key])->firstOrFail()->getKey() : null;
            }
        }

        return $values;
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
