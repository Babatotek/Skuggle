<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\LibraryBookmark;
use App\Models\LibraryProgress;
use App\Models\LibraryResource;
use App\Support\SignedStorageUrl;
use Illuminate\Support\Facades\Storage;

final class LibraryResourcePresenter
{
    public function __construct(private readonly TenantContext $context) {}

    public function summary(LibraryResource $resource, ?int $userId = null, bool $public = false): array
    {
        $permissions = $this->context->hasTenant() && ! $public ? $this->context->membership()->permissionNames() : [];
        $bookmarked = $userId ? LibraryBookmark::query()->where('user_id', $userId)->where('library_resource_id', $resource->getKey())->exists() : false;
        $progress = $userId ? LibraryProgress::query()->where('user_id', $userId)->where('library_resource_id', $resource->getKey())->value('progress_percent') : null;
        $canDownload = $resource->storage_key !== null && ($public ? $resource->access_tier === 'free' : true);

        return [
            'id' => $resource->public_id, 'slug' => $resource->slug, 'title' => $resource->title, 'description' => $resource->description, 'author' => $resource->author, 'publisher' => $resource->publisher,
            'resourceType' => $resource->resource_type, 'educationalLevel' => $resource->educational_level, 'className' => $resource->class_name, 'subject' => $resource->subject_label ?? $resource->subject?->name, 'term' => $resource->term_label,
            'topic' => $resource->topic, 'estimatedStudyMinutes' => $resource->estimated_study_minutes, 'accessTier' => $resource->access_tier, 'sourceLabel' => $resource->source_label, 'coverImageUrl' => $this->publicUrl($resource->cover_image_key),
            'downloadUrl' => $canDownload ? url('/api/v1/library/resources/'.$resource->public_id.'/download') : null,
            'mimeType' => $resource->mime_type, 'fileSize' => $resource->file_size, 'publishedAt' => $resource->published_at?->toIso8601String(), 'updatedAt' => $resource->updated_at?->toIso8601String(),
            'progressPercent' => $progress !== null ? (float) $progress : null, 'bookmarked' => $bookmarked, 'teacherRecommended' => false, 'schoolApproved' => (bool) $resource->school_approved,
            'permissions' => ['canRead' => true, 'canExplain' => $public || in_array('library.view', $permissions, true), 'canSummarise' => $public || in_array('library.view', $permissions, true), 'canPractise' => true, 'canDownload' => $canDownload, 'canUseOffline' => false, 'canAssign' => in_array('library.assign', $permissions, true), 'canRecommend' => in_array('library.assign', $permissions, true), 'canViewAnnotations' => ! $public, 'canAnnotate' => in_array('library.annotate', $permissions, true), 'canManageVersions' => in_array('library.version.manage', $permissions, true)],
        ];
    }

    public function detail(LibraryResource $resource, ?int $userId = null, bool $public = false): array
    {
        return $this->summary($resource, $userId, $public) + ['licence' => ['name' => $resource->licence_name, 'copyrightOwner' => $resource->copyright_owner, 'usageNote' => $resource->usage_note], 'learningObjectives' => $resource->learning_objectives ?? [], 'tableOfContents' => $resource->table_of_contents ?? [], 'sections' => $resource->sections ?? [], 'contentVersion' => $resource->content_version];
    }

    private function publicUrl(?string $key): ?string
    {
        if (! $key) {
            return null;
        }
        try {
            return Storage::disk((string) config('skuggle.library.disk'))->url($key);
        } catch (\Throwable) {
            return null;
        }
    }
}
