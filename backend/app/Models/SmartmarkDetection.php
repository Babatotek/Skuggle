<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmartmarkDetection extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id'];

    /** @return array{confidence: 'float', marks: 'float'} */
    protected function casts(): array
    {
        return ['confidence' => 'float', 'marks' => 'float'];
    }

    /** @return BelongsTo<SmartmarkSheet, $this> */
    public function sheet(): BelongsTo
    {
        return $this->belongsTo(SmartmarkSheet::class, 'sheet_id');
    }
}
