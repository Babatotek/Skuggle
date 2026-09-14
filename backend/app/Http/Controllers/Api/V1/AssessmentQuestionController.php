<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentBankQuestion;
use App\Models\AssessmentQuestion;
use App\Models\Employee;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Services\AcademicContext;
use App\Services\AssessmentCompleteService;
use App\Services\AssessmentAccess;
use App\Services\UploadSecurityScanner;
use Illuminate\Support\Facades\Storage;
use App\Services\AssessmentWorkflow;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AssessmentQuestionController extends Controller
{
    public function __construct(private AssessmentAccess $access) {}

    private function bankQuery(Request $request)
    {
        abort_unless($this->access->allows('assessment.assessment.view'), 403);
        [$session] = app(AcademicContext::class)->resolve($request);
        $query = AssessmentBankQuestion::query();
        if (! $this->access->tenantWide()) {
            $pairs = TeacherAssignment::query()->where('user_id', $request->user()->getKey())->where('academic_session_id', $session->getKey())->get();
            if (! Employee::query()->where('user_id', $request->user()->getKey())->where('status', 'active')->exists()) {
                return $query->whereRaw('1=0');
            }
            $query->where(function ($q) use ($pairs) {
                $q->whereRaw('1=0');
                foreach ($pairs as $pair) {
                    $q->orWhere(fn ($sub) => $sub->where('class_id', $pair->class_id)->where('subject_id', $pair->subject_id));
                }
            });
        }

        return $query;
    }

    private function present($q): array
    {
        return ['id' => $q->public_id, 'prompt' => $q->prompt, 'questionType' => $q->question_type, 'options' => $q->options ?? [], 'correctAnswer' => $q->correct_answer ?? '', 'rationale' => $q->rationale ?? '', 'rubric' => $q->rubric ?? [], 'marks' => (float) $q->marks, 'difficulty' => $q->difficulty ?? 'medium', 'topic' => $q->topic ?? '', 'curriculum' => $q->curriculum ?? '', 'learningObjective' => $q->learning_objective ?? '', 'source' => $q->source ?? '', 'status' => $q->status ?? 'accepted', 'aiGenerated' => (bool) ($q->ai_generated ?? false), 'position' => $q->position, 'section' => $q->learning_outcome ?? '', 'imageKey' => $q->image_key ?? null, 'hasImage' => filled($q->image_key ?? null)];
    }

    public function index(Request $request): JsonResponse
    {
        $q = $this->bankQuery($request);
        foreach (['status', 'difficulty', 'topic', 'curriculum', 'question_type'] as $field) {
            if ($request->filled($field)) {
                $q->where($field, $request->input($field));
            }
        }
        if ($request->filled('search')) {
            $q->where('prompt', 'like', '%'.mb_substr($request->string('search'), 0, 180).'%');
        }
        if ($request->input('author') === 'me') {
            $q->where('created_by', $request->user()->getKey());
        }
        if ($request->filled('classId')) {
            $q->whereIn('class_id', SchoolClass::query()->where('public_id', $request->input('classId'))->select('id'));
        }
        if ($request->filled('subjectId')) {
            $q->whereIn('subject_id', Subject::query()->where('public_id', $request->input('subjectId'))->select('id'));
        }
        $p = $q->latest()->paginate(10);

        return ApiResponse::success(['data' => collect($p->items())->map(fn ($x) => $this->present($x)), 'meta' => ['currentPage' => $p->currentPage(), 'lastPage' => $p->lastPage(), 'total' => $p->total(), 'perPage' => 10]]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.assessment.create'), 403);
        $data = $request->validate([
            'classId' => 'required|string',
            'subjectId' => 'required|string',
            'prompt' => 'required|string|max:20000',
            'questionType' => ['required', Rule::in(AssessmentWorkflow::QUESTION_TYPES)],
            'options' => 'array|max:30',
            'options.*' => 'nullable',
            'correctAnswer' => 'nullable|string|max:5000',
            'correctAnswers' => 'nullable|array|max:30',
            'correctAnswers.*' => 'string|max:2000',
            'matchingPairs' => 'nullable|array|max:30',
            'rationale' => 'nullable|string|max:5000',
            'rubric' => 'nullable|array|max:20',
            'rubric.*.label' => 'required_with:rubric|string|max:180',
            'rubric.*.maxMarks' => 'required_with:rubric|numeric|gt:0|max:1000',
            'marks' => 'required|numeric|gt:0|max:1000',
            'topic' => 'nullable|string|max:255',
            'curriculum' => 'nullable|string|max:255',
            'learningObjective' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:80',
            'difficulty' => 'required|in:easy,medium,difficult',
            'aiGenerated' => 'boolean',
        ]);
        if (($data['questionType'] ?? '') === 'multiple-response' && ! empty($data['correctAnswers'])) {
            $data['correctAnswer'] = json_encode(array_values($data['correctAnswers']));
        }
        if (($data['questionType'] ?? '') === 'matching' && ! empty($data['matchingPairs'])) {
            $data['options'] = ['left' => array_column($data['matchingPairs'], 'left'), 'right' => array_column($data['matchingPairs'], 'right'), 'pairs' => $data['matchingPairs']];
            $data['correctAnswer'] = json_encode($data['matchingPairs']);
        }
        [$session] = app(AcademicContext::class)->resolve($request);
        $class = SchoolClass::query()->where('public_id', $data['classId'])->firstOrFail();
        $subject = Subject::query()->where('public_id', $data['subjectId'])->firstOrFail();
        abort_unless($this->access->assigned($class->getKey(), $subject->getKey(), $session->getKey()), 403);
        abort_unless(DB::table('class_subject')->where('tenant_id', $class->tenant_id)->where('class_id', $class->getKey())->where('subject_id', $subject->getKey())->exists(), 422);
        $q = AssessmentBankQuestion::query()->create(['class_id' => $class->getKey(), 'subject_id' => $subject->getKey(), 'academic_session_id' => $session->getKey(), 'created_by' => $request->user()->getKey(), 'question_type' => $data['questionType'], 'prompt' => $data['prompt'], 'options' => $data['options'] ?? [], 'correct_answer' => $data['correctAnswer'] ?? '', 'rationale' => $data['rationale'] ?? '', 'rubric' => $data['rubric'] ?? null, 'marks' => $data['marks'], 'difficulty' => $data['difficulty'], 'topic' => $data['topic'] ?? '', 'curriculum' => $data['curriculum'] ?? '', 'learning_objective' => $data['learningObjective'] ?? '', 'source' => $data['source'] ?? ($data['aiGenerated'] ?? false ? 'ai' : 'teacher'), 'status' => 'draft', 'ai_generated' => $data['aiGenerated'] ?? false]);
        app(AuditLogger::class)->record('assessment.question_created', $q);

        return ApiResponse::success($this->present($q), [], 201);
    }

    public function update(string $question, Request $request): JsonResponse
    {
        $q = $this->bankQuery($request)->where('public_id', $question)->firstOrFail();
        $data = $request->validate(['prompt' => 'sometimes|required|string|max:20000', 'status' => 'sometimes|in:accepted,rejected', 'correctAnswer' => 'sometimes|nullable|string|max:5000', 'marks' => 'sometimes|numeric|gt:0|max:1000']);
        abort_unless($this->access->allows(isset($data['status']) ? 'assessment.question.review' : 'assessment.assessment.create'), 403);
        if (array_key_exists('correctAnswer', $data)) {
            $data['correct_answer'] = $data['correctAnswer'];
            unset($data['correctAnswer']);
        }
        if (! isset($data['status'])) {
            $data['status'] = 'draft';
        }
        $data['reviewed_by'] = $data['status'] === 'draft' ? null : $request->user()->getKey();
        $q->update($data);
        app(AuditLogger::class)->record('assessment.question_reviewed', $q, [], ['status' => $q->status]);

        return ApiResponse::success($this->present($q));
    }

    public function builder(string $assessment, Request $request): JsonResponse
    {
        [$session, $term] = app(AcademicContext::class)->resolve($request);
        $item = $this->access->scope(Assessment::query())->where('academic_session_id', $session->getKey())->where('term_id', $term->getKey())->where('public_id', $assessment)->firstOrFail();
        abort_unless($this->access->allows('assessment.assessment.view'), 403);
        if ($request->isMethod('put')) {
            abort_unless($this->access->allows('assessment.assessment.create'), 403);
            $data = $request->validate(['revision' => 'required|integer', 'questions' => 'present|array|max:200', 'questions.*.id' => 'required|string|distinct', 'questions.*.marks' => 'required|numeric|gt:0|max:1000', 'questions.*.section' => 'nullable|string|max:255']);
            DB::transaction(function () use ($item, $data, $request) {
                $item = Assessment::query()->whereKey($item->getKey())->lockForUpdate()->firstOrFail();
                abort_unless(in_array($item->status, ['draft', 'ready'], true) && $item->revision === $data['revision'], 409, 'Reload the draft before editing questions.');
                $existing = $item->questions()->get()->keyBy('public_id');
                $banks = $this->bankQuery($request)->whereIn('public_id', array_column($data['questions'], 'id'))->where('status', 'accepted')->where('subject_id', $item->subject_id)->where('class_id', $item->class_id)->get()->keyBy('public_id');
                $item->questions()->update(['position' => DB::raw('position + 10000')]);
                $keep = [];
                foreach ($data['questions'] as $index => $row) {
                    $source = $existing->get($row['id']) ?? $banks->get($row['id']);
                    abort_unless($source, 422, 'Only accepted questions for this class and subject can be added.');
                    $q = $existing->get($row['id']) ?? new AssessmentQuestion(['assessment_id' => $item->getKey(), 'question_type' => $source->question_type, 'prompt' => $source->prompt, 'options' => $source->options, 'correct_answer' => $source->correct_answer, 'rationale' => $source->rationale, 'rubric' => $source->rubric ?? null, 'learning_objective' => $source->learning_objective ?? null, 'image_key' => $source->image_key ?? null, 'source' => $source->source ?? 'bank']);
                    $q->fill(['position' => $index + 1, 'marks' => $row['marks'], 'learning_outcome' => $row['section'] ?? '']);
                    if (! empty($row['section'])) {
                        $section = $item->sections()->firstOrCreate(
                            ['title' => $row['section']],
                            ['position' => $item->sections()->count() + 1]
                        );
                        $q->section_id = $section->getKey();
                    }
                    $q->save();
                    $keep[] = $q->getKey();
                }
                $item->questions()->whereNotIn('id', $keep)->delete();
                $item->increment('revision');
                app(AuditLogger::class)->record('assessment.questions_saved', $item, [], ['count' => count($keep)]);
            });
            $item->refresh();
        }

        return ApiResponse::success(['revision' => $item->revision, 'editable' => in_array($item->status, ['draft', 'ready'], true) && $this->access->allows('assessment.assessment.create'), 'questions' => $item->questions()->orderBy('position')->get()->map(fn ($x) => $this->present($x))]);
    }

    public function media(string $question, Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.question.update') || $this->access->allows('assessment.assessment.create'), 403);
        $data = $request->validate(['file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120']]);
        $q = $this->bankQuery($request)->where('public_id', $question)->first();
        if (! $q) {
            $q = AssessmentQuestion::query()->where('public_id', $question)->firstOrFail();
        }
        app(UploadSecurityScanner::class)->scan($request->file('file'));
        $file = $request->file('file');
        $key = app(AssessmentCompleteService::class)->storeQuestionImage((string) $file->getContent(), strtolower($file->guessExtension() ?: 'png'));
        $q->update(['image_key' => $key]);

        return ApiResponse::success(['id' => $q->public_id, 'imageKey' => $key]);
    }

    public function showMedia(string $question, Request $request)
    {
        abort_unless($this->access->allows('assessment.question.view') || $this->access->allows('assessment.assessment.view') || $this->access->allows('assessment.cbt.attempt'), 403);
        $q = AssessmentBankQuestion::query()->where('public_id', $question)->first()
            ?: AssessmentQuestion::query()->where('public_id', $question)->firstOrFail();
        abort_unless($q->image_key, 404);

        return Storage::disk((string) config('skuggle.library.disk'))->response($q->image_key, 'question-'.$q->public_id, ['Cache-Control' => 'private, no-store']);
    }
}
