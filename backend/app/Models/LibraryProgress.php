<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LibraryProgress extends Model
{
    use BelongsToTenant;

    protected $guarded = ['id', 'tenant_id'];

    protected function casts(): array
    {
        return ['progress_percent' => 'decimal:2', 'completed_at' => 'datetime'];
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(LibraryResource::class, 'library_resource_id');
    }
}
