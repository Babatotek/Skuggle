<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['before_values' => 'encrypted:array', 'after_values' => 'encrypted:array', 'metadata' => 'array', 'occurred_at' => 'immutable_datetime'];
    }

    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new \LogicException('Audit records are immutable.');
        }

return parent::save($options);
    }

    public function delete(): ?bool
    {
        throw new \LogicException('Audit records are immutable.');
    }
}
