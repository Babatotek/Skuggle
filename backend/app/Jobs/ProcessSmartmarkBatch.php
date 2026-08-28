<?php

namespace App\Jobs;

use App\Domain\Tenancy\TenantContext;
use App\Models\SmartmarkBatch;
use App\Models\SmartmarkSheet;
use App\Models\Student;
use App\Models\Tenant;
use App\Services\SmartmarkOcrService;
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

    public function __construct(public int $batchId, public int $tenantId)
    {
        $this->onQueue('ocr');
    }

    public function handle(SmartmarkOcrService $ocr, TenantContext $context): void
    {
        $tenant = Tenant::query()->findOrFail($this->tenantId);
        $context->setPublicTenant($tenant);
        try {
            $batch = SmartmarkBatch::query()->findOrFail($this->batchId);
            $batch->update(['state' => 'processing', 'error_message' => null]);
            $disk = (string) config('skuggle.library.disk');
            $bytes = Storage::disk($disk)->get($batch->storage_key);
            $rows = $ocr->extract($bytes, $batch->mime_type, $batch->answer_key, (int) $batch->max_score);
            foreach ($rows as $row) {
                $student = isset($row['admission_number']) ? Student::query()->where('admission_number', $row['admission_number'])->first() : null;
                SmartmarkSheet::query()->create([...$row, 'batch_id' => $batch->getKey(), 'student_id' => $student?->getKey()]);
            }$batch->update(['state' => 'review']);
        } catch (\Throwable $e) {
            SmartmarkBatch::query()->whereKey($this->batchId)->update(['state' => 'failed', 'error_message' => mb_substr($e->getMessage(), 0, 1000)]);
            throw $e;
        } finally {
            $context->clear();
        }
    }
}
