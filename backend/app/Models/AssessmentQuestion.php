<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

class AssessmentQuestion extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'correct_answer'];

    protected function casts(): array
    {
        return ['options' => 'array', 'correct_answer' => 'encrypted'];
    }
}
