<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentDocumentController extends Controller
{
    public const ALLOWED_TYPES = [
        'birth_certificate', 'previous_school_report', 'transfer_certificate',
        'admission_letter', 'medical_record', 'immunization_record',
        'guardian_id', 'passport_photo', 'other',
    ];

    public const ALLOWED_MIMES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

    public function index(string $student): JsonResponse
    {
        $record = Student::query()->where('public_id', $student)->firstOrFail();
        $this->authorize('view', $record);

        $documents = $record->documents()->latest()->get()->map(fn (StudentDocument $doc) => $this->present($doc));

        return ApiResponse::success(['data' => $documents]);
    }

    public function store(string $student, Request $request, AuditLogger $audit): JsonResponse
    {
        $record = Student::query()->where('public_id', $student)->firstOrFail();
        $this->authorize('update', $record);

        $data = $request->validate([
            'documentType' => ['required', 'string', 'in:'.implode(',', self::ALLOWED_TYPES)],
            'file' => ['required', 'file', 'mimes:pdf,png,jpg,jpeg,webp', 'max:8192'],
        ]);

        $file = $request->file('file');
        $contents = file_get_contents($file->getRealPath());
        $storageKey = $file->store("students/{$record->public_id}/documents", (string) config('skuggle.library.disk'));

        $document = $record->documents()->create([
            'document_type' => $data['documentType'],
            'original_name' => $file->getClientOriginalName(),
            'storage_key' => $storageKey,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'file_size' => $file->getSize(),
            'sha256' => hash('sha256', $contents ?: ''),
            'scan_status' => 'pending',
            'verification_status' => 'pending',
            'uploaded_by' => $request->user()->getKey(),
        ]);

        $audit->record('student.document_uploaded', $record, [], [
            'document_type' => $document->document_type,
            'document_id' => $document->public_id,
        ]);

        return ApiResponse::success($this->present($document), [], 201);
    }

    public function destroy(string $student, string $document, AuditLogger $audit): JsonResponse
    {
        $record = Student::query()->where('public_id', $student)->firstOrFail();
        $this->authorize('update', $record);

        $doc = $record->documents()->where('public_id', $document)->firstOrFail();
        Storage::disk((string) config('skuggle.library.disk'))->delete($doc->storage_key);
        $doc->delete();

        $audit->record('student.document_deleted', $record, [], ['document_id' => $document]);

        return ApiResponse::success(['deleted' => true]);
    }

    /** @return array<string, mixed> */
    private function present(StudentDocument $doc): array
    {
        return [
            'id' => $doc->public_id,
            'documentType' => $doc->document_type,
            'originalName' => $doc->original_name,
            'mimeType' => $doc->mime_type,
            'fileSize' => $doc->file_size,
            'verificationStatus' => $doc->verification_status,
            'uploadedAt' => $doc->created_at?->toIso8601String(),
        ];
    }
}
