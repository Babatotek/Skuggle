<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

class AssessmentBankQuestion extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    protected function casts(): array
    {
        return ['options' => 'array', 'ai_generated' => 'boolean', 'marks' => 'float', 'correct_answer' => 'encrypted', 'rubric' => 'array'];
    }
}
