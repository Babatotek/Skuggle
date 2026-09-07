<?php

namespace App\Models;

use App\Domain\Admissions\DecisionType;
use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class AdmissionDecision extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'legacy_source_id'];

    protected function casts(): array
    {
        return [
            'decision' => DecisionType::class,
            'expires_at' => 'date',
            'decided_at' => 'datetime',
        ];
    }

    public function decisionType(): DecisionType
    {
        $decision = $this->getAttribute('decision');

        return $decision instanceof DecisionType ? $decision : DecisionType::from((string) $decision);
    }

    public function expiresAt(): ?Carbon
    {
        $value = $this->getAttribute('expires_at');

        return $value ? Carbon::parse($value) : null;
    }

    /** @return BelongsTo<AdmissionApplication, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(AdmissionApplication::class, 'admission_application_id');
    }

    /** @return BelongsTo<SchoolClass, $this> */
    public function offeredClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'offered_class_id');
    }
}
