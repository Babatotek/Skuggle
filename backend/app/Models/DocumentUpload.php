<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

class DocumentUpload extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'storage_key', 'extracted_text'];

    protected function casts(): array
    {
        return ['extracted_text' => 'encrypted', 'outcomes' => 'encrypted:array', 'expires_at' => 'datetime'];
    }
}
