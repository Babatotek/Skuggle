<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\ResultPublication;
use App\Models\SchoolClass;
use App\Services\AcademicContext;
use App\Services\AuditLogger;
use App\Services\ResultPinService;
use App\Services\ResultReportService;
use App\Services\ResultWorkflowService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResultController extends Controller
{
    public function __construct(
        private readonly ResultWorkflowService $workflow,
        private readonly ResultReportService $reports,
        private readonly ResultPinService $pins,
        private readonly TenantContext $context,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = ResultPublication::query()
            ->with(['student.enrollments.schoolClass', 'academicSession', 'term'])
            ->withCount(['pins' => fn ($q) => $q->whereColumn('usage_count', '<', 'usage_limit')]);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->whereHas('student', function ($q) use ($search): void {
                $q->where('admission_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $items = $query->latest('updated_at')->limit(200)->get();

        return ApiResponse::success($items->map(fn (ResultPublication $item) => $this->presentSummary($item)));
    }

    public function generate(Request $request, AcademicContext $academic, AuditLogger $audit): JsonResponse
    {
        [$session, $term] = $academic->resolve($request);
        $data = $request->validate(['classId' => ['nullable', 'string', 'max:40']]);

        $classId = null;
        if (! empty($data['classId'])) {
            $classId = SchoolClass::query()->where('public_id', $data['classId'])->firstOrFail()->getKey();
        }

        $enrollments = Enrollment::query()
            ->where('academic_session_id', $session->getKey())
            ->where('status', 'active')
            ->when($classId, fn ($q) => $q->where('class_id', $classId))
            ->get();

        $created = 0;
        $existing = 0;
        foreach ($enrollments as $enrollment) {
            $publication = ResultPublication::query()->firstOrCreate(
                [
                    'student_id' => $enrollment->student_id,
                    'academic_session_id' => $session->getKey(),
                    'term_id' => $term->getKey(),
                ],
                ['status' => 'draft'],
            );
            $publication->wasRecentlyCreated ? $created++ : $existing++;
        }

        $audit->record('results.generated', $request->user(), [], [
            'session' => $session->public_id,
            'term' => $term->public_id,
            'created' => $created,
            'existing' => $existing,
        ]);

        return ApiResponse::success([
            'created' => $created,
            'existing' => $existing,
            'session' => $session->name,
            'term' => $term->name,
        ], [], $created > 0 ? 201 : 200);
    }

    public function show(string $publication): JsonResponse
    {
        $item = ResultPublication::query()
            ->where('public_id', $publication)
            ->with(['student.enrollments.schoolClass', 'academicSession', 'term'])
            ->withCount('pins')
            ->firstOrFail();

        return ApiResponse::success($this->presentSummary($item) + [
            'reportPreview' => $item->status === 'published'
                ? $this->reports->buildForPublication($item)
                : null,
        ]);
    }

    public function transition(Request $request, string $publication, string $action): JsonResponse
    {
        $item = ResultPublication::query()->where('public_id', $publication)->firstOrFail();
        $permission = $this->workflow->requiredPermission($action);
        $granted = $this->context->membership()->permissionNames();
        if (! in_array($permission, $granted, true)) {
            return ApiResponse::error('FORBIDDEN', 'You do not have permission to perform this action.', 403);
        }

        $result = $this->workflow->apply($item, $action, (int) $request->user()->getKey());

        $payload = $this->presentSummary($result['publication']);
        if ($result['issuedPin']) {
            $payload['issuedPin'] = $result['issuedPin'];
            $payload['issuedPinMasked'] = $this->pins->maskPlainPin($result['issuedPin']);
            $payload['hasActivePin'] = true;
        }

        return ApiResponse::success($payload);
    }

    public function bulkPublish(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['nullable', 'array', 'max:200'],
            'ids.*' => ['string', 'max:40'],
        ]);

        $query = ResultPublication::query()
            ->with(['student.enrollments.schoolClass', 'academicSession', 'term'])
            ->where('status', 'locked');

        if (! empty($data['ids'])) {
            $query->whereIn('public_id', $data['ids']);
        }

        $items = $query->orderBy('id')->limit(200)->get();
        $published = [];
        $errors = [];

        foreach ($items as $item) {
            try {
                $result = $this->workflow->apply($item, 'publish', (int) $request->user()->getKey());
                $payload = $this->presentSummary($result['publication']);
                if ($result['issuedPin']) {
                    $payload['issuedPin'] = $result['issuedPin'];
                    $payload['issuedPinMasked'] = $this->pins->maskPlainPin($result['issuedPin']);
                    $payload['hasActivePin'] = true;
                }
                $published[] = $payload;
            } catch (\Throwable $e) {
                $errors[] = [
                    'id' => $item->public_id,
                    'title' => trim("{$item->student->first_name} {$item->student->last_name}"),
                    'message' => $e->getMessage(),
                ];
            }
        }

        return ApiResponse::success([
            'published' => count($published),
            'failed' => count($errors),
            'items' => $published,
            'errors' => $errors,
        ]);
    }

    private function presentSummary(ResultPublication $item): array
    {
        $enrollment = $item->student->enrollments
            ->firstWhere('academic_session_id', $item->academic_session_id)
            ?? $item->student->enrollments->first();

        return [
            'id' => $item->public_id,
            'title' => trim("{$item->student->first_name} {$item->student->last_name}"),
            'admissionNumber' => $item->student->admission_number,
            'className' => trim(($enrollment?->schoolClass?->name ?? '').' '.($enrollment?->schoolClass?->arm ?? '')),
            'session' => $item->academicSession?->name,
            'term' => $item->term?->name,
            'status' => $item->status,
            'updatedAt' => $item->updated_at->toIso8601String(),
            'publishedAt' => $item->published_at?->toIso8601String(),
            'allowedActions' => $this->workflow->allowedActions($item->status),
            'hasActivePin' => ($item->pins_count ?? 0) > 0,
        ];
    }
}
