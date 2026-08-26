<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateReportJob;
use App\Models\AcademicSession;
use App\Models\ReportJob;
use App\Models\SchoolClass;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', ReportJob::class);
        $classOptions = SchoolClass::query()->where('status', 'active')->orderBy('name')->get()->map(fn ($item) => ['value' => $item->public_id, 'label' => trim($item->name.' '.$item->arm)]);
        $sessionOptions = AcademicSession::query()->orderByDesc('starts_at')->get()->map(fn ($item) => ['value' => $item->public_id, 'label' => $item->name]);

        return ApiResponse::success([
            ['id' => 'student-directory', 'title' => 'Student directory', 'description' => 'Current student roster with class and status.', 'group' => 'student', 'formats' => ['pdf', 'xlsx'], 'filters' => [['key' => 'classId', 'label' => 'Class', 'options' => $classOptions]]],
            ['id' => 'attendance-summary', 'title' => 'Attendance summary', 'description' => 'Attendance totals for an academic period.', 'group' => 'academic', 'formats' => ['pdf', 'xlsx'], 'filters' => [['key' => 'sessionId', 'label' => 'Session', 'options' => $sessionOptions]]],
            ['id' => 'assessment-performance', 'title' => 'Assessment performance', 'description' => 'Assessment scores and learning-gap indicators.', 'group' => 'academic', 'formats' => ['pdf', 'xlsx'], 'filters' => [['key' => 'classId', 'label' => 'Class', 'options' => $classOptions]]],
        ]);
    }

    public function store(Request $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', ReportJob::class);
        $data = $request->validate(['reportId' => ['required', Rule::in(['student-directory', 'attendance-summary', 'assessment-performance'])], 'format' => ['required', Rule::in(['pdf', 'xlsx'])], 'filters' => ['nullable', 'array']]);
        $job = ReportJob::query()->create(['requested_by' => $request->user()->getKey(), 'report_key' => $data['reportId'], 'parameters' => $data['filters'] ?? [], 'format' => $data['format'], 'state' => 'queued', 'progress_percent' => 0, 'message' => 'Queued for generation']);
        GenerateReportJob::dispatch($job->getKey());
        $audit->record('report.requested', $job, [], ['report' => $job->report_key, 'format' => $job->format]);

        return ApiResponse::success($this->present($job), [], 202);
    }

    public function show(string $job): JsonResponse
    {
        $record = ReportJob::query()->where('public_id', $job)->firstOrFail();
        $this->authorize('view', $record);

        return ApiResponse::success($this->present($record));
    }

    public function download(string $job, Request $request): StreamedResponse
    {
        $item = ReportJob::query()->where('public_id', $job)->where('state', 'complete')->where('expires_at', '>', now())->firstOrFail();
        abort_unless($item->requested_by === $request->user()->getKey() || in_array('reports.export', request()->attributes->get('membership')->permissionNames(), true), 403);

        return Storage::disk((string) config('skuggle.library.disk'))->download($item->storage_key, $item->filename);
    }

    private function present(ReportJob $job): array
    {
        return ['id' => $job->public_id, 'status' => $job->state, 'progress' => $job->progress_percent, 'message' => $job->message, 'downloadUrl' => $job->state === 'complete' ? "/api/v1/reports/jobs/{$job->public_id}/download" : null];
    }
}
