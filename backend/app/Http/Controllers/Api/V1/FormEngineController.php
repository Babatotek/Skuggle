<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\FormEngineService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FormEngineController extends Controller
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly FormEngineService $forms,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): JsonResponse
    {
        return ApiResponse::success([
            'groups' => $this->forms->listForms($this->context->tenant()),
        ]);
    }

    public function show(string $formKey): JsonResponse
    {
        return ApiResponse::success([
            'form' => $this->forms->getForm($this->context->tenant(), $formKey),
        ]);
    }

    public function update(string $formKey, Request $request): JsonResponse
    {
        $payload = $request->validate([
            'status' => ['nullable', 'string', 'in:draft,published'],
            'sections' => ['nullable', 'array'],
            'sections.*.id' => ['nullable', 'integer'],
            'sections.*.name' => ['nullable', 'string', 'max:120'],
            'sections.*.sortOrder' => ['nullable', 'integer', 'min:0', 'max:999'],
            'fields' => ['nullable', 'array', 'max:80'],
            'fields.*.id' => ['nullable', 'integer'],
            'fields.*.key' => ['nullable', 'string', 'max:64'],
            'fields.*.label' => ['nullable', 'string', 'max:160'],
            'fields.*.answerType' => ['nullable', 'string', 'max:40'],
            'fields.*.sectionKey' => ['nullable', 'string', 'max:80'],
            'fields.*.sortOrder' => ['nullable', 'integer', 'min:0', 'max:999'],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.visible' => ['nullable', 'boolean'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:160'],
            'fields.*.helpText' => ['nullable', 'string', 'max:240'],
            'fields.*.showOnRegistration' => ['nullable', 'boolean'],
            'fields.*.includeInReports' => ['nullable', 'boolean'],
            'fields.*.includeInDownloads' => ['nullable', 'boolean'],
            'fields.*.requiredForCompletion' => ['nullable', 'boolean'],
            'fields.*.sensitive' => ['nullable', 'boolean'],
            'fields.*.options' => ['nullable', 'array', 'max:30'],
            'fields.*.options.*' => ['string', 'max:120'],
            'fields.*.permissions' => ['nullable', 'array'],
            'fields.*.conditionalRules' => ['nullable', 'array'],
        ]);

        $form = $this->forms->saveForm($this->context->tenant(), $formKey, $payload);

        $this->audit->record('forms.updated', $this->context->tenant(), [], [
            'formKey' => $formKey,
            'version' => $form['version'] ?? null,
        ]);

        return ApiResponse::success(['form' => $form]);
    }

    public function reset(string $formKey): JsonResponse
    {
        $form = $this->forms->resetForm($this->context->tenant(), $formKey);

        $this->audit->record('forms.reset', $this->context->tenant(), [], [
            'formKey' => $formKey,
        ]);

        return ApiResponse::success(['form' => $form]);
    }

    public function library(string $formKey, Request $request): JsonResponse
    {
        return ApiResponse::success(
            $this->forms->fieldLibrary(
                $this->context->tenant(),
                $formKey,
                $request->query('search'),
            ),
        );
    }

    public function addField(string $formKey, Request $request): JsonResponse
    {
        $payload = $request->validate([
            'templateKey' => ['nullable', 'string', 'max:80'],
            'label' => ['nullable', 'string', 'max:160'],
            'key' => ['nullable', 'string', 'max:64'],
            'answerType' => ['nullable', 'string', 'max:40'],
            'required' => ['nullable', 'boolean'],
            'visible' => ['nullable', 'boolean'],
            'sectionKey' => ['nullable', 'string', 'max:80'],
            'sortOrder' => ['nullable', 'integer', 'min:0', 'max:999'],
            'options' => ['nullable', 'array', 'max:30'],
            'options.*' => ['string', 'max:120'],
            'placeholder' => ['nullable', 'string', 'max:160'],
            'helpText' => ['nullable', 'string', 'max:240'],
            'sensitive' => ['nullable', 'boolean'],
            'showOnRegistration' => ['nullable', 'boolean'],
            'permissions' => ['nullable', 'array'],
            'conditionalRules' => ['nullable', 'array'],
        ]);

        $field = $this->forms->addField($this->context->tenant(), $formKey, $payload);

        $this->audit->record('forms.field_added', $this->context->tenant(), [], [
            'formKey' => $formKey,
            'fieldKey' => $field['key'] ?? null,
        ]);

        return ApiResponse::success(['field' => $field]);
    }
}
