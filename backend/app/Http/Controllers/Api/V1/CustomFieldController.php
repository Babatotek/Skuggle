<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\CustomFieldRegistry;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomFieldController extends Controller
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly CustomFieldRegistry $registry,
        private readonly AuditLogger $audit,
    ) {}

    public function show(string $entity): JsonResponse
    {
        $this->assertEntity($entity);

        return ApiResponse::success([
            'entity' => $entity,
            'fields' => $this->registry->definitions($this->context->tenant(), $entity),
        ]);
    }

    public function update(string $entity, Request $request): JsonResponse
    {
        $this->assertEntity($entity);
        $payload = $request->validate([
            'fields' => ['required', 'array', 'max:50'],
            'fields.*.key' => ['nullable', 'string', 'max:64'],
            'fields.*.label' => ['required', 'string', 'max:120'],
            'fields.*.type' => ['required', 'string', 'in:text,number,date,select,boolean'],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.section' => ['nullable', 'string', 'max:80'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:160'],
            'fields.*.helpText' => ['nullable', 'string', 'max:240'],
            'fields.*.showOnRegistration' => ['nullable', 'boolean'],
            'fields.*.order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'fields.*.options' => ['nullable', 'array', 'max:30'],
            'fields.*.options.*' => ['string', 'max:120'],
        ]);

        $fields = $this->registry->saveDefinitions(
            $this->context->tenant(),
            $entity,
            $payload['fields'],
        );

        $this->audit->record('custom_fields.updated', $this->context->tenant(), [], [
            'entity' => $entity,
            'count' => count($fields),
        ]);

        return ApiResponse::success([
            'entity' => $entity,
            'fields' => $fields,
        ]);
    }

    private function assertEntity(string $entity): void
    {
        if (! in_array($entity, CustomFieldRegistry::entities(), true)) {
            abort(404);
        }
    }
}
