<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Library\AI\AIManager;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Library\StoreAnnotationRequest;
use App\Models\LibraryAnnotation;
use App\Models\LibraryResource;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LibraryAnnotationController extends Controller
{
    public function index(string $resource, Request $request): JsonResponse
    {
        $item = $this->resource($resource);
        $annotations = LibraryAnnotation::query()->where('library_resource_id', $item->getKey())->with(['author.memberships.role'])->oldest()->get();

        return ApiResponse::success($annotations->map(fn ($annotation) => $this->present($annotation, $request)));
    }

    public function store(string $resource, StoreAnnotationRequest $request, AuditLogger $audit): JsonResponse
    {
        $item = $this->resource($resource);
        if ($request->filled('sectionId') && ! collect($item->sections ?? [])->contains(fn ($section) => ($section['id'] ?? null) === $request->input('sectionId'))) {
            throw new ApiException('INVALID_SECTION', 'The selected section does not exist in this document version.', 422);
        }
        $annotation = LibraryAnnotation::query()->create(['library_resource_id' => $item->getKey(), 'author_id' => $request->user()->getKey(), 'section_id' => $request->input('sectionId'), 'body' => $request->string('body')->toString(), 'colour' => $request->string('colour')->toString()]);
        $audit->record('library.annotation_created', $annotation, [], ['resource' => $item->public_id, 'section' => $annotation->section_id]);

        return ApiResponse::success($this->present($annotation->load('author.memberships.role'), $request), [], 201);
    }

    public function update(string $resource, string $annotation, StoreAnnotationRequest $request, AuditLogger $audit): JsonResponse
    {
        $item = $this->resource($resource);
        $note = $this->annotation($item, $annotation);
        $this->authoriseEdit($note, $request);
        $before = $note->only(['body', 'colour']);
        $note->update(['body' => $request->string('body')->toString(), 'colour' => $request->string('colour')->toString()]);
        $audit->record('library.annotation_updated', $note, $before, $note->only(['body', 'colour']));

        return ApiResponse::success($this->present($note->load('author.memberships.role'), $request));
    }

    public function destroy(string $resource, string $annotation, Request $request, AuditLogger $audit): JsonResponse
    {
        $item = $this->resource($resource);
        $note = $this->annotation($item, $annotation);
        $this->authoriseEdit($note, $request);
        $audit->record('library.annotation_deleted', $note, $note->only(['body', 'colour', 'section_id']));
        $note->delete();

        return ApiResponse::success(null);
    }

    public function transcribe(string $resource, Request $request, AIManager $ai): JsonResponse
    {
        $this->resource($resource);
        $request->validate(['audio' => ['required', 'file', 'mimetypes:audio/webm,audio/ogg,audio/wav,audio/x-wav,audio/mpeg,audio/mp4,video/webm', 'max:15360']]);

        return ApiResponse::success(['transcript' => $ai->transcribe($request->file('audio'), $request->user()->getKey())]);
    }

    private function resource(string $publicId): LibraryResource
    {
        return LibraryResource::query()->where('public_id', $publicId)->whereIn('status', ['published', 'draft'])->firstOrFail();
    }

    private function annotation(LibraryResource $resource, string $publicId): LibraryAnnotation
    {
        return LibraryAnnotation::query()->where('library_resource_id', $resource->getKey())->where('public_id', $publicId)->firstOrFail();
    }

    private function authoriseEdit(LibraryAnnotation $annotation, Request $request): void
    {
        if ($annotation->author_id !== $request->user()->getKey() && ! in_array('library.version.manage', $request->attributes->get('membership')->permissionNames(), true)) {
            throw new ApiException('FORBIDDEN', 'Only the author or a library manager can edit this annotation.', 403);
        }
    }

    private function present(LibraryAnnotation $annotation, Request $request): array
    {
        $membership = $annotation->author->memberships->firstWhere('tenant_id', $annotation->tenant_id);

        return ['id' => $annotation->public_id, 'resourceId' => $annotation->library_resource_id, 'sectionId' => $annotation->section_id, 'body' => $annotation->body, 'colour' => $annotation->colour, 'createdAt' => $annotation->created_at->toIso8601String(), 'updatedAt' => $annotation->updated_at->toIso8601String(), 'author' => ['id' => $annotation->author->public_id, 'name' => $annotation->author->name, 'roleLabel' => $membership?->role?->label ?? 'Contributor'], 'canEdit' => $annotation->author_id === $request->user()->getKey() || in_array('library.version.manage', $request->attributes->get('membership')->permissionNames(), true)];
    }
}
