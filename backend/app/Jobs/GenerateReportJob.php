<?php

namespace App\Jobs;

use App\Domain\Tenancy\TenantContext;
use App\Models\ReportJob;
use App\Models\Student;
use App\Models\Tenant;
use App\Models\TenantMembership;
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

    public function __construct(public readonly int $reportJobId)
    {
        $this->onQueue('reports');
    }

    public function middleware(): array
    {
        return [(new WithoutOverlapping("report:{$this->reportJobId}"))->expireAfter(240)];
    }

    public function handle(TenantContext $context, SimplePdf $pdf, SimpleXlsx $xlsx): void
    {
        $job = ReportJob::query()->withoutGlobalScopes()->findOrFail($this->reportJobId);
        $tenant = Tenant::query()->findOrFail($job->tenant_id);
        $membership = TenantMembership::query()->with(['tenant', 'role.permissions'])->where('tenant_id', $tenant->getKey())->where('user_id', $job->requested_by)->firstOrFail();
        $context->set($tenant, $membership);
        try {
            $job->update(['state' => 'processing', 'progress_percent' => 10, 'message' => 'Preparing report data']);
            $students = Student::query()->with('enrollments.schoolClass')->orderBy('last_name')->orderBy('first_name')->get();
            $rows = [['Admission number', 'Student', 'Class', 'Status']];
            foreach ($students as $student) {
                $rows[] = [$student->admission_number, trim("{$student->first_name} {$student->middle_name} {$student->last_name}"), $student->enrollments->first()?->schoolClass?->name ?? '', $student->status];
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
