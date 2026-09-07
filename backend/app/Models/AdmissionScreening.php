<?php

namespace App\Models;

use App\Domain\Admissions\ScreeningStatus;
use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class AdmissionScreening extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'legacy_source_id'];

    protected function casts(): array
    {
        return [
            'status' => ScreeningStatus::class,
            'score' => 'decimal:2',
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function statusType(): ScreeningStatus
    {
        $status = $this->getAttribute('status');

        return $status instanceof ScreeningStatus ? $status : ScreeningStatus::from((string) $status);
    }

    public function scheduledAt(): ?Carbon
    {
        $value = $this->getAttribute('scheduled_at');

        return $value ? Carbon::parse($value) : null;
    }

    public function completedAt(): ?Carbon
    {
        $value = $this->getAttribute('completed_at');

        return $value ? Carbon::parse($value) : null;
    }

    /** @return BelongsTo<AdmissionApplication, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(AdmissionApplication::class, 'admission_application_id');
    }
}
