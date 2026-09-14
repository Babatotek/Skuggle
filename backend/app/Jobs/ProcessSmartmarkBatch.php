<?php

namespace App\Jobs;

use App\Domain\Assessments\SmartmarkConfidenceBand;
use App\Domain\Tenancy\TenantContext;
use App\Domain\Tenancy\TenantJobEnvelope;
use App\Models\Assessment;
use App\Models\SmartmarkBatch;
use App\Models\SmartmarkSheet;
use App\Services\AssessmentCompleteService;
use App\Services\AssessmentNotifier;
use App\Services\AssessmentSettings;
use App\Services\AssessmentWorkflow;
use App\Services\SmartmarkMatchingService;
use App\Services\SmartmarkOcrService;
use App\Services\SmartmarkScoringService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

final class ProcessSmartmarkBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 180;

    /** @param array<string, int|string|null> $tenantEnvelope */
    public function __construct(public int $batchId, public array $tenantEnvelope)
    {
        $this->onQueue('ocr');
    }

    public function handle(SmartmarkOcrService $ocr, SmartmarkMatchingService $matcher, SmartmarkScoringService $scoring, TenantContext $context): void
    {
        $previous = $context->hasTenant() ? TenantJobEnvelope::fromContext($context) : null;
        try {
            TenantJobEnvelope::fromArray($this->tenantEnvelope)->activate($context);
            $batch = SmartmarkBatch::query()->findOrFail($this->batchId);
            $batch->update(['state' => 'processing', 'error_message' => null]);
            $disk = (string) config('skuggle.library.disk');
            $bytes = (string) (Storage::disk($disk)->get($batch->storage_key) ?? '');
            $answerKey = array_values((array) ($batch->answer_key ?: []));
            $maxScore = max(1, (int) $batch->max_score);
            $layout = null;
            if ($batch->assessment_id) {
                $bound = Assessment::query()->find($batch->assessment_id);
                if ($bound) {
                    $layout = app(AssessmentWorkflow::class)->omrLayout($bound, true);
                    if ($answerKey === [] && is_array($layout['answerKey'] ?? null)) {
                        $answerKey = array_values($layout['answerKey']);
                    }
                }
            }
            $rows = $ocr->extract($bytes, $batch->mime_type, $answerKey !== [] ? $answerKey : ['A'], $maxScore, $layout);
            if (! $batch->assessment_id) {
                foreach ($rows as $row) {
                    $haystack = implode(' ', array_filter([(string) ($row['admission_number'] ?? ''), (string) ($row['scanCode'] ?? ''), (string) ($row['student_name'] ?? '')]));
                    if (preg_match('/SM\|([0-9A-HJKMNP-TV-Z]{26})\|/i', $haystack, $matchCode)) {
                        $found = Assessment::query()->where('public_id', $matchCode[1])->first();
                        if ($found) {
                            $batch->update(['assessment_id' => $found->getKey()]);
                            $layout = app(AssessmentWorkflow::class)->omrLayout($found, true);
                            if ($answerKey === [] && is_array($layout['answerKey'] ?? null)) {
                                $answerKey = array_values($layout['answerKey']);
                                $batch->update(['answer_key' => $answerKey, 'max_score' => (int) $found->maximum_score]);
                            }
                            // Re-run geometric extract now that layout is known.
                            if (str_starts_with(strtolower((string) config('skuggle.ocr.provider')), 'geometric')) {
                                $rows = $ocr->extract($bytes, $batch->mime_type, $answerKey !== [] ? $answerKey : ['A'], max(1, (int) $batch->max_score), $layout);
                            }
                            break;
                        }
                    }
                }
            }
            $assessment = Assessment::query()->findOrFail($batch->assessment_id);
            if ($answerKey === []) {
                $answerKey = $this->answerKeyFromQuestions($assessment);
                $batch->update(['answer_key' => $answerKey, 'max_score' => (int) $assessment->maximum_score]);
            }
            if ($layout === null) {
                $layout = app(AssessmentWorkflow::class)->omrLayout($assessment, true);
            }
            foreach (array_chunk($rows, 8) as $chunk) {
                foreach ($chunk as $row) {
                    $match = $matcher->match($assessment, $row['admission_number'] ?? null, $row['student_name'] ?? null);
                    $evaluation = $scoring->evaluate(
                        $row['answers'],
                        $batch->fresh()->answer_key,
                        (int) $batch->max_score,
                        $row['confidence'],
                        $row['flag_reason'] ?? null,
                        $match['student'] !== null,
                    );
                    $exactMatch = $match['student'] !== null && $match['flag_reason'] === null;
                    $autoPropose = $evaluation['band'] === SmartmarkConfidenceBand::High && $exactMatch && (bool) (AssessmentSettings::forTenant()['smartmarkDefaults']['autoProposeHigh'] ?? true);
                    $flagReason = $autoPropose ? null : (trim(implode(' ', array_filter([
                        $evaluation['flag_reason'],
                        $match['flag_reason'],
                    ]))) ?: null);
                    $sheet = SmartmarkSheet::query()->create([
                        'batch_id' => $batch->getKey(),
                        'student_id' => $match['student']?->getKey(),
                        'admission_number' => $row['admission_number'] ?? $match['student']?->admission_number,
                        'student_name' => $row['student_name'] ?? ($match['student'] ? trim(($match['student']->first_name ?? '').' '.($match['student']->last_name ?? '')) : null),
                        'answers' => $row['answers'],
                        'detected_score' => $evaluation['detected_score'],
                        'confidence' => $evaluation['confidence'],
                        'human_review_required' => ! $autoPropose,
                        'flag_reason' => $flagReason,
                        'reviewed_at' => $autoPropose ? now() : null,
                        'reviewed_by' => null,
                        'page_number' => $row['page'] ?? null,
                    ]);
                    app(AssessmentCompleteService::class)->writeDetections($sheet, $row['answers'], (array) $batch->fresh()->answer_key, (float) $evaluation['confidence']);
                }
            }
            $batch->update(['state' => 'review']);
            if ($batch->sheets()->where('human_review_required', true)->exists()) {
                app(AssessmentNotifier::class)->smartmarkExceptions($batch);
            }
        } catch (\Throwable $e) {
            SmartmarkBatch::query()->whereKey($this->batchId)->update(['state' => 'failed', 'error_message' => mb_substr($e->getMessage(), 0, 1000)]);
            throw $e;
        } finally {
            $context->clear();
            if ($previous !== null) {
                $previous->activate($context);
            }
        }
    }

    /** @return list<string> */
    private function answerKeyFromQuestions(Assessment $assessment): array
    {
        return $assessment->questions()->orderBy('position')->get()
            ->filter(fn ($q) => in_array($q->question_type, ['multiple-choice', 'true-false'], true))
            ->map(function ($question) {
                $answer = (string) $question->correct_answer;
                if ($question->question_type === 'multiple-choice' && is_array($question->options)) {
                    $index = array_search($answer, $question->options, true);
                    if ($index !== false) {
                        return chr(65 + (int) $index);
                    }
                }

                return strtoupper(substr($answer, 0, 1));
            })->filter()->values()->all();
    }
}
