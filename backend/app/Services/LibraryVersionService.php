<?php

namespace App\Services;

use App\Models\LibraryResource;
use App\Models\LibraryResourceVersion;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class LibraryVersionService
{
    public function snapshot(LibraryResource $resource, User $actor, string $summary, ?string $restoredFrom = null): LibraryResourceVersion
    {
        return DB::transaction(function () use ($resource, $actor, $summary, $restoredFrom): LibraryResourceVersion {
            LibraryResourceVersion::query()->where('library_resource_id', $resource->getKey())->update(['is_current' => false]);
            $version = $resource->content_version;

            return LibraryResourceVersion::query()->create(['library_resource_id' => $resource->getKey(), 'version' => $version, 'snapshot' => $this->snapshotData($resource), 'change_summary' => $summary, 'is_current' => true, 'restored_from_version' => $restoredFrom, 'created_by' => $actor->getKey()]);
        });
    }

    public function nextVersion(LibraryResource $resource): string
    {
        $parts = array_map('intval', explode('.', $resource->content_version));

        return ($parts[0] ?: 1).'.'.(($parts[1] ?? 0) + 1);
    }

    public function snapshotData(LibraryResource $resource): array
    {
        return $resource->only(['slug', 'title', 'description', 'author', 'publisher', 'resource_type', 'educational_level', 'class_name', 'subject_id', 'subject_label', 'term_label', 'topic', 'estimated_study_minutes', 'access_tier', 'source_label', 'cover_image_key', 'storage_key', 'mime_type', 'file_size', 'licence_name', 'copyright_owner', 'usage_note', 'learning_objectives', 'table_of_contents', 'sections', 'content_version', 'school_approved', 'is_public', 'created_by', 'updated_by', 'status', 'published_at']);
    }
}
