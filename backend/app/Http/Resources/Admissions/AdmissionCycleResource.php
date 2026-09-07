<?php

namespace App\Http\Resources\Admissions;

use App\Models\AdmissionCycle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AdmissionCycle */
class AdmissionCycleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->public_id,
            'name' => $this->name,
            'status' => $this->statusType()->value,
            'opensAt' => $this->opensAt()?->toDateString(),
            'closesAt' => $this->closesAt()?->toDateString(),
            'currency' => $this->currency,
            'applicationFeeMinor' => $this->application_fee_minor,
            'settings' => $this->settings ?? [],
        ];
    }
}
