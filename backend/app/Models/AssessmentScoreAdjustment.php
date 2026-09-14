<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

class AssessmentScoreAdjustment extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    /** @return array{previous_score: 'decimal:2', new_score: 'decimal:2'} */
    protected function casts(): array
    {
        return ['previous_score' => 'decimal:2', 'new_score' => 'decimal:2'];
    }
}
