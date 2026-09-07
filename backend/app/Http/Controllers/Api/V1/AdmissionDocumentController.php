<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admissions\AdmissionDocumentResource;
use App\Models\AdmissionApplication;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use App\Support\TenantStoragePath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdmissionDocumentController extends Controller
{
    public const ALLOWED_TYPES = [
        'birth_certificate', 'previous_school_report', 'transfer_certificate',
        'medical_record', 'guardian_id', 'passport_photo', 'other',
    ];

    public function index(string $application): JsonResponse
    {
        $record = $this->application($application);
        $this->authorize('manageDocuments', $record);

        return ApiResponse::success([
            'data' => AdmissionDocumentResource::collection($record->documents()->latest()->get())->resolve(),
        ]);
    }

    public function store(
        string $application,
        Request $request,
        TenantStoragePath $paths,
        AuditLogger $audit,
    ): JsonResponse {
        $record = $this->application($application);
        $this->authorize('manageDocuments', $record);
        $data = $request->validate([
            'documentType' => ['required', 'string', 'in:'.implode(',', self::ALLOWED_TYPES)],
            'file' => ['required', 'file', 'mimes:pdf,png,jpg,jpeg,webp', 'max:8192'],
        ]);
        $file = $request->file('file');
        $contents = file_get_contents($file->getRealPath());
        $filename = (string) Str::ulid().'.'.strtolower($file->guessExtension() ?: 'bin');
        $storageKey = $paths->private('admissions', $record->public_id, $filename);
        $disk = Storage::disk((string) config('skuggle.library.disk'));
        $stream = fopen($file->getRealPath(), 'rb');
        $disk->put($storageKey, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        try {
            $document = $record->documents()->create([
                'document_type' => $data['documentType'],
                'original_name' => mb_substr($file->getClientOriginalName(), 0, 255),
                'storage_key' => $storageKey,
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'file_size' => $file->getSize(),
                'sha256' => hash('sha256', $contents ?: ''),
                'scan_status' => 'pending',
                'uploaded_by' => $request->user()->getKey(),
            ]);
        } catch (\Throwable $exception) {
            $disk->delete($storageKey);
            throw $exception;
        }

        $audit->record('admissions.document.uploaded', $record, [], [
            'document_id' => $document->public_id,
            'document_type' => $document->document_type,
        ]);

        return ApiResponse::success((new AdmissionDocumentResource($document))->resolve(), [], 201);
    }

    public function download(string $application, string $document, AuditLogger $audit): StreamedResponse
    {
        $record = $this->application($application);
        $this->authorize('manageDocuments', $record);
        $item = $record->documents()->where('public_id', $document)->firstOrFail();
        $audit->record('admissions.document.downloaded', $record, [], ['document_id' => $item->public_id]);

        return Storage::disk((string) config('skuggle.library.disk'))->download(
            $item->storage_key,
            $item->original_name,
            ['Content-Type' => $item->mime_type, 'X-Content-Type-Options' => 'nosniff'],
        );
    }

    public function destroy(string $application, string $document, AuditLogger $audit): JsonResponse
    {
        $record = $this->application($application);
        $this->authorize('manageDocuments', $record);
        $item = $record->documents()->where('public_id', $document)->firstOrFail();
        Storage::disk((string) config('skuggle.library.disk'))->delete($item->storage_key);
        $item->delete();
        $audit->record('admissions.document.deleted', $record, [], ['document_id' => $item->public_id]);

        return ApiResponse::success(['deleted' => true]);
    }

    private function application(string $publicId): AdmissionApplication
    {
        return AdmissionApplication::query()->where('public_id', $publicId)->firstOrFail();
    }
}
