<?php

namespace App\Jobs;

use App\Domain\Tenancy\TenantContext;
use App\Domain\Tenancy\TenantJobEnvelope;
use App\Models\Assessment;
use App\Models\ReportJob;
use App\Models\Student;
use App\Services\AssessmentWorkflow;
use App\Services\SimplePdf;
use App\Services\SimpleXlsx;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 180;

    public array $backoff = [10, 60, 180];

    /** @param array<string, int|string|null> $tenantEnvelope */
    public function __construct(public readonly int $reportJobId, public readonly array $tenantEnvelope)
    {
        $this->onQueue('reports');
    }

    public function middleware(): array
    {
        return [(new WithoutOverlapping("report:{$this->reportJobId}"))->expireAfter(240)];
    }

    public function handle(TenantContext $context, SimplePdf $pdf, SimpleXlsx $xlsx): void
    {
        try {
            TenantJobEnvelope::fromArray($this->tenantEnvelope)->activate($context);
            $job = ReportJob::query()->withoutGlobalScopes()->where('tenant_id', $context->tenantId())->findOrFail($this->reportJobId);
            $tenant = $context->tenant();
            $job->update(['state' => 'processing', 'progress_percent' => 10, 'message' => 'Preparing report data']);
            if ($job->report_key === 'assessment-performance') {
                $assessmentId = $job->filters['assessmentId'] ?? null;
                $assessment = $assessmentId
                    ? Assessment::query()->where('public_id', $assessmentId)->with(['scores', 'schoolClass', 'subject'])->first()
                    : null;
                $rows = [['Admission number', 'Student', 'Class', 'Subject', 'Assessment', 'Score', 'Status']];
                if ($assessment) {
                    $roster = app(AssessmentWorkflow::class)->roster($assessment);
                    $scores = $assessment->scores->keyBy('student_id');
                    foreach ($roster as $student) {
                        $score = $scores->get($student->getKey());
                        $rows[] = [
                            $student->admission_number,
                            trim($student->first_name.' '.$student->last_name),
                            trim(($assessment->schoolClass?->name ?? '').' '.($assessment->schoolClass?->arm ?? '')),
                            $assessment->subject?->name,
                            $assessment->title,
                            $score?->score,
                            $score?->status ?? 'MISSING',
                        ];
                    }
                }
            } else {
                $students = Student::query()->with('enrollments.schoolClass')->orderBy('last_name')->orderBy('first_name')->get();
                $rows = [['Admission number', 'Student', 'Class', 'Status']];
                foreach ($students as $student) {
                    $rows[] = [$student->admission_number, trim("{$student->first_name} {$student->middle_name} {$student->last_name}"), $student->enrollments->first()?->schoolClass?->name ?? '', $student->status];
                }
            }
            $job->update(['progress_percent' => 60, 'message' => 'Rendering report']);
            if ($job->format === 'xlsx') {
                $content = $xlsx->make($rows);
                $extension = 'xlsx';
            } else {
                $content = $pdf->make(array_chunk(array_map(fn ($row) => implode('  |  ', $row), $rows), 45));
                $extension = 'pdf';
            }
            $filename = str($job->report_key)->slug().'-'.now()->format('Ymd-His').'.'.$extension;
            $key = "tenants/{$tenant->public_id}/reports/{$job->public_id}/{$filename}";
            Storage::disk((string) config('skuggle.library.disk'))->put($key, $content, ['visibility' => 'private']);
            $job->update(['state' => 'complete', 'progress_percent' => 100, 'message' => 'Report ready', 'storage_key' => $key, 'filename' => $filename, 'expires_at' => now()->addHours(24)]);
        } finally {
            $context->clear();
        }
    }

    public function failed(\Throwable $exception): void
    {
        ReportJob::query()->withoutGlobalScopes()->whereKey($this->reportJobId)->update(['state' => 'failed', 'message' => 'The report could not be generated. Retry from the reports page.']);
    }
}
