<?php

namespace App\Http\Resources\Admissions;

use App\Models\AdmissionApplication;
use App\Models\AdmissionWorkflowHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/** @mixin AdmissionApplication */
class AdmissionApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->public_id,
            'reference' => $this->reference,
            'status' => $this->statusType()->value,
            'fullName' => $this->full_name,
            'firstName' => $this->first_name,
            'middleName' => $this->middle_name,
            'lastName' => $this->last_name,
            'gender' => $this->gender,
            'dateOfBirth' => $this->birthDate()?->toDateString(),
            'nationality' => $this->nationality,
            'guardianName' => $this->guardian_name,
            'guardianPhone' => $this->guardian_phone,
            'guardianEmail' => $this->guardian_email,
            'notes' => $this->notes,
            'customFields' => $this->custom_fields ?? [],
            'cycle' => $this->whenLoaded('cycle', fn () => $this->cycle ? [
                'id' => $this->cycle->public_id,
                'name' => $this->cycle->name,
            ] : null),
            'requestedClass' => $this->whenLoaded('requestedClass', fn () => $this->requestedClass ? [
                'id' => $this->requestedClass->public_id,
                'name' => trim($this->requestedClass->name.' '.$this->requestedClass->arm),
            ] : null),
            'screenings' => $this->whenLoaded('screenings', fn () => $this->screenings->map(fn ($screening) => [
                'id' => $screening->public_id,
                'status' => $screening->statusType()->value,
                'score' => $screening->score !== null ? (float) $screening->score : null,
                'scheduledAt' => $screening->scheduledAt()?->toIso8601String(),
                'completedAt' => $screening->completedAt()?->toIso8601String(),
                'notes' => $screening->notes,
            ])->all()),
            'decision' => $this->whenLoaded('decision', fn () => $this->decision ? [
                'id' => $this->decision->public_id,
                'decision' => $this->decision->decisionType()->value,
                'offerReference' => $this->decision->offer_reference,
                'expiresAt' => $this->decision->expiresAt()?->toDateString(),
                'notes' => $this->decision->notes,
            ] : null),
            'documentCount' => $this->whenCounted('documents'),
            'history' => $this->whenLoaded('history', fn () => $this->history
                ->sortByDesc('changed_at')
                ->map(fn (AdmissionWorkflowHistory $item) => [
                    'id' => $item->public_id,
                    'fromStatus' => $item->fromStatus()?->value,
                    'toStatus' => $item->toStatus()->value,
                    'reason' => $item->reason,
                    'changedAt' => $item->changedAt()->toIso8601String(),
                ])->values()->all()),
            'convertedStudentId' => $this->whenLoaded('conversion', fn () => $this->conversion?->student?->public_id),
            'submittedAt' => $this->submittedAt()?->toIso8601String(),
            'createdAt' => $this->created_at ? Carbon::parse($this->created_at)->toIso8601String() : null,
            'updatedAt' => $this->updated_at ? Carbon::parse($this->updated_at)->toIso8601String() : null,
        ];
    }
}
