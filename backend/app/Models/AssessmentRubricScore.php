<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

class AssessmentRubricScore extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    /** @return array{score: 'decimal:2', maximum: 'decimal:2'} */
    protected function casts(): array
    {
        return ['score' => 'decimal:2', 'maximum' => 'decimal:2'];
    }
}
