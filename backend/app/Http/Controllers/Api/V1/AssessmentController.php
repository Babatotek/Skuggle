<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Assessments\SaveScoresRequest;
use App\Http\Requests\Assessments\StoreAssessmentRequest;
use App\Models\Assessment;
use App\Models\AssessmentScore;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Services\AcademicContext;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AssessmentController extends Controller
{
    public function lookups(Request $request, AcademicContext $academic): JsonResponse
    {
        [$session, $term] = $academic->resolve($request);
        $classes = SchoolClass::query()->where('status', 'active')->orderBy('name')->get();
        $subjects = Subject::query()->where('status', 'active')->orderBy('name')->get();
        $links = DB::table('class_subject')->whereIn('class_id', $classes->pluck('id'))->get()->groupBy('subject_id');

        return ApiResponse::success(['classes' => $classes->map(fn ($item) => ['id' => $item->public_id, 'name' => trim($item->name.' '.$item->arm)]), 'subjects' => $subjects->map(fn ($item) => ['id' => $item->public_id, 'name' => $item->name, 'classIds' => collect($links->get($item->getKey(), []))->map(fn ($link) => $classes->firstWhere('id', $link->class_id)?->public_id)->filter()->values()]), 'assessmentTypes' => [['id' => 'quiz', 'name' => 'Quiz', 'defaultMaxScore' => 20], ['id' => 'assignment', 'name' => 'Assignment', 'defaultMaxScore' => 20], ['id' => 'test', 'name' => 'Continuous assessment', 'defaultMaxScore' => 40], ['id' => 'exam', 'name' => 'Examination', 'defaultMaxScore' => 100]], 'session' => ['id' => $session->public_id, 'name' => $session->name], 'term' => ['id' => $term->public_id, 'name' => $term->name]]);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Assessment::class);
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = Assessment::query()->with(['schoolClass', 'subject'])->latest('scheduled_at')->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn ($item) => [
                'id' => $item->public_id,
                'title' => $item->title,
                'subject' => $item->subject?->name,
                'className' => trim(($item->schoolClass?->name ?? '').' '.($item->schoolClass?->arm ?? '')),
                'date' => $item->scheduled_at?->toDateString(),
                'maxScore' => (float) $item->maximum_score,
                'status' => $item->status,
                'scoreEntryAllowed' => in_array($item->status, ['draft', 'submitted', 'reopened'], true),
            ]),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreAssessmentRequest $request, AcademicContext $academic, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Assessment::class);
        [$session, $term] = $academic->resolve($request);
        $class = SchoolClass::query()->where('public_id', $request->string('classId'))->firstOrFail();
        $subject = Subject::query()->where('public_id', $request->string('subjectId'))->firstOrFail();
        $assessment = Assessment::query()->create(['class_id' => $class->getKey(), 'subject_id' => $subject->getKey(), 'academic_session_id' => $session->getKey(), 'term_id' => $term->getKey(), 'created_by' => $request->user()->getKey(), 'title' => $request->string('title')->toString(), 'type' => $request->string('assessmentTypeId')->toString(), 'maximum_score' => $request->float('maxScore'), 'status' => 'draft', 'scheduled_at' => $request->date('date')->startOfDay(), 'metadata' => ['instructions' => $request->input('instructions')]]);
        $audit->record('assessment.created', $assessment, [], ['class' => $class->public_id, 'subject' => $subject->public_id]);

        return ApiResponse::success(['id' => $assessment->public_id], [], 201);
    }

    public function scores(string $assessment): JsonResponse
    {
        $item = Assessment::query()->where('public_id', $assessment)->with(['schoolClass', 'subject'])->firstOrFail();
        $this->authorize('view', $item);
        $enrollments = Enrollment::query()->where('class_id', $item->class_id)->where('academic_session_id', $item->academic_session_id)->where('status', 'active')->with('student')->get();
        $scores = AssessmentScore::query()->where('assessment_id', $item->getKey())->get()->keyBy('student_id');

        return ApiResponse::success(['assessmentId' => $item->public_id, 'title' => $item->title, 'className' => trim($item->schoolClass->name.' '.$item->schoolClass->arm), 'subject' => $item->subject->name, 'maxScore' => (float) $item->maximum_score, 'revision' => $this->scoreRevision($item), 'students' => $enrollments->map(fn ($enrollment) => ['id' => $enrollment->student->public_id, 'admissionNumber' => $enrollment->student->admission_number, 'fullName' => trim("{$enrollment->student->first_name} {$enrollment->student->middle_name} {$enrollment->student->last_name}"), 'score' => ($score = $scores->get($enrollment->student_id)) && $score->score !== null ? (float) $score->score : null])]);
    }

    public function updateScores(string $assessment, SaveScoresRequest $request, AuditLogger $audit): JsonResponse
    {
        $item = Assessment::query()->where('public_id', $assessment)->firstOrFail();
        $this->authorize('updateScores', $item);
        Cache::lock("skuggle:v1:assessment:{$item->tenant_id}:{$item->getKey()}:scores", 20)->block(5, function () use ($item, $request, $audit): void {
            DB::transaction(function () use ($item, $request, $audit): void {
                if (! hash_equals($this->scoreRevision($item), $request->string('revision')->toString())) {
                    throw new ApiException('REVISION_CONFLICT', 'Scores were changed by another user. Reload before saving.', 409);
                }
                $roster = Enrollment::query()->where('class_id', $item->class_id)->where('academic_session_id', $item->academic_session_id)->where('status', 'active')->with('student')->get()->pluck('student', 'student.public_id');
                foreach ($request->validated('scores') as $studentPublicId => $value) {
                    $student = $roster->get($studentPublicId);
                    if (! $student) {
                        throw new ApiException('INVALID_ROSTER', 'A score references a student outside this class.', 422);
                    }
                    if ($value !== null && (float) $value > (float) $item->maximum_score) {
                        throw new ApiException('SCORE_OUT_OF_RANGE', "A score cannot exceed {$item->maximum_score}.", 422);
                    }
                    $score = AssessmentScore::query()->where('assessment_id', $item->getKey())->where('student_id', $student->getKey())->lockForUpdate()->first();
                    if ($score) {
                        $score->update(['score' => $value, 'graded_by' => $request->user()->getKey(), 'graded_at' => now(), 'revision' => $score->revision + 1]);
                    } else {
                        AssessmentScore::query()->create(['assessment_id' => $item->getKey(), 'student_id' => $student->getKey(), 'score' => $value, 'status' => 'draft', 'graded_by' => $request->user()->getKey(), 'graded_at' => now()]);
                    }
                }
                $audit->record('assessment.scores_saved', $item, [], ['scores_updated' => count($request->validated('scores'))]);
            });
        });

        return ApiResponse::success(['revision' => $this->scoreRevision($item)]);
    }

    private function scoreRevision(Assessment $assessment): string
    {
        $state = AssessmentScore::query()->where('assessment_id', $assessment->getKey())->selectRaw('COUNT(*) aggregate_count, COALESCE(MAX(revision), 0) max_revision, COALESCE(MAX(updated_at), "1970-01-01") last_update')->first();

        return hash('sha256', "{$assessment->revision}|{$state->aggregate_count}|{$state->max_revision}|{$state->last_update}");
    }
}
