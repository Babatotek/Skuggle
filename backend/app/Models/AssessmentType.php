<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

class AssessmentType extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    /** @return array{allowed_delivery: 'array', moderation_required: 'boolean', resit_allowed: 'boolean', result_contribution: 'boolean', is_active: 'boolean'} */
    protected function casts(): array
    {
        return [
            'allowed_delivery' => 'array',
            'moderation_required' => 'boolean',
            'resit_allowed' => 'boolean',
            'result_contribution' => 'boolean',
            'is_active' => 'boolean',
            'default_maximum_score' => 'float',
            'default_weight' => 'float',
        ];
    }
}
