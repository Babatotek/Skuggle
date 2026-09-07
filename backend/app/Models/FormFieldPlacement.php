<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormFieldPlacement extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'required' => 'boolean',
            'visible' => 'boolean',
            'permissions' => 'array',
            'conditional_rules' => 'array',
            'overrides' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function formDefinition(): BelongsTo
    {
        return $this->belongsTo(FormDefinition::class);
    }

    public function formSection(): BelongsTo
    {
        return $this->belongsTo(FormSection::class);
    }

    public function fieldDefinition(): BelongsTo
    {
        return $this->belongsTo(FieldDefinition::class);
    }
}
