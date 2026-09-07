<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Campus;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\SmartmarkBatch;
use App\Models\Student;
use App\Models\Subject;
use App\Services\AcademicContext;
use App\Services\AssessmentAccess;
use App\Services\AssessmentItemAnalyticsService;
use App\Services\AssessmentTheoryMarkingService;
use App\Services\AssessmentWorkflow;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AssessmentController extends Controller
{
    public function __construct(private AssessmentAccess $access, private AssessmentWorkflow $workflow) {}

    private function query(Request $request)
    {
        abort_unless($this->access->allows('assessment.assessment.view'), 403);
        [$session, $term] = app(AcademicContext::class)->resolve($request);
        $campus = $request->hasSession() ? $request->session()->get('campus_public_id') : null;

        return $this->access->scope(Assessment::query())->where('academic_session_id', $session->getKey())->where('term_id', $term->getKey())
            ->when($campus, fn ($q) => $q->whereHas('schoolClass', fn ($class) => $class->whereIn('campus_id', Campus::query()->where('public_id', $campus)->select('id'))));
    }

    private function item(Request $request, string $id, bool $lock = false): Assessment
    {
        return $this->query($request)->where('public_id', $id)->when($lock, fn ($q) => $q->lockForUpdate())->firstOrFail();
    }

    private function withSummary($query)
    {
        return $query->with(['schoolClass', 'subject'])->withCount(['scores as marked_count' => fn ($q) => $q->where(function ($q) {
            $q->whereNotNull('score')->orWhereIn('status', ['ABSENT', 'EXEMPT']);
        })])
            ->addSelect(['expected_count' => Enrollment::query()->selectRaw('COUNT(DISTINCT student_id)')->whereColumn('class_id', 'assessments.class_id')->whereColumn('academic_session_id', 'assessments.academic_session_id')->where('status', 'active')]);
    }

    private function present(Assessment $item): array
    {
        $meta = $item->metadata ?? [];
        $expected = ($meta['participantMode'] ?? 'class') === 'selected' ? count($meta['studentIds'] ?? []) : (int) $item->expected_count;
        $duration = max(1, (int) ($meta['duration'] ?? 60));
        $availableFrom = $item->scheduled_at?->toIso8601String();
        $availableUntil = $item->scheduled_at?->copy()->addMinutes($duration)->toIso8601String();

        return ['id' => $item->public_id, 'title' => $item->title, 'type' => $item->type, 'classId' => $item->schoolClass?->public_id, 'className' => trim(($item->schoolClass?->name ?? '').' '.($item->schoolClass?->arm ?? '')), 'subjectId' => $item->subject?->public_id, 'subject' => $item->subject?->name,
            'date' => $item->scheduled_at?->toDateString(), 'scheduledAt' => $item->scheduled_at?->toIso8601String(), 'availableFrom' => $availableFrom, 'availableUntil' => $availableUntil, 'maxScore' => (float) $item->maximum_score, 'status' => $item->status, 'delivery' => $meta['delivery'] ?? 'manual', 'marked' => (int) ($item->marked_count ?? 0), 'expected' => $expected, 'revision' => $item->revision, 'metadata' => $meta,
            'scoreEntryAllowed' => $this->access->allows('assessment.score.enter') && in_array($item->status, AssessmentWorkflow::EDITABLE, true)];
    }

    public function lookups(Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.assessment.view'), 403);
        [$session, $term] = app(AcademicContext::class)->resolve($request);
        $classes = SchoolClass::query()->where('status', 'active')->orderBy('name')->get();
        $subjects = Subject::query()->where('status', 'active')->orderBy('name')->get();
        $links = DB::table('class_subject')->where('tenant_id', app(TenantContext::class)->tenantId())->get()->filter(fn ($link) => $this->access->assigned((int) $link->class_id, (int) $link->subject_id, (int) $session->getKey()));

        return ApiResponse::success(['classes' => $classes->whereIn('id', $links->pluck('class_id'))->map(fn ($x) => ['id' => $x->public_id, 'name' => trim($x->name.' '.$x->arm)])->values(), 'subjects' => $subjects->whereIn('id', $links->pluck('subject_id'))->map(fn ($x) => ['id' => $x->public_id, 'name' => $x->name, 'classIds' => $classes->whereIn('id', $links->where('subject_id', $x->getKey())->pluck('class_id'))->pluck('public_id')->values()])->values(), 'assessmentTypes' => collect(AssessmentWorkflow::TYPES)->map(fn ($x) => ['id' => $x, 'name' => ucwords(str_replace('-', ' ', $x))]), 'session' => ['id' => $session->public_id, 'name' => $session->name], 'term' => ['id' => $term->public_id, 'name' => $term->name]]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->query($request);
        foreach (['type', 'status'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.mb_substr($request->string('search'), 0, 180).'%');
        }
        if ($request->filled('classId')) {
            $query->whereHas('schoolClass', fn ($q) => $q->where('public_id', $request->input('classId')));
        }
        if ($request->filled('subjectId')) {
            $query->whereHas('subject', fn ($q) => $q->where('public_id', $request->input('subjectId')));
        }
        if ($request->filled('delivery')) {
            $query->where('metadata->delivery', $request->input('delivery'));
        }
        if ($request->filled('from')) {
            $query->whereDate('scheduled_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('scheduled_at', '<=', $request->date('to'));
        }
        if ($request->input('queue') === 'mine') {
            $query->where('created_by', $request->user()->getKey())->whereIn('status', ['completed', 'marking', 'moderation', 'submitted', 'reopened']);
        }
        if ($request->input('queue') === 'marking') {
            $query->whereIn('status', ['completed', 'marking', 'reopened', 'submitted']);
        }
        if ($request->input('queue') === 'moderation') {
            $query->whereIn('status', ['moderation', 'under_review']);
        }
        if ($request->input('queue') === 'locked') {
            $query->whereIn('status', ['locked', 'published']);
        }
        $p = $this->withSummary($query)->orderByDesc('scheduled_at')->orderByDesc('id')->paginate(min(max($request->integer('perPage', 10), 1), 100));

        return ApiResponse::success(['data' => collect($p->items())->map(fn ($x) => $this->present($x)), 'meta' => ['currentPage' => $p->currentPage(), 'perPage' => $p->perPage(), 'total' => $p->total(), 'lastPage' => $p->lastPage()]]);
    }

    public function overview(Request $request): JsonResponse
    {
        $query = $this->query($request);
        $counts = (clone $query)->selectRaw('status, COUNT(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');
        $sum = fn (array $states) => collect($states)->sum(fn ($state) => (int) ($counts[$state] ?? 0));
        $scheduled = (clone $query)->whereIn('status', ['scheduled', 'ready'])->where('scheduled_at', '>', now())->count();
        $workflow = ['Planned' => $sum(['draft', 'ready']), 'Scheduled' => $sum(['scheduled']), 'Delivered' => $sum(['active', 'completed']), 'Marking' => $sum(['marking', 'reopened', 'submitted']), 'Moderation' => $sum(['moderation', 'under_review', 'validated', 'approved']), 'Locked' => $sum(['locked', 'published'])];
        $recent = $this->withSummary(clone $query)->latest('updated_at')->limit(5)->get()->map(fn ($x) => $this->present($x));
        $upcoming = $this->withSummary(clone $query)->whereIn('status', ['ready', 'scheduled'])->where('scheduled_at', '>=', now())->orderBy('scheduled_at')->limit(5)->get()->map(fn ($x) => $this->present($x));
        $workQuery = (clone $query)->where('created_by', $request->user()->getKey())->whereIn('status', ['completed', 'marking', 'reopened', 'submitted', 'moderation', 'under_review']);
        $work = $this->withSummary($workQuery)->orderBy('scheduled_at')->limit(5)->get()->map(fn ($x) => $this->present($x));
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->startOfMonth()->subMonths($i);
            $monthly = (clone $query)->whereBetween('scheduled_at', [$month, $month->copy()->endOfMonth()]);
            $trend[] = ['month' => $month->format('M'), 'assessments' => (clone $monthly)->count(), 'completed' => (clone $monthly)->whereIn('status', ['completed', 'marking', 'moderation', 'locked', 'published', 'validated', 'approved'])->count()];
        }
        $coverage = (clone $query)->selectRaw("class_id, subject_id, COUNT(*) as planned, SUM(CASE WHEN status IN ('completed','marking','moderation','locked','published','validated','approved') THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status IN ('locked','published','validated','approved') THEN 1 ELSE 0 END) as marked")->groupBy('class_id', 'subject_id')->with(['schoolClass', 'subject'])->orderBy('class_id')->limit(5)->get()->map(fn ($x) => ['id' => $x->class_id.':'.$x->subject_id, 'className' => trim($x->schoolClass?->name.' '.$x->schoolClass?->arm), 'subject' => $x->subject?->name, 'planned' => (int) $x->planned, 'completed' => (int) $x->completed, 'marked' => (int) $x->marked]);

        return ApiResponse::success(['metrics' => ['active' => $sum(['active', 'completed', 'marking', 'reopened', 'submitted']), 'marking' => $sum(['completed', 'marking', 'reopened', 'submitted']), 'scheduled' => $scheduled, 'moderation' => $sum(['moderation', 'under_review'])], 'workflow' => $workflow, 'myWork' => $work, 'trend' => $trend, 'coverage' => $coverage, 'recent' => $recent, 'upcoming' => $upcoming]);
    }

    private function input(Request $request): array
    {
        return $request->validate(['title' => 'required|string|max:180', 'classId' => 'required|string', 'subjectId' => 'required|string', 'assessmentTypeId' => ['required', Rule::in(AssessmentWorkflow::TYPES)], 'date' => 'required|date', 'maxScore' => 'required|numeric|gt:0|max:1000', 'instructions' => 'nullable|string|max:5000', 'description' => 'nullable|string|max:5000', 'weighting' => 'nullable|numeric|min:0|max:100', 'code' => 'nullable|string|max:80', 'participantMode' => 'required|in:class,selected', 'studentIds' => 'array|max:500', 'studentIds.*' => 'string|distinct', 'contentMode' => 'required|in:score-only,questions', 'delivery' => 'required|in:manual,paper,smartmark,project,oral,cbt', 'startTime' => 'required|date_format:H:i', 'duration' => 'required|integer|min:1|max:600', 'venue' => 'required|string|max:180', 'invigilator' => 'required|string|max:180']);
    }

    public function papers(string $assessment, Request $request): JsonResponse
    {
        $item = $this->item($request, $assessment);
        $includeAnswers = $request->boolean('answers') && ($this->access->allows('assessment.assessment.create') || $this->access->allows('assessment.score.enter'));

        return ApiResponse::success($this->workflow->printPack($item, $includeAnswers));
    }

    public function itemAnalytics(string $assessment, Request $request): JsonResponse
    {
        $item = $this->item($request, $assessment);

        return ApiResponse::success(app(AssessmentItemAnalyticsService::class)->analyse($item));
    }

    public function exportScores(string $assessment, Request $request)
    {
        $item = $this->item($request, $assessment);
        abort_unless($this->access->allows('assessment.score.enter') || $this->access->allows('assessment.score.moderate'), 403);
        $item->loadMissing(['schoolClass', 'subject', 'scores']);
        $roster = $this->workflow->roster($item);
        $scores = $item->scores->keyBy('student_id');
        $lines = ['Admission,Name,Score,Status,Source'];
        foreach ($roster as $student) {
            $score = $scores->get($student->getKey());
            $lines[] = sprintf(
                '"%s","%s",%s,%s,%s',
                str_replace('"', '""', (string) $student->admission_number),
                str_replace('"', '""', trim($student->first_name.' '.$student->last_name)),
                $score?->score ?? '',
                $score?->status ?? 'MISSING',
                $score?->metadata['source'] ?? ''
            );
        }
        $filename = 'assessment-'.$item->public_id.'-scores.csv';

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function theorySuggest(string $assessment, string $student, Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.score.enter'), 403);
        $item = $this->item($request, $assessment);
        $this->authorize('updateScores', $item);
        $member = Student::query()->where('public_id', $student)->firstOrFail();
        abort_unless($this->workflow->roster($item)->contains(fn ($row) => (int) $row->getKey() === (int) $member->getKey()), 422, 'Student is not on this roster.');
        $suggestion = app(AssessmentTheoryMarkingService::class)->suggest($item, $member);

        return ApiResponse::success($suggestion);
    }

    public function theoryApply(string $assessment, string $student, Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.score.enter'), 403);
        $item = $this->item($request, $assessment);
        $this->authorize('updateScores', $item);
        $data = $request->validate([
            'score' => 'required|numeric|min:0',
            'suggestion' => 'required|array',
        ]);
        $member = Student::query()->where('public_id', $student)->firstOrFail();
        abort_unless($this->workflow->roster($item)->contains(fn ($row) => (int) $row->getKey() === (int) $member->getKey()), 422, 'Student is not on this roster.');
        $row = app(AssessmentTheoryMarkingService::class)->applySuggestion(
            $item,
            $member,
            (float) $data['score'],
            $request->user()->getKey(),
            $data['suggestion']
        );

        return ApiResponse::success([
            'studentId' => $member->public_id,
            'score' => (float) $row->score,
            'status' => $row->status,
            'revision' => $item->fresh()->revision,
        ]);
    }

    public function moderation(string $assessment, Request $request): JsonResponse
    {
        $item = $this->item($request, $assessment);
        abort_unless(
            $this->access->allows('assessment.score.moderate')
            || $this->access->allows('assessment.score.lock')
            || $this->access->allows('assessment.score.unlock')
            || $this->access->allows('assessment.score.enter'),
            403
        );

        return ApiResponse::success($this->workflow->moderationReview($item));
    }

    private function persist(Request $request, ?Assessment $item = null): Assessment
    {
        abort_unless($this->access->allows('assessment.assessment.create'), 403);
        $data = $this->input($request);
        [$session, $term] = app(AcademicContext::class)->resolve($request);
        $class = SchoolClass::query()->where('public_id', $data['classId'])->where('status', 'active')->firstOrFail();
        $subject = Subject::query()->where('public_id', $data['subjectId'])->where('status', 'active')->firstOrFail();
        abort_unless($this->access->assigned($class->getKey(), $subject->getKey(), $session->getKey()), 403);
        abort_unless(DB::table('class_subject')->where('tenant_id', app(TenantContext::class)->tenantId())->where('class_id', $class->getKey())->where('subject_id', $subject->getKey())->exists(), 422, 'The subject is not offered by this class.');
        if ($data['participantMode'] === 'selected') {
            abort_if(empty($data['studentIds']), 422, 'Select at least one participant.');
            $count = Enrollment::query()->where('class_id', $class->getKey())->where('academic_session_id', $session->getKey())->where('status', 'active')->whereHas('student', fn ($q) => $q->whereIn('public_id', $data['studentIds']))->distinct()->count('student_id');
            abort_unless($count === count($data['studentIds']), 422, 'Participants must belong to this class and academic session.');
        }
        if ($item) {
            abort_unless(in_array($item->status, ['draft', 'ready'], true) && ! $item->scores()->exists(), 409, 'Only unmarked drafts can be edited.');
        }
        if ($data['delivery'] === 'cbt') {
            $data['contentMode'] = 'questions';
            $data['venue'] = trim((string) $data['venue']) !== '' ? $data['venue'] : 'Online';
            $data['invigilator'] = trim((string) $data['invigilator']) !== '' ? $data['invigilator'] : 'System';
        }
        $item ??= new Assessment(['created_by' => $request->user()->getKey(), 'status' => 'draft', 'revision' => 0]);
        $item->fill(['class_id' => $class->getKey(), 'subject_id' => $subject->getKey(), 'academic_session_id' => $session->getKey(), 'term_id' => $term->getKey(), 'title' => $data['title'], 'type' => $data['assessmentTypeId'], 'maximum_score' => $data['maxScore'], 'scheduled_at' => $data['date'].' '.($data['startTime'] ?? '00:00'), 'metadata' => array_merge($item->metadata ?? [], collect($data)->except(['title', 'classId', 'subjectId', 'assessmentTypeId', 'date', 'maxScore'])->all()), 'revision' => $item->revision + 1])->save();
        app(AuditLogger::class)->record('assessment.saved', $item, [], ['revision' => $item->revision]);

        return $item;
    }

    public function store(Request $request): JsonResponse
    {
        $item = DB::transaction(fn () => $this->persist($request));

        return ApiResponse::success(['id' => $item->public_id], [], 201);
    }

    public function import(Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.assessment.create'), 403);
        $data = $request->validate(['records' => 'required|array|min:1|max:100', 'records.*' => 'required|array']);
        DB::transaction(function () use ($request, $data): void {
            foreach ($data['records'] as $record) {
                $row = Request::create($request->path(), 'POST', $record);
                if ($request->hasSession()) {
                    $row->setLaravelSession($request->session());
                }
                $row->setUserResolver($request->getUserResolver());
                $this->persist($row);
            }
        });

        return ApiResponse::success(['imported' => count($data['records'])], [], 201);
    }

    public function update(string $assessment, Request $request): JsonResponse
    {
        $item = DB::transaction(fn () => $this->persist($request, $this->item($request, $assessment, true)));

        return ApiResponse::success(['id' => $item->public_id]);
    }

    public function show(string $assessment, Request $request): JsonResponse
    {
        $item = $this->withSummary($this->query($request))->where('public_id', $assessment)->firstOrFail();

        return ApiResponse::success($this->present($item));
    }

    public function participants(Request $request): JsonResponse
    {
        [$session] = app(AcademicContext::class)->resolve($request);
        $class = SchoolClass::query()->where('public_id', $request->input('classId'))->firstOrFail();
        $subject = Subject::query()->where('public_id', $request->input('subjectId'))->firstOrFail();
        abort_unless($this->access->allows('assessment.assessment.create') && $this->access->assigned($class->getKey(), $subject->getKey(), $session->getKey()), 403);
        $p = Enrollment::query()->where('class_id', $class->getKey())->where('academic_session_id', $session->getKey())->where('status', 'active')->with('student')->paginate(100);

        return ApiResponse::success(['data' => collect($p->items())->map(fn ($x) => ['id' => $x->student->public_id, 'name' => trim($x->student->first_name.' '.$x->student->last_name)]), 'meta' => ['currentPage' => $p->currentPage(), 'lastPage' => $p->lastPage(), 'total' => $p->total()]]);
    }

    public function scores(string $assessment, Request $request): JsonResponse
    {
        $item = $this->item($request, $assessment);
        $scores = $item->scores()->get()->keyBy('student_id');

        return ApiResponse::success(['assessmentId' => $item->public_id, 'title' => $item->title, 'maxScore' => (float) $item->maximum_score, 'status' => $item->status, 'editable' => $this->access->allows('assessment.score.enter') && in_array($item->status, AssessmentWorkflow::EDITABLE, true), 'revision' => $this->workflow->revision($item), 'students' => $this->workflow->roster($item)->map(function ($student) use ($scores) {
            $score = $scores->get($student->getKey());

            return ['id' => $student->public_id, 'admissionNumber' => $student->admission_number, 'fullName' => trim($student->first_name.' '.$student->middle_name.' '.$student->last_name), 'score' => $score?->score === null ? null : (float) $score->score, 'state' => $score?->status === 'draft' ? ($score->score === null ? 'NOT_ENTERED' : 'ENTERED') : ($score?->status ?? 'NOT_ENTERED'), 'comment' => $score?->metadata['comment'] ?? ''];
        })]);
    }

    public function updateScores(string $assessment, Request $request): JsonResponse
    {
        $data = $request->validate(['revision' => 'required|string|max:100', 'scores' => 'required|array|max:500', 'scores.*' => 'nullable|numeric|min:0', 'states' => 'array|max:500', 'states.*' => 'in:NOT_ENTERED,ENTERED,ABSENT,EXEMPT', 'comments' => 'array|max:500', 'comments.*' => 'nullable|string|max:1000']);

        return ApiResponse::success(['revision' => $this->workflow->save($this->item($request, $assessment), $data, $request->user()->getKey())]);
    }

    public function transition(string $assessment, Request $request): JsonResponse
    {
        $data = $request->validate([
            'action' => 'required|in:ready,schedule,activate,complete,submit,moderate,lock,reopen,cancel',
            'reason' => 'nullable|string|max:1000',
            'revision' => 'required|integer|min:1',
            'acknowledgeImpact' => 'sometimes|boolean',
            'acknowledgeWarnings' => 'sometimes|boolean',
        ]);
        $result = DB::transaction(function () use ($assessment, $request, $data) {
            $item = $this->item($request, $assessment, true);
            abort_unless((int) $item->revision === (int) $data['revision'], 409, 'Assessment changed. Reload before continuing.');
            $map = [
                'ready' => ['draft', 'ready'],
                'schedule' => ['ready', 'scheduled'],
                'activate' => ['scheduled', 'active'],
                'complete' => ['active', 'completed'],
                'submit' => ['completed,marking,reopened,submitted', 'moderation'],
                'moderate' => ['moderation,under_review', 'validated'],
                'lock' => ['validated,approved', 'locked'],
                'reopen' => ['locked', 'reopened'],
                'cancel' => ['draft,ready,scheduled', 'cancelled'],
            ];
            [$from, $to] = $map[$data['action']];
            $settings = app(TenantContext::class)->tenant()->settings['assessment'] ?? [];
            $multiStage = (bool) ($settings['multiStageModeration'] ?? true);
            if ($data['action'] === 'moderate' && $multiStage && $item->status === 'moderation') {
                $to = 'under_review';
            }
            if ($data['action'] === 'lock' && ! ($settings['moderationRequired'] ?? true)) {
                $from .= ',completed,marking,reopened';
            }
            abort_unless(in_array($item->status, explode(',', $from), true), 409, 'This transition is unavailable in the current state.');
            $cap = match ($data['action']) {
                'moderate' => 'assessment.score.moderate', 'lock' => 'assessment.score.lock', 'reopen' => 'assessment.score.unlock', 'submit' => 'assessment.score.enter', default => 'assessment.assessment.create'
            };
            abort_unless($this->access->allows($cap), 403);
            if ($data['action'] === 'reopen') {
                abort_if(empty(trim($data['reason'] ?? '')), 422, 'A reason is required to reopen scores.');
                $impact = $this->workflow->unlockImpact($item);
                if (($impact['requiresAcknowledgement'] ?? false) && ! ($data['acknowledgeImpact'] ?? false)) {
                    throw new ApiException('UNLOCK_IMPACT_UNACKNOWLEDGED', 'Acknowledge the Performance and results impact before unlocking scores.', 422, [
                        'warnings' => $impact['warnings'],
                    ]);
                }
            }
            if (in_array($data['action'], ['ready', 'schedule'], true) && ($item->metadata['contentMode'] ?? 'score-only') === 'questions') {
                abort_unless($item->questions()->exists() && abs((float) $item->questions()->sum('marks') - (float) $item->maximum_score) < 0.001, 422, 'Question marks must equal the maximum score.');
            }
            if ($data['action'] === 'schedule') {
                abort_unless($item->scheduled_at && $item->scheduled_at->isFuture(), 422, 'Choose a future schedule.');
                abort_if(trim((string) ($item->metadata['venue'] ?? '')) === '', 422, 'Venue is required before scheduling.');
                abort_if(trim((string) ($item->metadata['invigilator'] ?? '')) === '', 422, 'Invigilator is required before scheduling.');
                abort_if(empty($item->metadata['startTime'] ?? null), 422, 'Start time is required before scheduling.');
                abort_if((int) ($item->metadata['duration'] ?? 0) < 1, 422, 'Duration is required before scheduling.');
                $duration = max(1, (int) ($item->metadata['duration'] ?? 60));
                $start = $item->scheduled_at;
                $candidates = $this->query($request)->whereKeyNot($item->getKey())->whereIn('status', ['scheduled', 'active'])
                    ->whereBetween('scheduled_at', [$start->copy()->subHours(12), $start->copy()->addMinutes($duration + 720)])
                    ->get();
                $conflicts = $this->workflow->scheduleConflicts($item, $candidates);
                if ($conflicts !== []) {
                    throw new ApiException('SCHEDULE_CONFLICT', $conflicts[0]['message'], 422, [
                        'conflicts' => array_values(array_unique(array_column($conflicts, 'message'))),
                    ]);
                }
            }
            if (in_array($data['action'], ['submit', 'moderate', 'lock'], true)) {
                $ids = $this->workflow->roster($item)->pluck('id');
                $valid = $item->scores()->whereIn('student_id', $ids)->where(fn ($q) => $q->whereBetween('score', [0, $item->maximum_score])->orWhereIn('status', ['ABSENT', 'EXEMPT']))->count();
                abort_unless($ids->count() > 0 && $valid === $ids->count(), 422, 'Resolve all missing or invalid scores first.');
                abort_if(SmartmarkBatch::query()->where('assessment_id', $item->getKey())->whereNotIn('state', ['committed'])->exists(), 422, 'Resolve and commit outstanding SmartMark evidence first.');
            }
            if (in_array($data['action'], ['moderate', 'lock'], true)) {
                $failures = $this->workflow->blockingModerationFailures($item);
                if ($failures !== []) {
                    throw new ApiException('MODERATION_CHECKS_FAILED', $failures[0]['message'], 422, [
                        'checks' => array_column($failures, 'message'),
                    ]);
                }
                $warnings = array_values(array_filter(
                    $this->workflow->moderationReview($item)['checks'],
                    fn (array $check) => $check['status'] === 'warn'
                ));
                if ($warnings !== [] && ! ($data['acknowledgeWarnings'] ?? false)) {
                    throw new ApiException('MODERATION_WARNINGS_UNACKNOWLEDGED', $warnings[0]['message'], 422, [
                        'warnings' => array_column($warnings, 'message'),
                    ]);
                }
            }
            $before = $item->status;
            $metadata = $item->metadata ?? [];
            if ($data['action'] === 'submit') {
                $metadata = array_merge($metadata, [
                    'submittedAt' => now()->toIso8601String(),
                    'submittedBy' => $request->user()->getKey(),
                    'moderationStage' => 'subject_head',
                ]);
            }
            if ($data['action'] === 'moderate') {
                if ($to === 'under_review') {
                    $metadata = array_merge($metadata, [
                        'subjectHeadApprovedAt' => now()->toIso8601String(),
                        'subjectHeadApprovedBy' => $request->user()->getKey(),
                        'moderationStage' => 'examination_officer',
                        'moderationWarningsAcknowledged' => (bool) ($data['acknowledgeWarnings'] ?? false),
                    ]);
                } else {
                    $metadata = array_merge($metadata, [
                        'moderatedAt' => now()->toIso8601String(),
                        'moderatedBy' => $request->user()->getKey(),
                        'eoApprovedAt' => now()->toIso8601String(),
                        'eoApprovedBy' => $request->user()->getKey(),
                        'moderationStage' => 'validated',
                        'moderationWarningsAcknowledged' => (bool) ($data['acknowledgeWarnings'] ?? false),
                    ]);
                }
            }
            if ($to === 'locked') {
                $metadata = array_merge($metadata, ['lockedAt' => now()->toIso8601String(), 'lockVersion' => ($metadata['lockVersion'] ?? 0) + 1]);
            }
            if ($to === 'reopened') {
                $metadata = array_merge($metadata, [
                    'reopenedAt' => now()->toIso8601String(),
                    'reopenedBy' => $request->user()->getKey(),
                    'reopenReason' => $data['reason'] ?? null,
                    'unlockImpactAcknowledged' => (bool) ($data['acknowledgeImpact'] ?? false),
                ]);
            }
            $item->update(['status' => $to, 'revision' => $item->revision + 1, 'metadata' => $metadata]);
            if (in_array($to, ['validated', 'locked'], true)) {
                $item->scores()->whereNotIn('status', ['ABSENT', 'EXEMPT'])->update(['status' => $to === 'locked' ? 'LOCKED' : 'MODERATED']);
            }
            if ($to === 'reopened') {
                $item->scores()->where('status', 'LOCKED')->update(['status' => 'ENTERED']);
            }
            app(AuditLogger::class)->record('assessment.'.$data['action'], $item, ['status' => $before], ['status' => $to, 'reason' => $data['reason'] ?? null]);

            $payload = ['id' => $item->public_id, 'status' => $to, 'revision' => $item->revision];
            if ($data['action'] === 'reopen') {
                $payload['unlockImpact'] = $this->workflow->unlockImpact($item->fresh());
            }

            return $payload;
        });

        return ApiResponse::success($result);
    }

    public function settings(Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.settings.configure'), 403);
        $tenant = app(TenantContext::class)->tenant();
        if ($request->isMethod('put')) {
            $data = $request->validate(['moderationRequired' => 'required|boolean', 'defaultDuration' => 'required|integer|min:1|max:600']);
            $tenant->update(['settings' => array_merge($tenant->settings ?? [], ['assessment' => $data])]);
            app(AuditLogger::class)->record('assessment.settings_updated', $tenant, [], $data);
        }

        return ApiResponse::success(array_merge(['moderationRequired' => true, 'defaultDuration' => 60], $tenant->settings['assessment'] ?? []));
    }
}
