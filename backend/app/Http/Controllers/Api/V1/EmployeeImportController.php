<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\EmployeeImportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeImportController extends Controller
{
    public function __construct(private readonly EmployeeImportService $imports) {}

    public function template(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            echo $this->imports->templateCsv();
        }, 'skuggle-workforce-import-template.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function validateUpload(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:4096']]);
        $result = $this->imports->parseAndValidate($request->file('file'));

        return ApiResponse::success([
            'validCount' => count($result['validRows']),
            'errorCount' => count($result['errors']),
            'preview' => array_slice($result['validRows'], 0, 5),
            'errors' => $result['errors'],
            'rows' => $result['validRows'],
        ]);
    }

    public function confirm(Request $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'rows' => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.employee_number' => ['required', 'string', 'max:64'],
            'rows.*.name' => ['required', 'string', 'max:180'],
            'rows.*.employment_type' => ['required', 'string', 'max:48'],
            'rows.*.status' => ['nullable', 'string', 'max:32'],
            'rows.*.staff_category' => ['nullable', 'string', 'max:32'],
            'rows.*.position_name' => ['nullable', 'string', 'max:120'],
            'rows.*.department_name' => ['nullable', 'string', 'max:120'],
            'rows.*.campus_name' => ['nullable', 'string', 'max:120'],
            'rows.*.email' => ['nullable', 'email', 'max:254'],
            'rows.*.phone' => ['nullable', 'string', 'max:40'],
            'rows.*.started_at' => ['nullable', 'date'],
        ]);

        $result = $this->imports->importRows($data['rows']);
        $audit->record('workforce.imported', null, [], [
            'imported' => $result['imported'],
            'error_count' => count($result['errors']),
        ]);

        return ApiResponse::success([
            'imported' => $result['imported'],
            'errors' => $result['errors'],
        ], [], $result['imported'] > 0 ? 201 : 422);
    }
}
