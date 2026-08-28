<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

final class TenantModuleData extends Model
{
    use BelongsToTenant;

    protected $table = 'tenant_module_data';
    protected $guarded = ['id', 'tenant_id'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
