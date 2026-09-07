<?php

namespace App\Http\Resources\Admissions;

use App\Models\AdmissionDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AdmissionDocument */
class AdmissionDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->public_id,
            'documentType' => $this->document_type,
            'originalName' => $this->original_name,
            'mimeType' => $this->mime_type,
            'fileSize' => $this->file_size,
            'scanStatus' => $this->scan_status,
            'uploadedAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
