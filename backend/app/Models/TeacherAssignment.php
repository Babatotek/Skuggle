<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class TeacherAssignment extends Model
{
    use BelongsToTenant;

    protected $guarded = ['id', 'tenant_id'];
}
