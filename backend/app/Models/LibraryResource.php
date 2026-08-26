<?php

namespace App\Models;

use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LibraryResource extends Model
{
    use BelongsToTenant, HasPublicId, SoftDeletes;

    protected $guarded = ['id', 'tenant_id'];

    protected $hidden = ['id', 'tenant_id', 'storage_key'];

    protected function casts(): array
    {
        return [
            'learning_objectives' => 'array', 'table_of_contents' => 'array', 'sections' => 'array',
            'school_approved' => 'boolean', 'is_public' => 'boolean', 'published_at' => 'datetime',
        ];
    }

    public function versions(): HasMany
    {
        return $this->hasMany(LibraryResourceVersion::class);
    }

    public function sectionRows(): HasMany
    {
        return $this->hasMany(LibraryResourceSection::class)->orderBy('sort_order');
    }

    /**
     * Prefer normalized rows when present; fall back to legacy JSON column.
     *
     * @return list<array<string, mixed>>
     */
    public function resolvedSections(): array
    {
        if ($this->relationLoaded('sectionRows')) {
            return $this->sectionRows
                ->map(fn (LibraryResourceSection $section) => $section->toLegacyArray())
                ->values()
                ->all();
        }

        $rows = $this->sectionRows()->get();
        if ($rows->isNotEmpty()) {
            return $rows
                ->map(fn (LibraryResourceSection $section) => $section->toLegacyArray())
                ->values()
                ->all();
        }

        return is_array($this->sections) ? $this->sections : [];
    }

    public function annotations(): HasMany
    {
        return $this->hasMany(LibraryAnnotation::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
