<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use BelongsToTenant, HasPublicId, SoftDeletes;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    protected function casts(): array
    {
        return [
            'started_at' => 'date',
            'metadata' => 'array',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
