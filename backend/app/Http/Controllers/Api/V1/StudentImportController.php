<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\StudentImportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentImportController extends Controller
{
    public function __construct(private readonly StudentImportService $imports) {}

    public function template(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            echo $this->imports->templateCsv();
        }, 'skuggle-student-import-template.csv', [
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

    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rows' => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.first_name' => ['required', 'string', 'max:100'],
            'rows.*.last_name' => ['required', 'string', 'max:100'],
            'rows.*.gender' => ['required', 'string', 'max:32'],
            'rows.*.date_of_birth' => ['required', 'date'],
            'rows.*.admission_date' => ['required', 'date'],
            'rows.*.class_name' => ['required', 'string', 'max:120'],
            'rows.*.guardian_name' => ['required', 'string', 'max:180'],
            'rows.*.guardian_phone' => ['required', 'string', 'max:32'],
            'rows.*.guardian_email' => ['nullable', 'email', 'max:254'],
        ]);

        $result = $this->imports->importRows($data['rows']);

        return ApiResponse::success([
            'imported' => $result['imported'],
            'errors' => $result['errors'],
        ], [], $result['imported'] > 0 ? 201 : 422);
    }
}
