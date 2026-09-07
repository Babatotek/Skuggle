<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Admissions\ApplicationStatus;
use App\Domain\Admissions\CycleStatus;
use App\Domain\Tenancy\TenantContext;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\ConvertApplicationRequest;
use App\Http\Requests\Admissions\StoreApplicationRequest;
use App\Http\Requests\Admissions\StoreDecisionRequest;
use App\Http\Requests\Admissions\StoreScreeningRequest;
use App\Http\Requests\Admissions\TransitionApplicationRequest;
use App\Http\Requests\Admissions\UpdateApplicationRequest;
use App\Http\Requests\Admissions\UpsertCycleRequest;
use App\Http\Resources\Admissions\AdmissionApplicationResource;
use App\Http\Resources\Admissions\AdmissionCycleResource;
use App\Models\AdmissionApplication;
use App\Models\AdmissionCycle;
use App\Models\SchoolClass;
use App\Models\Tenant;
use App\Services\Admissions\AdmissionConversionService;
use App\Services\Admissions\AdmissionImportService;
use App\Services\Admissions\AdmissionLifecycleService;
use App\Services\Admissions\AdmissionOverviewService;
use App\Services\AuditLogger;
use App\Services\FormEngineService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdmissionsController extends Controller
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly FormEngineService $forms,
    ) {}

    public function overview(AdmissionOverviewService $overview): JsonResponse
    {
        $this->authorize('viewAny', AdmissionApplication::class);

        return ApiResponse::success($overview->build());
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AdmissionApplication::class);
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $query = AdmissionApplication::query()->with(['cycle', 'requestedClass'])->withCount('documents');
        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('guardian_name', 'like', "%{$search}%")
                    ->orWhere('guardian_email', 'like', "%{$search}%");
            });
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        } elseif (is_array($request->attributes->get('admissionStatuses'))) {
            $query->whereIn('status', $request->attributes->get('admissionStatuses'));
        }
        if ($request->filled('cycleId')) {
            $query->whereHas('cycle', fn ($builder) => $builder->where('public_id', $request->string('cycleId')->toString()));
        }
        if ($request->filled('classId')) {
            $query->whereHas('requestedClass', fn ($builder) => $builder->where('public_id', $request->string('classId')->toString()));
        }
        $paginator = $query->latest()->paginate($perPage);

        return ApiResponse::success([
            'data' => AdmissionApplicationResource::collection(collect($paginator->items()))->resolve(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(string $application): JsonResponse
    {
        $record = $this->application($application, [
            'cycle', 'requestedClass', 'screenings', 'decision.offeredClass',
            'conversion.student', 'conversion.enrollment', 'history',
        ])->loadCount('documents');
        $this->authorize('view', $record);

        return ApiResponse::success((new AdmissionApplicationResource($record))->resolve());
    }

    public function store(StoreApplicationRequest $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', AdmissionApplication::class);
        $data = $request->validated();
        $cycle = $this->cycle($data['cycleId'] ?? null);
        $class = $this->schoolClass($data['requestedClassId'] ?? null);
        $status = ApplicationStatus::from($data['status'] ?? ApplicationStatus::Draft->value);
        $customFields = $this->forms->validateValues(
            $this->context->tenant(),
            'admissions.application',
            $data['customFields'] ?? [],
            true,
        );

        $application = DB::transaction(function () use ($request, $data, $cycle, $class, $status, $customFields): AdmissionApplication {
            $application = AdmissionApplication::query()->create([
                'admission_cycle_id' => $cycle?->getKey(),
                'requested_class_id' => $class?->getKey(),
                'reference' => 'APP-'.now()->format('Ym').'-'.Str::upper(Str::random(8)),
                'status' => $status,
                'first_name' => $data['firstName'],
                'middle_name' => $data['middleName'] ?? null,
                'last_name' => $data['lastName'],
                'gender' => $data['gender'] ?? null,
                'date_of_birth' => $data['dateOfBirth'] ?? null,
                'nationality' => $data['nationality'] ?? null,
                'guardian_name' => $data['guardianName'] ?? null,
                'guardian_phone' => $data['guardianPhone'] ?? null,
                'guardian_email' => isset($data['guardianEmail']) ? mb_strtolower($data['guardianEmail']) : null,
                'custom_fields' => $customFields,
                'notes' => $data['notes'] ?? null,
                'submitted_at' => $status === ApplicationStatus::Submitted ? now() : null,
                'status_changed_at' => now(),
                'created_by' => $request->user()->getKey(),
                'updated_by' => $request->user()->getKey(),
            ]);
            $application->history()->create([
                'from_status' => null,
                'to_status' => $status,
                'reason' => 'Application created',
                'changed_by' => $request->user()->getKey(),
                'changed_at' => now(),
            ]);

            return $application;
        });
        $audit->record('admissions.application.created', $application, [], ['status' => $status->value]);

        return ApiResponse::success((new AdmissionApplicationResource($application->load(['cycle', 'requestedClass'])))->resolve(), [], 201);
    }

    public function importApplications(Request $request, AdmissionImportService $importer): JsonResponse
    {
        $this->authorize('create', AdmissionApplication::class);
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        return ApiResponse::success(
            $importer->import($data['file'], $request->user()),
            [],
            201,
        );
    }

    public function update(string $application, UpdateApplicationRequest $request, AuditLogger $audit): JsonResponse
    {
        $record = $this->application($application);
        $this->authorize('update', $record);
        if (in_array($record->statusType(), [ApplicationStatus::Enrolled, ApplicationStatus::Rejected, ApplicationStatus::Withdrawn], true)) {
            throw new ApiException('APPLICATION_IMMUTABLE', 'This application can no longer be edited.', 409);
        }
        $data = $request->validated();
        $before = $record->toArray();
        $map = [
            'firstName' => 'first_name', 'middleName' => 'middle_name', 'lastName' => 'last_name',
            'gender' => 'gender', 'dateOfBirth' => 'date_of_birth', 'nationality' => 'nationality',
            'guardianName' => 'guardian_name', 'guardianPhone' => 'guardian_phone',
            'guardianEmail' => 'guardian_email', 'notes' => 'notes',
        ];
        foreach ($map as $input => $column) {
            if (array_key_exists($input, $data)) {
                $record->{$column} = $input === 'guardianEmail' && $data[$input] ? mb_strtolower($data[$input]) : $data[$input];
            }
        }
        if (array_key_exists('cycleId', $data)) {
            $record->admission_cycle_id = $this->cycle($data['cycleId'])?->getKey();
        }
        if (array_key_exists('requestedClassId', $data)) {
            $record->requested_class_id = $this->schoolClass($data['requestedClassId'])?->getKey();
        }
        if (array_key_exists('customFields', $data)) {
            $record->setAttribute('custom_fields', $this->forms->validateValues($this->context->tenant(), 'admissions.application', $data['customFields']));
        }
        $record->updated_by = $request->user()->getKey();
        $record->save();
        $audit->record('admissions.application.updated', $record, $before, $record->getChanges());

        return ApiResponse::success((new AdmissionApplicationResource($record->fresh(['cycle', 'requestedClass'])))->resolve());
    }

    public function transition(string $application, TransitionApplicationRequest $request, AdmissionLifecycleService $lifecycle): JsonResponse
    {
        $record = $this->application($application);
        $this->authorize('update', $record);
        $target = ApplicationStatus::from($request->string('status')->toString());
        $selfServiceTransitions = [
            ApplicationStatus::Submitted, ApplicationStatus::Accepted,
            ApplicationStatus::Declined, ApplicationStatus::Withdrawn,
        ];
        if (! in_array($target, $selfServiceTransitions, true)) {
            throw new ApiException('ACTION_ENDPOINT_REQUIRED', 'Use the screening, decision, or conversion action for this transition.', 422);
        }
        $updated = $lifecycle->transition($record, $target, $request->input('reason'), $request->user());

        return ApiResponse::success((new AdmissionApplicationResource($updated))->resolve());
    }

    public function screeningQueue(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AdmissionApplication::class);
        $request->attributes->set('admissionStatuses', [
            ApplicationStatus::Submitted->value,
            ApplicationStatus::Screening->value,
        ]);

        return $this->index($request);
    }

    public function screen(string $application, StoreScreeningRequest $request, AdmissionLifecycleService $lifecycle): JsonResponse
    {
        $record = $this->application($application);
        $this->authorize('screen', $record);
        $screening = $lifecycle->recordScreening($record, $request->validated(), $request->user());

        return ApiResponse::success([
            'id' => $screening->public_id,
            'status' => $screening->statusType()->value,
            'application' => (new AdmissionApplicationResource($record->fresh()))->resolve(),
        ], [], 201);
    }

    public function decisionQueue(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AdmissionApplication::class);
        $request->attributes->set('admissionStatuses', [
            ApplicationStatus::Screened->value,
            ApplicationStatus::Waitlisted->value,
            ApplicationStatus::Offered->value,
            ApplicationStatus::Accepted->value,
            ApplicationStatus::Declined->value,
            ApplicationStatus::Rejected->value,
        ]);

        return $this->index($request);
    }

    public function decide(string $application, StoreDecisionRequest $request, AdmissionLifecycleService $lifecycle): JsonResponse
    {
        $record = $this->application($application);
        $this->authorize('decide', $record);
        $decision = $lifecycle->recordDecision($record, $request->validated(), $request->user());

        return ApiResponse::success([
            'id' => $decision->public_id,
            'decision' => $decision->decisionType()->value,
            'application' => (new AdmissionApplicationResource($record->fresh()))->resolve(),
        ], [], 201);
    }

    public function enrolmentQueue(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AdmissionApplication::class);
        $request->attributes->set('admissionStatuses', [
            ApplicationStatus::Accepted->value,
            ApplicationStatus::Enrolled->value,
        ]);

        return $this->index($request);
    }

    public function convert(string $application, ConvertApplicationRequest $request, AdmissionConversionService $conversion): JsonResponse
    {
        $record = $this->application($application, ['requestedClass', 'decision.offeredClass', 'conversion']);
        $this->authorize('convert', $record);
        $result = $conversion->convert(
            $record,
            $request->validated(),
            $request->user(),
            (string) $request->header('Idempotency-Key'),
        );

        return ApiResponse::success([
            'id' => $result['conversion']->public_id,
            'studentId' => $result['conversion']->student->public_id,
            'enrollmentId' => $result['conversion']->enrollment?->public_id,
            'alreadyConverted' => ! $result['created'],
        ], [], $result['created'] ? 201 : 200);
    }

    public function settings(): JsonResponse
    {
        return ApiResponse::success([
            'cycles' => AdmissionCycleResource::collection(AdmissionCycle::query()->latest('opens_at')->get())->resolve(),
            'applicationForm' => $this->forms->getForm($this->context->tenant(), 'admissions.application', true),
        ]);
    }

    public function upsertCycle(UpsertCycleRequest $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validated();
        $cycle = DB::transaction(function () use ($request, $data): AdmissionCycle {
            Tenant::query()->lockForUpdate()->findOrFail($this->context->tenantId());
            $cycle = isset($data['id'])
                ? AdmissionCycle::query()->where('public_id', $data['id'])->lockForUpdate()->firstOrFail()
                : new AdmissionCycle;
            if ($data['status'] === CycleStatus::Active->value) {
                AdmissionCycle::query()
                    ->where('status', CycleStatus::Active->value)
                    ->when($cycle->exists, fn ($query) => $query->whereKeyNot($cycle->getKey()))
                    ->update(['status' => CycleStatus::Closed->value]);
            }
            $cycle->fill([
                'name' => $data['name'],
                'opens_at' => $data['opensAt'] ?? null,
                'closes_at' => $data['closesAt'] ?? null,
                'status' => $data['status'],
                'currency' => strtoupper($data['currency']),
                'application_fee_minor' => $data['applicationFeeMinor'],
                'settings' => $data['settings'] ?? [],
                'created_by' => $cycle->created_by ?? $request->user()->getKey(),
            ])->save();

            return $cycle;
        });
        $audit->record('admissions.settings.updated', $cycle, [], ['status' => $cycle->statusType()->value]);

        return ApiResponse::success((new AdmissionCycleResource($cycle))->resolve(), [], $cycle->wasRecentlyCreated ? 201 : 200);
    }

    /** @param list<string> $with */
    private function application(string $publicId, array $with = []): AdmissionApplication
    {
        return AdmissionApplication::query()->with($with)->where('public_id', $publicId)->firstOrFail();
    }

    private function cycle(?string $publicId): ?AdmissionCycle
    {
        return $publicId ? AdmissionCycle::query()->where('public_id', $publicId)->firstOrFail() : null;
    }

    private function schoolClass(?string $publicId): ?SchoolClass
    {
        return $publicId ? SchoolClass::query()->where('public_id', $publicId)->firstOrFail() : null;
    }
}
