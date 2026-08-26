<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

class GeneratedQuiz extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    protected function casts(): array
    {
        return ['learning_outcomes' => 'array', 'questions' => 'encrypted:array', 'reviewed_at' => 'datetime'];
    }
}
