<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

class ExportJob extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'storage_key'];

    protected function casts(): array
    {
        return ['resource_ids' => 'array', 'include_cover_page' => 'boolean', 'expires_at' => 'datetime'];
    }
}
