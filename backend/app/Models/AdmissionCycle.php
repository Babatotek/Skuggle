<?php

namespace App\Models;

use App\Domain\Admissions\CycleStatus;
use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class AdmissionCycle extends Model
{
    use BelongsToTenant, HasPublicId, SoftDeletes;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    protected function casts(): array
    {
        return [
            'status' => CycleStatus::class,
            'opens_at' => 'date',
            'closes_at' => 'date',
            'application_fee_minor' => 'integer',
            'settings' => 'array',
        ];
    }

    public function statusType(): CycleStatus
    {
        $status = $this->getAttribute('status');

        return $status instanceof CycleStatus ? $status : CycleStatus::from((string) $status);
    }

    public function opensAt(): ?Carbon
    {
        $value = $this->getAttribute('opens_at');

        return $value ? Carbon::parse($value) : null;
    }

    public function closesAt(): ?Carbon
    {
        $value = $this->getAttribute('closes_at');

        return $value ? Carbon::parse($value) : null;
    }

    /** @return HasMany<AdmissionApplication, $this> */
    public function applications(): HasMany
    {
        return $this->hasMany(AdmissionApplication::class);
    }
}
