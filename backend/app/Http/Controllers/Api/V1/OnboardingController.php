<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Campus;
use App\Models\Employee;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Term;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly AuditLogger $audit,
    ) {}

    public function show(): JsonResponse
    {
        return ApiResponse::success($this->buildSnapshot());
    }

    /** @return array<string, mixed> */
    private function buildSnapshot(): array
    {
        $tenant = $this->context->tenant();
        $settings = $tenant->settings ?? [];

        $campusCount = Campus::query()->where('status', 'active')->count();
        $sessionCount = AcademicSession::query()->where('status', 'active')->count();
        $hasCurrentSession = AcademicSession::query()->where('is_current', true)->exists();
        $termCount = Term::query()->count();
        $hasCurrentTerm = Term::query()->where('is_current', true)->exists();
        $classCount = SchoolClass::query()->where('status', 'active')->count();
        $subjectCount = Subject::query()->where('status', 'active')->count();
        $studentCount = Student::query()->count();
        $employeeCount = Employee::query()->where('status', 'active')->count();

        $hasAssessmentConfig = ! empty(data_get($settings, 'assessment_structure'));
        $hasFeeConfig = ! empty(data_get($settings, 'fee_heads'));
        $launchedAt = data_get($settings, 'onboarding.launched_at');

        $steps = [
            $this->step('school_profile', 'School Profile', 'complete'),
            $this->step(
                'campuses',
                'Campuses',
                $campusCount >= 1 ? 'complete' : 'incomplete',
                $campusCount >= 1 ? null : 'Add at least one campus.',
            ),
            $this->step(
                'academic_session',
                'Academic Session',
                ($sessionCount >= 1 && $hasCurrentSession && $termCount >= 1 && $hasCurrentTerm) ? 'complete' : 'incomplete',
                ($sessionCount >= 1 && $hasCurrentSession && $termCount >= 1 && $hasCurrentTerm)
                    ? null
                    : 'Configure an academic session with terms and mark one as current.',
                $campusCount < 1 ? 'Complete campuses first.' : null,
            ),
            $this->step(
                'classes',
                'Classes',
                $classCount >= 1 ? 'complete' : 'incomplete',
                $classCount >= 1 ? null : 'Create at least one class.',
                ($sessionCount < 1 || ! $hasCurrentSession) ? 'Complete academic session first.' : null,
            ),
            $this->step(
                'subjects',
                'Subjects',
                $subjectCount >= 1 ? 'complete' : 'incomplete',
                $subjectCount >= 1 ? null : 'Add at least one subject.',
                $classCount < 1 ? 'Complete classes first.' : null,
            ),
            $this->step(
                'assessment_structure',
                'Assessment Structure',
                $hasAssessmentConfig ? 'complete' : 'incomplete',
                $hasAssessmentConfig ? null : 'Configure CA and exam weightings.',
            ),
            $this->step(
                'fees',
                'Fee Configuration',
                $hasFeeConfig ? 'complete' : 'incomplete',
                $hasFeeConfig ? null : 'Define at least one fee head.',
            ),
            $this->step(
                'import_students',
                'Import Students',
                $studentCount >= 1 ? 'complete' : 'incomplete',
                $studentCount >= 1 ? null : 'Register or import at least one student.',
                $classCount < 1 ? 'Complete classes first.' : null,
            ),
            $this->step(
                'invite_staff',
                'Invite Staff',
                $employeeCount >= 1 ? 'complete' : 'incomplete',
                $employeeCount >= 1 ? null : 'Add at least one staff member.',
            ),
            $this->step(
                'launch',
                'Launch Parent Access',
                $launchedAt ? 'complete' : 'incomplete',
                $launchedAt ? null : 'Complete critical setup steps before launch.',
            ),
        ];

        $criticalIds = ['campuses', 'academic_session', 'classes', 'subjects', 'import_students'];
        $criticalComplete = collect($steps)
            ->whereIn('id', $criticalIds)
            ->every(fn (array $step) => $step['status'] === 'complete');

        $completedCount = collect($steps)->where('status', 'complete')->count();
        $progress = (int) round(($completedCount / count($steps)) * 100);

        return [
            'progress' => $progress,
            'canLaunch' => $criticalComplete && ! $launchedAt,
            'requiresSetup' => ! $launchedAt && $progress < 100,
            'launchedAt' => $launchedAt,
            'tenant' => [
                'id' => $tenant->public_id,
                'name' => $tenant->name,
                'code' => $tenant->code,
                'motto' => data_get($settings, 'profile.motto'),
                'country' => data_get($settings, 'profile.country'),
                'state' => data_get($settings, 'profile.state'),
                'primaryColour' => data_get($settings, 'branding.primary_colour'),
            ],
            'steps' => $steps,
        ];
    }

    public function updateStep(Request $request, string $stepId): JsonResponse
    {
        return match ($stepId) {
            'school_profile' => $this->updateSchoolProfile($request),
            'assessment_structure' => $this->updateAssessmentStructure($request),
            'fees' => $this->updateFees($request),
            'launch' => $this->launch($request),
            default => ApiResponse::error('STEP_NOT_SUPPORTED', 'This onboarding step cannot be updated directly.', 404),
        };
    }

    private function updateSchoolProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'motto' => ['nullable', 'string', 'max:180'],
            'country' => ['nullable', 'string', 'max:80'],
            'state' => ['nullable', 'string', 'max:80'],
        ]);

        $tenant = $this->context->tenant();
        $settings = $tenant->settings ?? [];
        data_set($settings, 'profile.motto', $data['motto'] ?? null);
        data_set($settings, 'profile.country', $data['country'] ?? null);
        data_set($settings, 'profile.state', $data['state'] ?? null);
        $tenant->update(['name' => $data['name'], 'settings' => $settings]);
        $this->audit->record('onboarding.profile_updated', $request->user());

        return ApiResponse::success(['message' => 'School profile updated.']);
    }

    private function updateAssessmentStructure(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ca1Weight' => ['required', 'integer', 'min:0', 'max:100'],
            'ca2Weight' => ['required', 'integer', 'min:0', 'max:100'],
            'examWeight' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        if (($data['ca1Weight'] + $data['ca2Weight'] + $data['examWeight']) !== 100) {
            return ApiResponse::error('INVALID_WEIGHTS', 'Assessment weights must total 100%.', 422);
        }

        $tenant = $this->context->tenant();
        $settings = $tenant->settings ?? [];
        data_set($settings, 'assessment_structure', [
            'ca1_weight' => $data['ca1Weight'],
            'ca2_weight' => $data['ca2Weight'],
            'exam_weight' => $data['examWeight'],
        ]);
        $tenant->update(['settings' => $settings]);
        $this->audit->record('onboarding.assessment_structure_updated', $request->user());

        return ApiResponse::success(['message' => 'Assessment structure saved.']);
    }

    private function updateFees(Request $request): JsonResponse
    {
        $data = $request->validate([
            'feeHeads' => ['required', 'array', 'min:1'],
            'feeHeads.*.name' => ['required', 'string', 'max:120'],
            'feeHeads.*.amount' => ['required', 'numeric', 'min:0'],
        ]);

        $tenant = $this->context->tenant();
        $settings = $tenant->settings ?? [];
        data_set($settings, 'fee_heads', collect($data['feeHeads'])->map(fn (array $head) => [
            'name' => $head['name'],
            'amount' => (float) $head['amount'],
        ])->values()->all());
        $tenant->update(['settings' => $settings]);
        $this->audit->record('onboarding.fees_updated', $request->user());

        return ApiResponse::success(['message' => 'Fee configuration saved.']);
    }

    private function launch(Request $request): JsonResponse
    {
        $snapshot = $this->buildSnapshot();
        if (empty($snapshot['canLaunch'])) {
            return ApiResponse::error('ONBOARDING_INCOMPLETE', 'Complete the required setup steps before launch.', 422);
        }

        $tenant = $this->context->tenant();
        $settings = $tenant->settings ?? [];
        data_set($settings, 'onboarding.launched_at', now()->toIso8601String());
        data_set($settings, 'onboarding.parent_portal_enabled', true);
        $tenant->update(['settings' => $settings, 'status' => $tenant->status === 'trial' ? 'active' : $tenant->status]);

        DB::transaction(function () use ($request, $tenant): void {
            $this->audit->record('onboarding.launched', $request->user(), $tenant);
        });

        return ApiResponse::success([
            'message' => 'School setup complete. Parent access is now enabled.',
            'launchedAt' => data_get($tenant->fresh()->settings, 'onboarding.launched_at'),
        ]);
    }

    /** @return array{id: string, title: string, status: string, blocker: ?string, dependency: ?string} */
    private function step(
        string $id,
        string $title,
        string $status,
        ?string $blocker = null,
        ?string $dependency = null,
    ): array {
        if ($dependency && $status === 'incomplete') {
            $status = 'blocked';
            $blocker = $dependency;
        }

        return [
            'id' => $id,
            'title' => $title,
            'status' => $status,
            'blocker' => $blocker,
        ];
    }
}
