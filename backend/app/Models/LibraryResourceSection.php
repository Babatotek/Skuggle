<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LibraryResourceSection extends Model
{
    use BelongsToTenant;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'library_resource_id'];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(LibraryResource::class, 'library_resource_id');
    }

    /**
     * Shape matching the legacy JSON section payload used by API presenters.
     */
    public function toLegacyArray(): array
    {
        return array_filter([
            'id' => $this->section_key,
            'title' => $this->title,
            'content' => $this->content,
        ] + (is_array($this->meta) ? $this->meta : []), static fn ($value) => $value !== null);
    }
}
