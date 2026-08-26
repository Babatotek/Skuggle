<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OutboxEvent extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['payload' => 'array', 'available_at' => 'datetime', 'processed_at' => 'datetime', 'created_at' => 'datetime'];
    }
}
