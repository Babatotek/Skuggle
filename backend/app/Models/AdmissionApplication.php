<?php

namespace App\Models;

use App\Domain\Admissions\ApplicationStatus;
use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class AdmissionApplication extends Model
{
    use BelongsToTenant, HasPublicId, SoftDeletes;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'legacy_source_id'];

    protected function casts(): array
    {
        return [
            'status' => ApplicationStatus::class,
            'date_of_birth' => 'date',
            'custom_fields' => 'array',
            'submitted_at' => 'datetime',
            'status_changed_at' => 'datetime',
        ];
    }

    public function statusType(): ApplicationStatus
    {
        $status = $this->getAttribute('status');

        return $status instanceof ApplicationStatus ? $status : ApplicationStatus::from((string) $status);
    }

    public function birthDate(): ?Carbon
    {
        $value = $this->getAttribute('date_of_birth');

        return $value ? Carbon::parse($value) : null;
    }

    public function submittedAt(): ?Carbon
    {
        $value = $this->getAttribute('submitted_at');

        return $value ? Carbon::parse($value) : null;
    }

    /** @return BelongsTo<AdmissionCycle, $this> */
    public function cycle(): BelongsTo
    {
        return $this->belongsTo(AdmissionCycle::class, 'admission_cycle_id');
    }

    /** @return BelongsTo<SchoolClass, $this> */
    public function requestedClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'requested_class_id');
    }

    /** @return HasMany<AdmissionScreening, $this> */
    public function screenings(): HasMany
    {
        return $this->hasMany(AdmissionScreening::class);
    }

    /** @return HasOne<AdmissionDecision, $this> */
    public function decision(): HasOne
    {
        return $this->hasOne(AdmissionDecision::class);
    }

    /** @return HasMany<AdmissionDocument, $this> */
    public function documents(): HasMany
    {
        return $this->hasMany(AdmissionDocument::class);
    }

    /** @return HasMany<AdmissionOfferLetter, $this> */
    public function offerLetters(): HasMany
    {
        return $this->hasMany(AdmissionOfferLetter::class);
    }

    /** @return HasMany<AdmissionWorkflowHistory, $this> */
    public function history(): HasMany
    {
        return $this->hasMany(AdmissionWorkflowHistory::class);
    }

    /** @return HasOne<AdmissionConversion, $this> */
    public function conversion(): HasOne
    {
        return $this->hasOne(AdmissionConversion::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim(implode(' ', array_filter([$this->first_name, $this->middle_name, $this->last_name])));
    }
}
