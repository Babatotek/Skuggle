<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class SmartmarkSheet extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'batch_id'];

    /** @return array{answers: 'array', human_review_required: 'boolean', reviewed_at: 'datetime', committed_at: 'datetime'} */
    protected function casts(): array
    {
        return ['answers' => 'array', 'human_review_required' => 'boolean', 'reviewed_at' => 'datetime', 'committed_at' => 'datetime'];
    }

    /** @return HasMany<SmartmarkDetection, $this> */
    public function detections(): HasMany
    {
        return $this->hasMany(SmartmarkDetection::class, 'sheet_id');
    }
}
