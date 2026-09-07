<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Campus;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\SchoolModuleRecord;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\TenantMembership;
use App\Models\Term;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\LookupCacheService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SchoolStructureController extends Controller
{
    public function __construct(private readonly TenantContext $context) {}

    public function index(Request $request, string $resource): JsonResponse
    {
        $this->assertRead($request, $resource);
        $perPage = min(max($request->integer('perPage', 20), 1), 100);

        return match ($resource) {
            'profile' => ApiResponse::success($this->profile()),
            'campuses' => $this->paginate(Campus::query()->orderBy('name'), $perPage, fn (Campus $item) => [
                'id' => $item->public_id, 'name' => $item->name, 'code' => $item->code, 'status' => $item->status,
            ]),
            'sessions' => $this->paginate(
                AcademicSession::query()->with(['terms' => fn ($q) => $q->orderBy('sequence')])->orderByDesc('starts_at'),
                $perPage,
                fn (AcademicSession $item) => $this->presentSession($item),
            ),
            'terms' => $this->paginate(
                Term::query()->with('academicSession')->orderByDesc('starts_at'),
                $perPage,
                fn (Term $item) => $this->presentTerm($item),
            ),
            'classes' => $this->paginate(
                SchoolClass::query()->orderBy('name')->orderBy('arm'),
                $perPage,
                fn (SchoolClass $item) => $this->presentClass($item),
            ),
            'arms' => $this->paginate(
                SchoolClass::query()->select('arm')->selectRaw('count(*) as class_count')->whereNotNull('arm')->where('arm', '!=', '')->groupBy('arm')->orderBy('arm'),
                $perPage,
                fn ($item) => ['id' => $item->arm, 'name' => $item->arm, 'classCount' => (int) $item->class_count, 'status' => 'active'],
            ),
            'departments' => $this->paginate(Department::query()->orderBy('name'), $perPage, fn (Department $item) => [
                'id' => $item->public_id, 'name' => $item->name, 'code' => $item->code,
            ]),
            'subjects' => $this->paginate(Subject::query()->orderBy('name'), $perPage, fn (Subject $item) => [
                'id' => $item->public_id, 'name' => $item->name, 'code' => $item->code, 'status' => $item->status,
            ]),
            'enrolments' => $this->paginate(
                Enrollment::query()->with(['student', 'schoolClass', 'academicSession'])->latest(),
                $perPage,
                fn (Enrollment $item) => $this->presentEnrolment($item),
            ),
            'teacher-allocations' => $this->paginate(
                TeacherAssignment::query()->with(['user:id,public_id,name', 'schoolClass', 'subject', 'academicSession'])->latest(),
                $perPage,
                fn (TeacherAssignment $item) => $this->presentAssignment($item),
            ),
            default => abort(404),
        };
    }

    public function store(Request $request, string $resource, AuditLogger $audit): JsonResponse
    {
        $this->assertWrite($request, $resource);

        $payload = match ($resource) {
            'profile' => $this->updateProfile($request, $audit),
            'campuses' => $this->storeCampus($request),
            'sessions' => app(AcademicSessionController::class)->store($request)->getData(true)['data'] ?? [],
            'terms' => $this->storeTerm($request),
            'classes' => $this->storeClass($request),
            'arms' => $this->storeArm($request, $audit),
            'departments' => $this->storeDepartment($request),
            'subjects' => $this->storeSubject($request),
            'enrolments' => $this->storeEnrolment($request),
            'teacher-allocations' => $this->storeAssignment($request),
            default => abort(404),
        };

        return ApiResponse::success($payload, [], 201);
    }

    public function update(Request $request, string $resource, string $id, AuditLogger $audit): JsonResponse
    {
        $this->assertWrite($request, $resource);
        if ($resource === 'profile') {
            return ApiResponse::success($this->updateProfile($request, $audit));
        }

        $payload = match ($resource) {
            'campuses' => tap(Campus::query()->where('public_id', $id)->firstOrFail(), function (Campus $item) use ($request): void {
                $data = $request->validate(['name' => ['sometimes', 'string', 'max:160'], 'code' => ['sometimes', 'string', 'max:32'], 'status' => ['nullable', 'string', 'max:24']]);
                $item->update([
                    'name' => $data['name'] ?? $item->name,
                    'code' => isset($data['code']) ? strtoupper($data['code']) : $item->code,
                    'status' => $data['status'] ?? $item->status,
                ]);
            }),
            'classes' => tap(SchoolClass::query()->where('public_id', $id)->firstOrFail(), function (SchoolClass $item) use ($request): void {
                $data = $request->validate(['name' => ['sometimes', 'string', 'max:100'], 'arm' => ['nullable', 'string', 'max:40'], 'status' => ['nullable', 'string', 'max:24'], 'capacity' => ['nullable', 'integer', 'min:1']]);
                $item->update($data);
                app(LookupCacheService::class)->forgetAll();
            }),
            'departments' => tap(Department::query()->where('public_id', $id)->firstOrFail(), function (Department $item) use ($request): void {
                $data = $request->validate(['name' => ['sometimes', 'string', 'max:120'], 'code' => ['sometimes', 'string', 'max:32']]);
                $item->update(['name' => $data['name'] ?? $item->name, 'code' => isset($data['code']) ? strtoupper($data['code']) : $item->code]);
            }),
            'subjects' => tap(Subject::query()->where('public_id', $id)->firstOrFail(), function (Subject $item) use ($request): void {
                $data = $request->validate(['name' => ['sometimes', 'string', 'max:120'], 'code' => ['sometimes', 'string', 'max:32'], 'status' => ['nullable', 'string', 'max:24']]);
                $item->update(['name' => $data['name'] ?? $item->name, 'code' => isset($data['code']) ? strtoupper($data['code']) : $item->code, 'status' => $data['status'] ?? $item->status]);
                app(LookupCacheService::class)->forgetAll();
            }),
            'terms' => tap(Term::query()->where('public_id', $id)->firstOrFail(), function (Term $item) use ($request): void {
                $data = $request->validate(['name' => ['sometimes', 'string', 'max:64'], 'startsAt' => ['sometimes', 'date'], 'endsAt' => ['sometimes', 'date'], 'isCurrent' => ['nullable', 'boolean']]);
                if (! empty($data['isCurrent'])) {
                    Term::query()->update(['is_current' => false]);
                }
                $item->update([
                    'name' => $data['name'] ?? $item->name,
                    'starts_at' => $data['startsAt'] ?? $item->starts_at,
                    'ends_at' => $data['endsAt'] ?? $item->ends_at,
                    'is_current' => $data['isCurrent'] ?? $item->is_current,
                ]);
            }),
            default => abort(404),
        };

        return ApiResponse::success(match ($resource) {
            'campuses' => ['id' => $payload->public_id, 'name' => $payload->name, 'code' => $payload->code, 'status' => $payload->status],
            'classes' => $this->presentClass($payload),
            'departments' => ['id' => $payload->public_id, 'name' => $payload->name, 'code' => $payload->code],
            'subjects' => ['id' => $payload->public_id, 'name' => $payload->name, 'code' => $payload->code, 'status' => $payload->status],
            'terms' => $this->presentTerm($payload->load('academicSession')),
            default => $payload,
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function profile(): array
    {
        $tenant = $this->context->tenant();
        $settings = $tenant->settings ?? [];

        return [
            'id' => $tenant->public_id,
            'name' => $tenant->name,
            'code' => $tenant->code,
            'slug' => $tenant->slug,
            'status' => $tenant->status,
            'timezone' => $tenant->timezone,
            'country' => $tenant->country,
            'currency' => $tenant->currency,
            'motto' => data_get($settings, 'profile.motto'),
            'address' => data_get($settings, 'profile.address'),
            'city' => data_get($settings, 'profile.city'),
            'state' => data_get($settings, 'profile.state'),
            'email' => data_get($settings, 'contact.email'),
            'phone' => data_get($settings, 'contact.phone'),
            'logoUrl' => data_get($settings, 'branding.logo_url'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function updateProfile(Request $request, AuditLogger $audit): array
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:180'],
            'motto' => ['nullable', 'string', 'max:180'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email:rfc', 'max:254'],
            'phone' => ['nullable', 'string', 'max:32'],
            'timezone' => ['nullable', 'string', 'max:64'],
        ]);
        $tenant = $this->context->tenant();
        $before = $tenant->settings ?? [];
        $settings = $before;
        foreach (['motto', 'address', 'city', 'state'] as $key) {
            if (array_key_exists($key, $data)) {
                data_set($settings, "profile.{$key}", $data[$key]);
            }
        }
        foreach (['email', 'phone'] as $key) {
            if (array_key_exists($key, $data)) {
                data_set($settings, "contact.{$key}", $data[$key]);
            }
        }
        $tenant->fill([
            'name' => $data['name'] ?? $tenant->name,
            'timezone' => $data['timezone'] ?? $tenant->timezone,
            'settings' => $settings,
        ])->save();
        $audit->record('school.profile.updated', $tenant, $before, $settings);

        return $this->profile();
    }

    /**
     * @return array<string, mixed>
     */
    private function storeCampus(Request $request): array
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:160'], 'code' => ['required', 'string', 'max:32'], 'status' => ['nullable', 'string', 'max:24']]);
        $campus = Campus::query()->create(['name' => $data['name'], 'code' => strtoupper($data['code']), 'status' => $data['status'] ?? 'active']);

        return ['id' => $campus->public_id, 'name' => $campus->name, 'code' => $campus->code, 'status' => $campus->status];
    }

    /**
     * @return array<string, mixed>
     */
    private function storeTerm(Request $request): array
    {
        $data = $request->validate([
            'sessionId' => ['required', 'string'],
            'name' => ['required', 'string', 'max:64'],
            'sequence' => ['required', 'integer', 'min:1', 'max:12'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'isCurrent' => ['nullable', 'boolean'],
        ]);
        $session = AcademicSession::query()->where('public_id', $data['sessionId'])->firstOrFail();
        if ($data['isCurrent'] ?? false) {
            Term::query()->update(['is_current' => false]);
        }
        $term = Term::query()->create([
            'academic_session_id' => $session->getKey(),
            'name' => $data['name'],
            'sequence' => $data['sequence'],
            'starts_at' => $data['startsAt'],
            'ends_at' => $data['endsAt'],
            'is_current' => (bool) ($data['isCurrent'] ?? false),
        ]);

        return $this->presentTerm($term->load('academicSession'));
    }

    /**
     * @return array<string, mixed>
     */
    private function storeClass(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'arm' => ['nullable', 'string', 'max:40'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'educationalLevel' => ['nullable', 'string', 'max:80'],
        ]);
        $class = SchoolClass::query()->create([
            'name' => $data['name'],
            'arm' => $data['arm'] ?? null,
            'capacity' => $data['capacity'] ?? null,
            'educational_level' => $data['educationalLevel'] ?? null,
            'status' => 'active',
        ]);
        app(LookupCacheService::class)->forgetAll();

        return $this->presentClass($class);
    }

    /**
     * @return array<string, mixed>
     */
    private function storeArm(Request $request, AuditLogger $audit): array
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:40']]);
        $record = SchoolModuleRecord::query()->create([
            'module' => 'class-arms',
            'title' => $data['name'],
            'status' => 'active',
            'payload' => ['name' => $data['name']],
            'created_by' => $request->user()->getKey(),
        ]);
        $audit->record('school.arm.created', $record, [], ['name' => $data['name']]);

        return ['id' => $record->public_id, 'name' => $data['name'], 'classCount' => 0, 'status' => 'active'];
    }

    /**
     * @return array<string, mixed>
     */
    private function storeDepartment(Request $request): array
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120'], 'code' => ['required', 'string', 'max:32']]);
        $department = Department::query()->create(['name' => $data['name'], 'code' => strtoupper($data['code'])]);

        return ['id' => $department->public_id, 'name' => $department->name, 'code' => $department->code];
    }

    /**
     * @return array<string, mixed>
     */
    private function storeSubject(Request $request): array
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120'], 'code' => ['required', 'string', 'max:32']]);
        $subject = Subject::query()->create(['name' => $data['name'], 'code' => strtoupper($data['code']), 'status' => 'active']);
        app(LookupCacheService::class)->forgetAll();

        return ['id' => $subject->public_id, 'name' => $subject->name, 'code' => $subject->code, 'status' => $subject->status];
    }

    /**
     * @return array<string, mixed>
     */
    private function storeEnrolment(Request $request): array
    {
        $data = $request->validate(['studentId' => ['required', 'string'], 'classId' => ['required', 'string'], 'sessionId' => ['required', 'string']]);
        $student = Student::query()->where('public_id', $data['studentId'])->firstOrFail();
        $class = SchoolClass::query()->where('public_id', $data['classId'])->firstOrFail();
        $session = AcademicSession::query()->where('public_id', $data['sessionId'])->firstOrFail();
        $enrolment = Enrollment::query()->create([
            'student_id' => $student->getKey(),
            'class_id' => $class->getKey(),
            'academic_session_id' => $session->getKey(),
            'status' => 'active',
        ]);

        return $this->presentEnrolment($enrolment->load(['student', 'schoolClass', 'academicSession']));
    }

    /**
     * @return array<string, mixed>
     */
    private function storeAssignment(Request $request): array
    {
        $data = $request->validate([
            'userId' => ['required', 'string'],
            'classId' => ['required', 'string'],
            'subjectId' => ['nullable', 'string'],
            'sessionId' => ['required', 'string'],
        ]);
        $tenantId = $this->context->tenantId();
        $membership = TenantMembership::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->whereHas('user', fn ($query) => $query
                ->where('public_id', $data['userId'])
                ->where('status', 'active'))
            ->firstOrFail();
        $user = User::query()->whereKey($membership->user_id)->firstOrFail();
        $employee = Employee::query()
            ->where('user_id', $user->getKey())
            ->where('status', 'active')
            ->whereHas('teacherProfile')
            ->firstOrFail();
        $class = SchoolClass::query()->where('public_id', $data['classId'])->firstOrFail();
        $session = AcademicSession::query()->where('public_id', $data['sessionId'])->firstOrFail();
        $subjectId = null;
        if (! empty($data['subjectId'])) {
            $subject = Subject::query()->where('public_id', $data['subjectId'])->firstOrFail();
            abort_unless($class->subjects()->whereKey($subject->getKey())->exists(), 422, 'The subject is not offered by the selected class.');
            $subjectId = $subject->getKey();
        }
        $assignment = TeacherAssignment::query()->create([
            'public_id' => (string) Str::ulid(),
            'user_id' => $user->getKey(),
            'class_id' => $class->getKey(),
            'subject_id' => $subjectId,
            'academic_session_id' => $session->getKey(),
            'assignment_type' => 'subject_teacher',
        ]);

        return $this->presentAssignment($assignment->load(['user:id,public_id,name', 'schoolClass', 'subject', 'academicSession']));
    }

    private function assertRead(Request $request, string $resource): void
    {
        $permissions = $request->attributes->get('membership')?->permissionNames() ?? [];
        $required = in_array($resource, ['profile'], true) ? ['settings.configure'] : ['settings.configure', 'students.view', 'users.manage'];
        abort_unless(count(array_intersect($required, $permissions)) > 0, 403);
    }

    private function assertWrite(Request $request, string $resource): void
    {
        $permissions = $request->attributes->get('membership')?->permissionNames() ?? [];
        $need = in_array($resource, ['enrolments'], true) ? ['settings.configure', 'students.create'] : ['settings.configure', 'users.manage'];
        abort_unless(count(array_intersect($need, $permissions)) > 0, 403);
    }

    private function paginate($query, int $perPage, callable $presenter): JsonResponse
    {
        $paginator = $query->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map($presenter)->values()->all(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentSession(AcademicSession $item): array
    {
        return [
            'id' => $item->public_id,
            'name' => $item->name,
            'startsAt' => $item->starts_at?->toDateString(),
            'endsAt' => $item->ends_at?->toDateString(),
            'isCurrent' => (bool) $item->is_current,
            'status' => $item->status,
            'terms' => $item->relationLoaded('terms') ? $item->terms->map(fn (Term $term) => $this->presentTerm($term))->values()->all() : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentTerm(Term $item): array
    {
        return [
            'id' => $item->public_id,
            'name' => $item->name,
            'sequence' => $item->sequence,
            'startsAt' => $item->starts_at?->toDateString(),
            'endsAt' => $item->ends_at?->toDateString(),
            'isCurrent' => (bool) $item->is_current,
            'session' => $item->relationLoaded('academicSession') && $item->academicSession
                ? $item->academicSession->name
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentClass(SchoolClass $item): array
    {
        return ['id' => $item->public_id, 'name' => $item->name, 'arm' => $item->arm, 'capacity' => $item->capacity, 'status' => $item->status, 'educationalLevel' => $item->educational_level];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentEnrolment(Enrollment $item): array
    {
        return [
            'id' => $item->public_id,
            'status' => $item->status,
            'student' => $item->student ? trim($item->student->first_name.' '.$item->student->last_name) : null,
            'class' => $item->schoolClass ? trim($item->schoolClass->name.' '.($item->schoolClass->arm ?? '')) : null,
            'session' => $item->academicSession?->name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentAssignment(TeacherAssignment $item): array
    {
        return [
            'id' => $item->public_id ?: (string) $item->getKey(),
            'teacher' => $item->user?->name,
            'class' => $item->schoolClass ? trim($item->schoolClass->name.' '.($item->schoolClass->arm ?? '')) : null,
            'subject' => $item->subject?->name,
            'session' => $item->academicSession?->name,
            'type' => $item->assignment_type,
        ];
    }
}
