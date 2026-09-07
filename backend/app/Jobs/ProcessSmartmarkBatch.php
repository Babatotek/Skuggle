<?php

namespace App\Jobs;

use App\Domain\Assessments\SmartmarkConfidenceBand;
use App\Domain\Tenancy\TenantContext;
use App\Domain\Tenancy\TenantJobEnvelope;
use App\Models\Assessment;
use App\Models\SmartmarkBatch;
use App\Models\SmartmarkSheet;
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
            $assessment = Assessment::query()->findOrFail($batch->assessment_id);
            $disk = (string) config('skuggle.library.disk');
            $bytes = Storage::disk($disk)->get($batch->storage_key);
            $rows = $ocr->extract($bytes, $batch->mime_type, $batch->answer_key, (int) $batch->max_score);
            foreach ($rows as $row) {
                $match = $matcher->match($assessment, $row['admission_number'] ?? null, $row['student_name'] ?? null);
                $evaluation = $scoring->evaluate(
                    (array) ($row['answers'] ?? []),
                    $batch->answer_key,
                    (int) $batch->max_score,
                    (float) ($row['confidence'] ?? 0),
                    $row['flag_reason'] ?? null,
                    $match['student'] !== null,
                );
                $exactMatch = $match['student'] !== null && $match['flag_reason'] === null;
                $autoPropose = $evaluation['band'] === SmartmarkConfidenceBand::High && $exactMatch;
                $flagReason = $autoPropose ? null : (trim(implode(' ', array_filter([
                    $evaluation['flag_reason'],
                    $match['flag_reason'],
                ]))) ?: null);
                SmartmarkSheet::query()->create([
                    'batch_id' => $batch->getKey(),
                    'student_id' => $match['student']?->getKey(),
                    'admission_number' => $row['admission_number'] ?? $match['student']?->admission_number,
                    'student_name' => $row['student_name'] ?? ($match['student'] ? trim(($match['student']->first_name ?? '').' '.($match['student']->last_name ?? '')) : null),
                    'answers' => $row['answers'] ?? [],
                    'detected_score' => $evaluation['detected_score'],
                    'confidence' => $evaluation['confidence'],
                    'human_review_required' => ! $autoPropose,
                    'flag_reason' => $flagReason,
                    'reviewed_at' => $autoPropose ? now() : null,
                    'reviewed_by' => null,
                ]);
            }
            $batch->update(['state' => 'review']);
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
}
