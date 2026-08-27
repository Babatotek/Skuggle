<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Students\StoreStudentRequest;
use App\Models\AcademicSession;
use App\Models\Guardian;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\AuditLogger;
use App\Services\CustomFieldRegistry;
use App\Services\TenantSequence;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly CustomFieldRegistry $customFields,
    ) {}

    public function lookups(Request $request): JsonResponse
    {
        $sessionId = $request->hasSession() ? $request->session()->get('academic_session_public_id') : null;
        $tenant = $this->context->tenant();

        return ApiResponse::success([
            'classes' => SchoolClass::query()->where('status', 'active')->orderBy('name')->get()->map(fn ($item) => ['id' => $item->public_id, 'name' => trim($item->name.' '.$item->arm)]),
            'academicSessions' => AcademicSession::query()->where('status', 'active')->orderByDesc('starts_at')->get()->map(fn ($item) => ['id' => $item->public_id, 'name' => $item->name, 'selected' => $item->public_id === $sessionId]),
            'customFields' => $this->customFields->definitions($tenant, CustomFieldRegistry::ENTITY_STUDENT, true),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Student::class);
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $query = Student::query()->with(['enrollments' => fn ($q) => $q->where('status', 'active')->with('schoolClass'), 'guardians']);
        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search): void {
                $q->where('admission_number', 'like', "%{$search}%")->orWhere('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%");
            });
        }
        foreach (['status', 'gender'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->query($field));
            }
        }
        if ($request->filled('classId')) {
            $query->whereHas('enrollments.schoolClass', fn ($q) => $q->where('public_id', $request->query('classId')));
        }
        $paginator = $query->orderBy('last_name')->orderBy('first_name')->paginate($perPage);

        return ApiResponse::success(['data' => collect($paginator->items())->map(fn (Student $student) => $this->summary($student)), 'meta' => ['currentPage' => $paginator->currentPage(), 'perPage' => $paginator->perPage(), 'total' => $paginator->total(), 'lastPage' => $paginator->lastPage()]]);
    }

    public function show(string $student, Request $request): JsonResponse
    {
        $record = Student::query()->where('public_id', $student)->with(['enrollments.schoolClass', 'enrollments.academicSession', 'guardians'])->firstOrFail();
        $this->authorize('view', $record);
        $summary = $this->summary($record);

        return ApiResponse::success($summary + [
            'dateOfBirth' => $record->date_of_birth?->toDateString(), 'nationality' => $record->nationality, 'stateOfOrigin' => $record->state_of_origin, 'admissionDate' => $record->admission_date?->toDateString(),
            'sections' => [
                ['id' => 'overview', 'label' => 'Overview', 'items' => [['label' => 'Admission number', 'value' => $record->admission_number], ['label' => 'Status', 'value' => $record->status], ['label' => 'Gender', 'value' => $record->gender]]],
                ['id' => 'academic', 'label' => 'Academic', 'items' => $record->enrollments->map(fn ($item) => ['label' => $item->academicSession?->name ?? 'Session', 'value' => $item->schoolClass?->name])->all()],
                ['id' => 'guardians', 'label' => 'Guardians', 'items' => $record->guardians->map(fn ($item) => ['label' => $item->name, 'value' => $item->phone])->all()],
            ],
        ]);
    }

    public function store(StoreStudentRequest $request, TenantSequence $sequence, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Student::class);
        $guardians = json_decode($request->string('guardians')->toString(), true, flags: JSON_THROW_ON_ERROR);
        $validator = Validator::make(['guardians' => $guardians], ['guardians' => ['required', 'array', 'min:1', 'max:5'], 'guardians.*.name' => ['required', 'string', 'max:180'], 'guardians.*.relationship' => ['required', 'string', 'max:64'], 'guardians.*.phone' => ['required', 'string', 'max:32'], 'guardians.*.email' => ['nullable', 'email:rfc', 'max:254']]);
        if ($validator->fails()) {
            throw new ApiException('VALIDATION_ERROR', 'Guardian information is invalid.', 422, $validator->errors()->toArray());
        }

        $customFieldValues = $this->resolveCustomFieldInput($request);
        $validatedCustomFields = $this->customFields->validateValues(
            $this->context->tenant(),
            CustomFieldRegistry::ENTITY_STUDENT,
            $customFieldValues,
            true,
        );

        $student = DB::transaction(function () use ($request, $sequence, $guardians, $audit, $validatedCustomFields): Student {
            $class = SchoolClass::query()->where('public_id', $request->string('classId')->toString())->firstOrFail();
            $sessionPublicId = $request->hasSession() ? $request->session()->get('academic_session_public_id') : null;
            $session = AcademicSession::query()->when($sessionPublicId, fn ($q) => $q->where('public_id', $sessionPublicId), fn ($q) => $q->where('is_current', true))->first();
            if (! $session) {
                throw new ApiException('ACADEMIC_CONTEXT_REQUIRED', 'Configure an academic session before registering students.', 409);
            }
            $admissionNumber = $request->filled('admissionNumber') ? $request->string('admissionNumber')->toString() : sprintf('SKU-%s-%06d', now()->format('Y'), $sequence->next('student_admission'));
            $student = Student::query()->create([
                'admission_number' => $admissionNumber,
                'first_name' => $request->string('firstName'),
                'middle_name' => $request->input('middleName'),
                'last_name' => $request->string('lastName'),
                'gender' => $request->string('gender'),
                'date_of_birth' => $request->date('dateOfBirth'),
                'nationality' => $request->input('nationality'),
                'country_code' => $request->input('countryCode'),
                'state_of_origin' => $request->input('stateOfOrigin'),
                'local_government_area' => $request->input('localGovernmentArea'),
                'admission_date' => $request->date('admissionDate'),
                'status' => 'active',
                'metadata' => $validatedCustomFields === [] ? null : ['custom_fields' => $validatedCustomFields],
            ]);
            $student->enrollments()->create(['class_id' => $class->getKey(), 'academic_session_id' => $session->getKey(), 'status' => 'active']);
            foreach ($guardians as $index => $input) {
                $guardian = Guardian::query()->create(['name' => $input['name'], 'phone' => $input['phone'], 'email' => $input['email'] ?? null, 'address' => isset($input['address']) ? ['text' => $input['address']] : null]);
                $student->guardians()->attach($guardian->getKey(), ['tenant_id' => $student->tenant_id, 'relationship' => $input['relationship'], 'preferred_contact' => (bool) ($input['preferredContact'] ?? $index === 0), 'billing_responsible' => (bool) ($input['billingResponsible'] ?? false), 'authorized_pickup' => (bool) ($input['authorizedPickup'] ?? false)]);
            }
            if ($request->hasFile('photo')) {
                $student->update(['photo_key' => $request->file('photo')->store("students/{$student->public_id}", (string) config('skuggle.library.disk'))]);
            }
            $audit->record('student.created', $student, [], ['admission_number' => $student->admission_number, 'class' => $class->public_id]);

            return $student->load(['enrollments.schoolClass', 'guardians']);
        });

        return ApiResponse::success($this->summary($student), [], 201);
    }

    private function summary(Student $student): array
    {
        $enrollment = $student->enrollments->first();
        $meta = is_array($student->metadata) ? $student->metadata : [];

        return [
            'id' => $student->public_id,
            'admissionNumber' => $student->admission_number,
            'fullName' => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
            'firstName' => $student->first_name,
            'lastName' => $student->last_name,
            'className' => $enrollment?->schoolClass?->name,
            'classArm' => trim(($enrollment?->schoolClass?->name ?? '').' '.($enrollment?->schoolClass?->arm ?? '')),
            'gender' => $student->gender,
            'status' => $student->status,
            'photoUrl' => $meta['photo_url'] ?? null,
            'currentAverage' => $meta['current_average'] ?? null,
            'attendanceRate' => $meta['attendance_rate'] ?? null,
            'feesStatus' => $meta['fees_status'] ?? null,
            'outstandingFees' => $meta['outstanding_fees'] ?? null,
            'trend' => $meta['trend'] ?? null,
            'trendPercent' => $meta['trend_percent'] ?? null,
            'dateOfBirth' => $student->date_of_birth?->toDateString(),
            'stateOfOrigin' => $student->state_of_origin,
            'countryCode' => $student->country_code,
            'localGovernmentArea' => $student->local_government_area,
            'nationality' => $student->nationality,
            'admissionDate' => $student->admission_date?->toDateString(),
            'guardians' => $student->relationLoaded('guardians') ? $student->guardians->map(fn ($item) => [
                'id' => $item->public_id,
                'name' => $item->name,
                'relationship' => $item->pivot->relationship,
                'phone' => $item->phone,
                'email' => $item->email,
                'preferredContact' => (bool) $item->pivot->preferred_contact,
                'billingResponsible' => (bool) $item->pivot->billing_responsible,
                'authorizedPickup' => (bool) $item->pivot->authorized_pickup,
            ]) : [],
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
