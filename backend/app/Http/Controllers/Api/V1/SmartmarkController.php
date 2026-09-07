<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Assessments\SmartmarkConfidenceBand;
use App\Domain\Tenancy\TenantContext;
use App\Domain\Tenancy\TenantJobEnvelope;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessSmartmarkBatch;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentScore;
use App\Models\SmartmarkBatch;
use App\Models\SmartmarkSheet;
use App\Models\Student;
use App\Services\AssessmentAccess;
use App\Services\AssessmentWorkflow;
use App\Services\AuditLogger;
use App\Services\SmartmarkMatchingService;
use App\Services\SmartmarkScoringService;
use App\Services\UploadSecurityScanner;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class SmartmarkController extends Controller
{
    public function index(SmartmarkMatchingService $matcher): JsonResponse
    {
        $access = app(AssessmentAccess::class);
        abort_unless($access->allows('assessment.assessment.view'), 403);

        $batches = SmartmarkBatch::query()
            ->whereIn('assessment_id', $access->scope(Assessment::query())->select('id'))
            ->with(['sheets', 'assessment'])
            ->latest()
            ->limit(50)
            ->get();

        return ApiResponse::success($batches->map(fn (SmartmarkBatch $batch) => $this->present($batch, $matcher))->values()->all());
    }

    public function store(Request $request, UploadSecurityScanner $scanner): JsonResponse
    {
        abort_unless(app(AssessmentAccess::class)->allows('assessment.smartmark.process'), 403);
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:20480'],
            'assessmentId' => ['required', 'string'],
            'answerKey' => ['nullable', 'array', 'min:1', 'max:200'],
            'answerKey.*' => ['required', 'string', 'max:2'],
            'maxScore' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);
        $assessment = Assessment::query()->where('public_id', $data['assessmentId'])->firstOrFail();
        $this->authorize('updateScores', $assessment);
        $answerKey = array_map('strtoupper', $data['answerKey'] ?? $this->answerKeyFromQuestions($assessment));
        abort_if($answerKey === [], 422, 'Provide an answer key or attach auto-markable questions before scanning.');
        $maxScore = (int) ($data['maxScore'] ?? $assessment->maximum_score);
        abort_if($maxScore > (float) $assessment->maximum_score, 422, 'Batch max score cannot exceed the assessment maximum.');
        $file = $request->file('file');
        $scanner->scan($file);
        $disk = (string) config('skuggle.library.disk');
        $extension = strtolower($file->guessExtension() ?: $file->getClientOriginalExtension() ?: 'png');
        $key = 'smartmark/'.app(TenantContext::class)->tenantId().'/'.Str::ulid().'.'.$extension;
        $bytes = $file->getContent();
        Storage::disk($disk)->put($key, $bytes, ['visibility' => 'private']);
        $batch = SmartmarkBatch::query()->create([
            'assessment_id' => $assessment->getKey(),
            'created_by' => $request->user()->getKey(),
            'state' => 'queued',
            'storage_key' => $key,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'size_bytes' => $file->getSize(),
            'sha256' => hash('sha256', $bytes),
            'answer_key' => $answerKey,
            'max_score' => $maxScore,
        ]);
        ProcessSmartmarkBatch::dispatch($batch->getKey(), TenantJobEnvelope::fromContext(app(TenantContext::class))->toArray());
        app(AuditLogger::class)->record('assessment.smartmark_queued', $assessment, [], ['batchId' => $batch->public_id]);

        return ApiResponse::success($this->present($batch->load('sheets'), app(SmartmarkMatchingService::class)), [], 202);
    }

    public function show(string $batch, SmartmarkMatchingService $matcher): JsonResponse
    {
        $item = SmartmarkBatch::query()->with(['sheets', 'assessment'])->where('public_id', $batch)->firstOrFail();
        $assessment = Assessment::query()->findOrFail($item->assessment_id);
        $this->authorize('view', $assessment);

        return ApiResponse::success($this->present($item, $matcher));
    }

    public function scan(string $batch)
    {
        $item = SmartmarkBatch::query()->where('public_id', $batch)->firstOrFail();
        $this->authorize('view', Assessment::query()->findOrFail($item->assessment_id));

        return Storage::disk((string) config('skuggle.library.disk'))->response($item->storage_key, $item->original_filename, ['Cache-Control' => 'private, no-store']);
    }

    public function review(Request $request, string $sheet, SmartmarkMatchingService $matcher, SmartmarkScoringService $scoring): JsonResponse
    {
        abort_unless(app(AssessmentAccess::class)->allows('assessment.smartmark.review'), 403);
        $item = SmartmarkSheet::query()->where('public_id', $sheet)->firstOrFail();
        $batch = SmartmarkBatch::query()->with('assessment')->findOrFail($item->batch_id);
        $assessment = Assessment::query()->findOrFail($batch->assessment_id);
        $this->authorize('updateScores', $assessment);
        abort_if($batch->state === 'committed', 409, 'This batch has already been committed.');
        $data = $request->validate([
            'detectedScore' => ['nullable', 'numeric', 'min:0'],
            'answers' => ['nullable', 'array', 'max:200'],
            'answers.*' => ['nullable', 'string', 'max:2'],
            'studentId' => ['nullable', 'string'],
            'approved' => ['required', 'boolean'],
        ]);
        $studentId = $item->student_id;
        if (! empty($data['studentId'])) {
            $student = Student::query()->where('public_id', $data['studentId'])->firstOrFail();
            abort_unless($matcher->findOnRoster(app(AssessmentWorkflow::class)->roster($assessment), (int) $student->getKey()) !== null, 422, 'Student is not on this assessment roster.');
            $studentId = $student->getKey();
            $item->admission_number = $student->admission_number;
            $item->student_name = trim(($student->first_name ?? '').' '.($student->last_name ?? ''));
        }
        abort_if($data['approved'] && ! $studentId, 422, 'Match an eligible student before approving this script.');
        $answers = array_map(fn ($answer) => strtoupper((string) $answer), $data['answers'] ?? $item->answers ?? []);
        $score = array_key_exists('detectedScore', $data) && $data['detectedScore'] !== null
            ? (float) $data['detectedScore']
            : $scoring->evaluate($answers, $batch->answer_key, (int) $batch->max_score, 100, null, $studentId !== null)['detected_score'];
        abort_if($score > (float) $assessment->maximum_score, 422, 'Score exceeds assessment maximum.');
        $item->update([
            'student_id' => $studentId,
            'admission_number' => $item->admission_number,
            'student_name' => $item->student_name,
            'answers' => $answers,
            'detected_score' => $score,
            'human_review_required' => ! $data['approved'],
            'flag_reason' => $data['approved'] ? null : ($item->flag_reason ?: 'Teacher marked for further review.'),
            'reviewed_by' => $request->user()->getKey(),
            'reviewed_at' => now(),
        ]);
        app(AuditLogger::class)->record('assessment.smartmark_reviewed', $assessment, [], [
            'batchId' => $batch->public_id,
            'sheetId' => $item->public_id,
            'approved' => $data['approved'],
        ]);

        return ApiResponse::success($this->presentSheet($item->fresh(), $batch, $matcher));
    }

    public function commit(string $batch, Request $request, SmartmarkMatchingService $matcher): JsonResponse
    {
        abort_unless(app(AssessmentAccess::class)->allows('assessment.smartmark.review'), 403);
        $item = SmartmarkBatch::query()->with('sheets')->where('public_id', $batch)->firstOrFail();
        abort_if(! $item->assessment_id, 422, 'Select an assessment before committing scores.');
        abort_if($item->sheets->contains(fn ($sheet) => $sheet->human_review_required || ! $sheet->student_id || ! $sheet->reviewed_at), 422, 'Review every flagged or unmatched sheet before committing.');
        DB::transaction(function () use ($item, $request) {
            $assessment = Assessment::query()->whereKey($item->assessment_id)->lockForUpdate()->firstOrFail();
            $this->authorize('updateScores', $assessment);
            $item->refresh()->load('sheets');
            abort_if($item->state === 'committed', 409, 'This batch has already been committed.');
            $roster = app(AssessmentWorkflow::class)->roster($assessment)->pluck('id');
            abort_if($item->sheets->isEmpty(), 422, 'No verified sheets to commit.');
            abort_if($item->sheets->pluck('student_id')->unique()->count() !== $item->sheets->count(), 422, 'Resolve duplicate student scripts.');
            foreach ($item->sheets as $sheet) {
                abort_unless($roster->contains($sheet->student_id) && $sheet->reviewed_at && ! $sheet->human_review_required, 422, 'Every script needs an eligible student and human verification.');
                abort_if($sheet->detected_score < 0 || $sheet->detected_score > $assessment->maximum_score, 422, 'Invalid detected score.');
                AssessmentScore::query()->updateOrCreate(
                    ['assessment_id' => $item->assessment_id, 'student_id' => $sheet->student_id],
                    [
                        'score' => $sheet->detected_score,
                        'status' => 'draft',
                        'graded_by' => $request->user()->getKey(),
                        'graded_at' => now(),
                        'metadata' => ['source' => 'smartmark', 'batchId' => $item->public_id, 'sheetId' => $sheet->public_id],
                    ],
                );
                $sheet->update(['committed_at' => now()]);
            }
            $item->update(['state' => 'committed']);
            $assessment->increment('revision');
            app(AuditLogger::class)->record('assessment.smartmark_committed', $assessment, [], ['batchId' => $item->public_id, 'sheets' => $item->sheets->count()]);
        });

        return ApiResponse::success($this->present($item->fresh(['sheets', 'assessment']), $matcher));
    }

    /** @return list<string> */
    private function answerKeyFromQuestions(Assessment $assessment): array
    {
        return AssessmentQuestion::query()
            ->where('assessment_id', $assessment->getKey())
            ->whereIn('question_type', ['multiple-choice', 'true-false'])
            ->orderBy('position')
            ->get()
            ->map(function (AssessmentQuestion $question) {
                $answer = (string) $question->correct_answer;
                if ($question->question_type === 'multiple-choice' && is_array($question->options)) {
                    $index = array_search($answer, $question->options, true);
                    if ($index !== false) {
                        return chr(65 + (int) $index);
                    }
                }

                return strtoupper(substr($answer, 0, 1));
            })
            ->filter()
            ->values()
            ->all();
    }

    private function present(SmartmarkBatch $batch, SmartmarkMatchingService $matcher): array
    {
        $assessment = $batch->relationLoaded('assessment') ? $batch->assessment : Assessment::query()->find($batch->assessment_id);
        $sheets = $batch->relationLoaded('sheets') ? $batch->sheets : collect();
        $presentedSheets = $sheets->map(fn (SmartmarkSheet $sheet) => $this->presentSheet($sheet, $batch, $matcher, $assessment))->values()->all();
        $stats = [
            'processed' => count($presentedSheets),
            'verified' => count(array_filter($presentedSheets, fn ($sheet) => $sheet['reviewedAt'] && ! $sheet['flagged'])),
            'needsReview' => count(array_filter($presentedSheets, fn ($sheet) => $sheet['flagged'] || ! $sheet['reviewedAt'])),
            'unmatched' => count(array_filter($presentedSheets, fn ($sheet) => $sheet['confidenceBand'] === SmartmarkConfidenceBand::Unmatched->value || ! $sheet['studentId'])),
            'failed' => $batch->state === 'failed' ? 1 : 0,
        ];

        return [
            'id' => $batch->public_id,
            'assessmentId' => $assessment?->public_id,
            'assessmentTitle' => $assessment?->title,
            'state' => $batch->state,
            'filename' => $batch->original_filename,
            'maxScore' => (int) $batch->max_score,
            'answerKey' => $batch->answer_key,
            'error' => $batch->error_message,
            'createdAt' => $batch->created_at?->toIso8601String(),
            'stats' => $stats,
            'roster' => $assessment ? $matcher->rosterOptions($assessment) : [],
            'sheets' => $presentedSheets,
        ];
    }

    private function presentSheet(SmartmarkSheet $sheet, SmartmarkBatch $batch, SmartmarkMatchingService $matcher, ?Assessment $assessment = null): array
    {
        $assessment ??= $batch->relationLoaded('assessment') ? $batch->assessment : Assessment::query()->find($batch->assessment_id);
        $matched = $sheet->student_id !== null;
        $band = app(SmartmarkScoringService::class)->band(
            (float) $sheet->confidence,
            collect($sheet->answers ?? [])->contains(fn ($answer) => in_array(strtoupper((string) $answer), ['', '?', '*'], true)),
            $matched,
        )->value;
        $studentPublicId = null;
        if ($sheet->student_id) {
            $studentPublicId = Student::query()->whereKey($sheet->student_id)->value('public_id');
        }

        return [
            'id' => $sheet->public_id,
            'studentId' => $studentPublicId,
            'studentName' => $sheet->student_name,
            'admissionNo' => $sheet->admission_number,
            'answers' => $sheet->answers,
            'detectedScore' => (float) $sheet->detected_score,
            'confidence' => (float) $sheet->confidence,
            'confidenceBand' => $band,
            'flagged' => (bool) $sheet->human_review_required,
            'flagReason' => $sheet->flag_reason,
            'reviewedAt' => $sheet->reviewed_at?->toIso8601String(),
            'committedAt' => $sheet->committed_at?->toIso8601String(),
        ];
    }
}
