<?php

namespace App\Models;

use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformApiCredential extends Model
{
    use HasPublicId;

    protected $guarded = ['id'];

    protected $hidden = ['id', 'fingerprint'];

    protected function casts(): array
    {
        return [
            'last_rotated_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function rotator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rotated_by');
    }
}
