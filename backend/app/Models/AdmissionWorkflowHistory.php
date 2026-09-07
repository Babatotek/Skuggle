<?php

namespace App\Models;

use App\Domain\Admissions\ApplicationStatus;
use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class AdmissionWorkflowHistory extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $table = 'admission_workflow_history';

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    protected function casts(): array
    {
        return [
            'from_status' => ApplicationStatus::class,
            'to_status' => ApplicationStatus::class,
            'metadata' => 'array',
            'changed_at' => 'datetime',
        ];
    }

    public function fromStatus(): ?ApplicationStatus
    {
        $status = $this->getAttribute('from_status');

        return $status instanceof ApplicationStatus
            ? $status
            : ($status ? ApplicationStatus::from((string) $status) : null);
    }

    public function toStatus(): ApplicationStatus
    {
        $status = $this->getAttribute('to_status');

        return $status instanceof ApplicationStatus ? $status : ApplicationStatus::from((string) $status);
    }

    public function changedAt(): Carbon
    {
        return Carbon::parse($this->getAttribute('changed_at'));
    }

    /** @return BelongsTo<AdmissionApplication, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(AdmissionApplication::class, 'admission_application_id');
    }
}
