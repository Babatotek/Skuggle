<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Services\AuditLogger;
use App\Services\UploadSecurityScanner;
use App\Support\ApiResponse;
use App\Support\TenantStoragePath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeDocumentController extends Controller
{
    public function index(string $employee): JsonResponse
    {
        $record = Employee::query()->where('public_id', $employee)->firstOrFail();

        return ApiResponse::success(['data' => EmployeeDocument::query()->where('employee_id', $record->getKey())->latest()->get()]);
    }

    public function store(string $employee, Request $request, AuditLogger $audit, TenantStoragePath $paths, UploadSecurityScanner $scanner): JsonResponse
    {
        $record = Employee::query()->where('public_id', $employee)->firstOrFail();
        $data = $request->validate(['documentType' => ['required', 'in:photo,identity,qualification,employment,other'], 'file' => ['required', 'file', 'mimes:pdf,png,jpg,jpeg,webp', 'max:8192']]);
        $file = $request->file('file');
        $scanner->scan($file);
        $key = $paths->private('workforce', $record->public_id, Str::ulid().'.'.$file->guessExtension());
        abort_unless(Storage::disk('local')->put($key, file_get_contents($file->getRealPath())), 503, 'Document storage is unavailable.');
        try {
            $document = EmployeeDocument::query()->create(['employee_id' => $record->getKey(), 'document_type' => $data['documentType'], 'original_name' => $file->getClientOriginalName(), 'storage_key' => $key, 'mime_type' => $file->getMimeType(), 'file_size' => $file->getSize()]);
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($key);
            throw $error;
        }
        $audit->record('workforce.document.uploaded', $record, [], ['document_id' => $document->public_id]);

        return ApiResponse::success($document, [], 201);
    }

    public function download(string $employee, string $document, AuditLogger $audit): StreamedResponse
    {
        $record = Employee::query()->where('public_id', $employee)->firstOrFail();
        $item = EmployeeDocument::query()->where('employee_id', $record->getKey())->where('public_id', $document)->firstOrFail();
        $audit->record('workforce.document.downloaded', $record, [], ['document_id' => $item->public_id]);

        return Storage::disk('local')->download($item->storage_key, $item->original_name, ['X-Content-Type-Options' => 'nosniff']);
    }
}
