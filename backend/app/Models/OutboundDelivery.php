<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;

final class OutboundDelivery extends Model
{
    use BelongsToTenant, HasPublicId;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'destination'];

    protected function casts(): array
    {
        return ['destination' => 'encrypted', 'sent_at' => 'datetime', 'delivered_at' => 'datetime'];
    }
}
