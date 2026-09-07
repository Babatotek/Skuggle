<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\School\SchoolModuleCatalog;
use App\Http\Controllers\Controller;
use App\Models\SchoolModuleRecord;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolModuleRecordController extends Controller
{
    public function catalog(Request $request): JsonResponse
    {
        $permissions = $request->attributes->get('membership')?->permissionNames() ?? [];
        $modules = [];
        foreach (SchoolModuleCatalog::all() as $key => $definition) {
            if (! in_array($definition['permission'], $permissions, true) && ! in_array($definition['writePermission'], $permissions, true)) {
                continue;
            }
            $modules[] = ['id' => $key, ...$definition];
        }

        return ApiResponse::success($modules);
    }

    public function index(Request $request, string $module): JsonResponse
    {
        $definition = $this->definition($module);
        $this->assertPermission($request, $definition['permission']);
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $query = SchoolModuleRecord::query()->where('module', $module)->latest();
        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }
        if ($search = $request->string('q')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")->orWhere('reference', 'like', "%{$search}%");
            });
        }
        $paginator = $query->paginate($perPage);

        return ApiResponse::success([
            'module' => $module,
            'definition' => $definition,
            'data' => collect($paginator->items())->map(fn (SchoolModuleRecord $item) => $this->present($item))->values()->all(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(Request $request, string $module, AuditLogger $audit): JsonResponse
    {
        $definition = $this->definition($module);
        $this->assertPermission($request, $definition['writePermission']);
        $data = $this->validated($request, $definition);
        $record = SchoolModuleRecord::query()->create([
            'module' => $module,
            'title' => $data['title'],
            'status' => $data['status'],
            'reference' => $data['reference'] ?? null,
            'payload' => $data['payload'],
            'created_by' => $request->user()->getKey(),
        ]);
        $audit->record('school_module.created', $record, [], ['module' => $module, 'title' => $record->title]);

        return ApiResponse::success($this->present($record), [], 201);
    }

    public function update(Request $request, string $module, string $record, AuditLogger $audit): JsonResponse
    {
        $definition = $this->definition($module);
        $this->assertPermission($request, $definition['writePermission']);
        $item = SchoolModuleRecord::query()->where('module', $module)->where('public_id', $record)->firstOrFail();
        $data = $this->validated($request, $definition, false);
        $before = $item->only(['title', 'status', 'payload']);
        $item->fill(array_filter([
            'title' => $data['title'] ?? $item->title,
            'status' => $data['status'] ?? $item->status,
            'reference' => $data['reference'] ?? $item->reference,
            'payload' => $data['payload'] ?? $item->payload,
        ], fn ($value) => $value !== null));
        $item->save();
        $audit->record('school_module.updated', $item, $before, $item->only(['title', 'status', 'payload']));

        return ApiResponse::success($this->present($item));
    }

    /**
     * @return array{label: string, permission: string, writePermission: string, statuses: list<string>, fields: list<array<string, mixed>>}
     */
    private function definition(string $module): array
    {
        $definition = SchoolModuleCatalog::get($module);
        abort_unless($definition !== null, 404, 'Unknown school module.');

        return $definition;
    }

    /**
     * @param  array{statuses: list<string>, fields: list<array<string, mixed>>}  $definition
     * @return array{title: string, status: string, reference?: string|null, payload: array<string, mixed>}
     */
    private function validated(Request $request, array $definition, bool $creating = true): array
    {
        $rules = [
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:190'],
            'status' => ['nullable', 'string', 'in:'.implode(',', $definition['statuses'])],
            'reference' => ['nullable', 'string', 'max:80'],
            'payload' => ['nullable', 'array'],
        ];
        foreach ($definition['fields'] as $field) {
            $rules['payload.'.$field['key']] = [! empty($field['required']) && $creating ? 'required' : 'nullable', 'string', 'max:2000'];
        }
        $data = $request->validate($rules);
        $title = $data['title'] ?? (string) data_get($data, 'payload.'.($definition['fields'][0]['key'] ?? 'title'), 'Untitled');

        return [
            'title' => $title,
            'status' => $data['status'] ?? $definition['statuses'][0],
            'reference' => $data['reference'] ?? null,
            'payload' => $data['payload'] ?? [],
        ];
    }

    private function assertPermission(Request $request, string $permission): void
    {
        $permissions = $request->attributes->get('membership')?->permissionNames() ?? [];
        abort_unless(in_array($permission, $permissions, true), 403);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(SchoolModuleRecord $item): array
    {
        return [
            'id' => $item->public_id,
            'module' => $item->module,
            'title' => $item->title,
            'status' => $item->status,
            'reference' => $item->reference,
            'payload' => $item->payload ?? [],
            'createdAt' => $item->created_at?->toIso8601String(),
            'updatedAt' => $item->updated_at?->toIso8601String(),
        ];
    }
}
