<?php

namespace App\Services;

use App\Domain\Forms\AnswerTypes;
use App\Domain\Forms\FieldTemplateLibrary;
use App\Domain\Forms\FormCatalog;
use App\Exceptions\ApiException;
use App\Models\FieldDefinition;
use App\Models\FormDefinition;
use App\Models\FormFieldPlacement;
use App\Models\FormSection;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class FormEngineService
{
    private const MAX_FIELDS_PER_FORM = 80;

    private const MAX_OPTIONS = 30;

    private const CACHE_TTL_SECONDS = 300;

    public function listForms(Tenant $tenant): array
    {
        $grouped = [];
        foreach (FormCatalog::all() as $form) {
            $category = (string) $form['category'];
            $grouped[$category] ??= [
                'category' => $category,
                'label' => $this->categoryLabel($category),
                'forms' => [],
            ];
            $definition = $this->ensureForm($tenant, (string) $form['key']);
            $grouped[$category]['forms'][] = [
                'key' => $definition->form_key,
                'name' => $definition->name,
                'status' => $definition->status,
                'version' => $definition->version,
            ];
        }

        return array_values($grouped);
    }

    public function getForm(Tenant $tenant, string $formKey, bool $forRender = false): array
    {
        FormCatalog::assertExists($formKey);
        $definition = $this->ensureForm($tenant, $formKey);

        return $this->serializeForm($definition, $forRender);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function saveForm(Tenant $tenant, string $formKey, array $payload): array
    {
        FormCatalog::assertExists($formKey);
        $definition = $this->ensureForm($tenant, $formKey);

        return DB::transaction(function () use ($tenant, $definition, $payload): array {
            if (isset($payload['sections']) && is_array($payload['sections'])) {
                $this->applySectionUpdates($tenant, $definition, $payload['sections']);
            }

            if (isset($payload['fields']) && is_array($payload['fields'])) {
                $this->applyFieldUpdates($tenant, $definition, $payload['fields']);
            }

            if (isset($payload['status']) && in_array($payload['status'], ['draft', 'published'], true)) {
                $definition->update(['status' => $payload['status']]);
            }

            $definition->increment('version');
            $this->forgetCache($tenant, $definition->form_key);

            return $this->serializeForm($definition->fresh(['sections.placements.fieldDefinition']), false);
        });
    }

    public function resetForm(Tenant $tenant, string $formKey): array
    {
        FormCatalog::assertExists($formKey);
        $definition = FormDefinition::query()
            ->where('tenant_id', $tenant->id)
            ->where('form_key', $formKey)
            ->first();

        if ($definition) {
            DB::transaction(function () use ($definition): void {
                FormFieldPlacement::query()->where('form_definition_id', $definition->id)->delete();
                FormSection::query()->where('form_definition_id', $definition->id)->delete();
                $definition->delete();
            });
        }

        $this->forgetCache($tenant, $formKey);

        return $this->getForm($tenant, $formKey);
    }

    public function fieldLibrary(Tenant $tenant, string $formKey, ?string $search = null): array
    {
        $catalog = FormCatalog::assertExists($formKey);
        $entity = (string) $catalog['entity'];
        $country = strtoupper((string) ($tenant->country ?? ''));

        $templates = collect(FieldTemplateLibrary::all())
            ->filter(fn (array $template): bool => in_array($entity, $template['entities'] ?? [], true))
            ->when($search, function ($collection) use ($search) {
                $needle = Str::lower($search);

                return $collection->filter(function (array $template) use ($needle): bool {
                    return str_contains(Str::lower((string) $template['label']), $needle)
                        || str_contains(Str::lower((string) $template['key']), $needle);
                });
            })
            ->values();

        $suggested = $templates
            ->filter(fn (array $template): bool => $country !== '' && in_array($country, $template['jurisdictions'] ?? [], true))
            ->values()
            ->all();

        return [
            'search' => $search,
            'country' => $country,
            'suggested' => $suggested,
            'templates' => $templates->all(),
            'answerTypes' => AnswerTypes::labels(),
        ];
    }

    /**
     * @param  array<string, mixed>  $field
     */
    public function addField(Tenant $tenant, string $formKey, array $field): array
    {
        FormCatalog::assertExists($formKey);
        $definition = $this->ensureForm($tenant, $formKey);

        return DB::transaction(function () use ($tenant, $definition, $field): array {
            $fieldDef = $this->resolveOrCreateFieldDefinition($tenant, $field);
            $section = $this->resolveSection($tenant, $definition, (string) ($field['sectionKey'] ?? 'additional'));
            $sortOrder = (int) ($field['sortOrder'] ?? ($section->placements()->max('sort_order') + 1));

            $placement = FormFieldPlacement::query()->updateOrCreate(
                [
                    'form_definition_id' => $definition->id,
                    'field_definition_id' => $fieldDef->id,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'form_section_id' => $section->id,
                    'sort_order' => $sortOrder,
                    'required' => (bool) ($field['required'] ?? false),
                    'visible' => (bool) ($field['visible'] ?? true),
                    'lock_level' => (string) ($field['lockLevel'] ?? FormCatalog::LOCK_CUSTOM),
                    'permissions' => $field['permissions'] ?? null,
                    'conditional_rules' => $field['conditionalRules'] ?? null,
                    'overrides' => $field['overrides'] ?? null,
                ],
            );

            $this->forgetCache($tenant, $definition->form_key);
            $definition->increment('version');

            return $this->serializePlacement($placement->load(['fieldDefinition', 'formSection']));
        });
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function validateValues(
        Tenant $tenant,
        string $formKey,
        array $values,
        bool $registrationOnly = false,
    ): array {
        $form = $this->getForm($tenant, $formKey, true);
        $errors = [];
        $stored = [];
        $allowedKeys = [];

        foreach ($form['sections'] as $section) {
            foreach ($section['fields'] as $field) {
                // Core fields are validated and persisted by their domain request/service.
                // This validator only accepts extensibility values submitted in customFields.
                if (($field['source'] ?? '') === 'system') {
                    continue;
                }
                if (! $this->roleAllowed((array) ($field['permissions'] ?? []), 'editRoles')) {
                    continue;
                }
                if ($registrationOnly && ! ($field['showOnRegistration'] ?? true)) {
                    continue;
                }
                if (! ($field['visible'] ?? true)) {
                    continue;
                }
                if (! $this->conditionsMatch((array) ($field['conditionalRules'] ?? []), $values)) {
                    continue;
                }

                $key = (string) $field['key'];
                $allowedKeys[] = $key;
                $label = (string) $field['label'];
                $required = (bool) ($field['required'] ?? false);
                $hasValue = array_key_exists($key, $values) && $values[$key] !== null && $values[$key] !== '';

                if (! $hasValue) {
                    if ($required) {
                        $errors["customFields.{$key}"] = ["{$label} is required."];
                    }

                    continue;
                }

                try {
                    $stored[$key] = $this->castValue((string) $field['answerType'], $values[$key], $field);
                } catch (\InvalidArgumentException $exception) {
                    $errors["customFields.{$key}"] = [$exception->getMessage()];
                }
            }
        }

        foreach (array_keys($values) as $key) {
            if (! in_array($key, $allowedKeys, true)) {
                $errors["customFields.{$key}"] = ['This field is not configured for your school.'];
            }
        }

        if ($errors !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Custom field information is invalid.', 422, $errors);
        }

        return $stored;
    }

    /** @return list<array<string, mixed>> */
    public function legacyDefinitions(Tenant $tenant, string $entity, bool $registrationOnly = false): array
    {
        $formKey = FormCatalog::legacyEntityToFormKey($entity);
        if ($formKey === null) {
            return [];
        }

        $form = $this->getForm($tenant, $formKey, true);
        $fields = [];

        foreach ($form['sections'] as $section) {
            foreach ($section['fields'] as $field) {
                if ($registrationOnly && ! ($field['showOnRegistration'] ?? true)) {
                    continue;
                }
                if (! ($field['visible'] ?? true)) {
                    continue;
                }
                if (($field['source'] ?? '') === 'system') {
                    continue;
                }

                $fields[] = [
                    'key' => $field['key'],
                    'label' => $field['label'],
                    'type' => AnswerTypes::legacyType((string) $field['answerType']),
                    'required' => (bool) ($field['required'] ?? false),
                    'section' => $section['name'],
                    'placeholder' => (string) ($field['placeholder'] ?? ''),
                    'helpText' => (string) ($field['helpText'] ?? ''),
                    'showOnRegistration' => (bool) ($field['showOnRegistration'] ?? true),
                    'order' => (int) ($field['sortOrder'] ?? 0),
                    'options' => $field['options'] ?? [],
                ];
            }
        }

        usort($fields, fn (array $a, array $b): int => ($a['order'] <=> $b['order']) ?: strcmp((string) $a['label'], (string) $b['label']));

        return array_values($fields);
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return list<array<string, mixed>>
     */
    public function saveLegacyDefinitions(Tenant $tenant, string $entity, array $fields): array
    {
        $formKey = FormCatalog::legacyEntityToFormKey($entity);
        if ($formKey === null) {
            throw new ApiException('VALIDATION_ERROR', 'Unknown custom field entity.', 422);
        }

        $definition = $this->ensureForm($tenant, $formKey);
        $sectionMap = $definition->sections()->get()->keyBy('section_key');

        DB::transaction(function () use ($tenant, $definition, $fields, $sectionMap): void {
            $customPlacements = $definition->placements()
                ->whereHas('fieldDefinition', fn ($q) => $q->where('source', 'custom'))
                ->with('fieldDefinition')
                ->get();

            foreach ($customPlacements as $placement) {
                if ($placement->lock_level === FormCatalog::LOCK_CUSTOM) {
                    $placement->delete();
                }
            }

            foreach ($fields as $index => $field) {
                $sectionName = trim((string) ($field['section'] ?? 'Additional Information')) ?: 'Additional Information';
                $sectionKey = Str::slug($sectionName, '_') ?: 'additional';
                $section = $sectionMap->get($sectionKey);
                if (! $section) {
                    $section = FormSection::query()->create([
                        'tenant_id' => $tenant->id,
                        'form_definition_id' => $definition->id,
                        'section_key' => $sectionKey,
                        'name' => $sectionName,
                        'sort_order' => 900 + $index,
                        'is_customizable' => true,
                    ]);
                    $sectionMap->put($sectionKey, $section);
                }

                $this->addField($tenant, $definition->form_key, [
                    'label' => $field['label'] ?? '',
                    'key' => $field['key'] ?? null,
                    'answerType' => $this->legacyToAnswerType((string) ($field['type'] ?? 'text')),
                    'required' => (bool) ($field['required'] ?? false),
                    'sectionKey' => $section->section_key,
                    'sortOrder' => (int) ($field['order'] ?? $index),
                    'options' => $field['options'] ?? [],
                    'placeholder' => $field['placeholder'] ?? '',
                    'helpText' => $field['helpText'] ?? '',
                    'showOnRegistration' => (bool) ($field['showOnRegistration'] ?? true),
                    'source' => 'custom',
                ]);
            }
        });

        $this->forgetCache($tenant, $definition->form_key);

        return $this->legacyDefinitions($tenant, $entity);
    }

    public function migrateLegacyTenantSettings(Tenant $tenant): void
    {
        foreach (['student' => 'students', 'staff' => 'staff'] as $entity => $pathKey) {
            $legacy = data_get($tenant->settings, "registration.custom_fields.{$pathKey}", []);
            if (! is_array($legacy) || $legacy === []) {
                continue;
            }

            $this->saveLegacyDefinitions($tenant, $entity, $legacy);
            $settings = $tenant->settings ?? [];
            data_set($settings, "registration.custom_fields.{$pathKey}", []);
            $tenant->update(['settings' => $settings]);
        }
    }

    private function ensureForm(Tenant $tenant, string $formKey): FormDefinition
    {
        $cacheKey = $this->cacheKey($tenant, $formKey, 'definition_id');

        $definitionId = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($tenant, $formKey): ?int {
            return FormDefinition::query()
                ->where('tenant_id', $tenant->id)
                ->where('form_key', $formKey)
                ->value('id');
        });

        if ($definitionId) {
            $definition = FormDefinition::query()
                ->with(['sections.placements.fieldDefinition'])
                ->findOrFail($definitionId);
            $this->syncDefaultFields($tenant, $definition);

            return $definition->fresh(['sections.placements.fieldDefinition']);
        }

        return $this->bootstrapForm($tenant, $formKey);
    }

    private function bootstrapForm(Tenant $tenant, string $formKey): FormDefinition
    {
        $catalog = FormCatalog::assertExists($formKey);

        return DB::transaction(function () use ($tenant, $catalog, $formKey): FormDefinition {
            $definition = FormDefinition::query()->create([
                'tenant_id' => $tenant->id,
                'form_key' => $formKey,
                'name' => $catalog['name'],
                'category' => $catalog['category'],
                'status' => 'published',
                'version' => 1,
            ]);

            foreach ($catalog['sections'] as $index => $section) {
                FormSection::query()->create([
                    'tenant_id' => $tenant->id,
                    'form_definition_id' => $definition->id,
                    'section_key' => $section['key'],
                    'name' => $section['name'],
                    'sort_order' => $index,
                    'is_customizable' => true,
                ]);
            }

            $sections = $definition->sections()->get()->keyBy('section_key');
            foreach (FormCatalog::defaultFields($formKey) as $index => $field) {
                $fieldDefinition = FieldDefinition::query()->firstOrCreate(
                    ['tenant_id' => $tenant->id, 'field_key' => $field['key']],
                    [
                        'label' => $field['label'],
                        'answer_type' => $field['answerType'],
                        'source' => 'system',
                        'options' => $field['options'],
                    ],
                );
                $section = $sections->get($field['section']);
                if ($section) {
                    FormFieldPlacement::query()->create([
                        'tenant_id' => $tenant->id,
                        'form_definition_id' => $definition->id,
                        'form_section_id' => $section->id,
                        'field_definition_id' => $fieldDefinition->id,
                        'sort_order' => $index,
                        'required' => $field['required'],
                        'visible' => true,
                        'lock_level' => $field['required'] ? FormCatalog::LOCK_SYSTEM_REQUIRED : FormCatalog::LOCK_SYSTEM_OPTIONAL,
                    ]);
                }
            }

            $this->forgetCache($tenant, $formKey);

            return $definition->fresh(['sections.placements.fieldDefinition']);
        });
    }

    private function syncDefaultFields(Tenant $tenant, FormDefinition $definition): void
    {
        $sections = $definition->sections()->get()->keyBy('section_key');
        foreach (FormCatalog::defaultFields($definition->form_key) as $index => $field) {
            $section = $sections->get($field['section']);
            if (! $section) {
                continue;
            }
            $fieldDefinition = FieldDefinition::query()->firstOrCreate(
                ['tenant_id' => $tenant->id, 'field_key' => $field['key']],
                ['label' => $field['label'], 'answer_type' => $field['answerType'], 'source' => 'system', 'options' => $field['options']],
            );
            FormFieldPlacement::query()->firstOrCreate(
                ['form_definition_id' => $definition->id, 'field_definition_id' => $fieldDefinition->id],
                [
                    'tenant_id' => $tenant->id,
                    'form_section_id' => $section->id,
                    'sort_order' => $index,
                    'required' => $field['required'],
                    'visible' => true,
                    'lock_level' => $field['required'] ? FormCatalog::LOCK_SYSTEM_REQUIRED : FormCatalog::LOCK_SYSTEM_OPTIONAL,
                ],
            );
        }
    }

    private function serializeForm(FormDefinition $definition, bool $forRender): array
    {
        $definition->loadMissing(['sections.placements.fieldDefinition']);

        $sections = $definition->sections
            ->sortBy('sort_order')
            ->values()
            ->map(function (FormSection $section) use ($forRender): array {
                $fields = $section->placements
                    ->sortBy('sort_order')
                    ->values()
                    ->map(fn (FormFieldPlacement $placement) => $this->serializePlacement($placement, $forRender))
                    ->filter(fn (array $field): bool => $forRender
                        ? (bool) ($field['visible'] ?? true) && $this->roleAllowed((array) ($field['permissions'] ?? []), 'viewRoles')
                        : true)
                    ->values()
                    ->all();

                return [
                    'id' => $section->id,
                    'key' => $section->section_key,
                    'name' => $section->name,
                    'sortOrder' => $section->sort_order,
                    'isCustomizable' => (bool) $section->is_customizable,
                    'fields' => $fields,
                ];
            })
            ->all();

        return [
            'key' => $definition->form_key,
            'name' => $definition->name,
            'category' => $definition->category,
            'status' => $definition->status,
            'version' => $definition->version,
            'sections' => $sections,
        ];
    }

    private function serializePlacement(FormFieldPlacement $placement, bool $forRender = false): array
    {
        $placement->loadMissing(['fieldDefinition', 'formSection']);
        $field = $placement->fieldDefinition;
        $config = array_merge($field->config ?? [], $placement->overrides ?? []);

        return [
            'id' => $placement->id,
            'fieldId' => $field->id,
            'key' => $field->field_key,
            'label' => $config['label'] ?? $field->label,
            'answerType' => $field->answer_type,
            'source' => $field->source,
            'templateKey' => $field->template_key,
            'required' => (bool) $placement->required,
            'visible' => (bool) $placement->visible,
            'lockLevel' => $placement->lock_level,
            'sectionKey' => $placement->formSection?->section_key,
            'sectionName' => $placement->formSection?->name,
            'sortOrder' => $placement->sort_order,
            'options' => $field->options ?? [],
            'placeholder' => (string) ($config['placeholder'] ?? ''),
            'helpText' => (string) ($config['helpText'] ?? ''),
            'sensitive' => (bool) ($config['sensitive'] ?? false),
            'showOnRegistration' => (bool) ($config['showOnRegistration'] ?? true),
            'includeInReports' => (bool) ($config['includeInReports'] ?? false),
            'includeInDownloads' => (bool) ($config['includeInDownloads'] ?? false),
            'requiredForCompletion' => (bool) ($config['requiredForCompletion'] ?? false),
            'permissions' => $placement->permissions ?? ($config['permissions'] ?? null),
            'conditionalRules' => $placement->conditional_rules ?? ($config['conditionalRules'] ?? []),
            'systemMessage' => $this->systemMessage($placement->lock_level),
        ];
    }

    private function systemMessage(string $lockLevel): ?string
    {
        return match ($lockLevel) {
            FormCatalog::LOCK_SYSTEM_REQUIRED => 'Required by Skuggle',
            FormCatalog::LOCK_SYSTEM_OPTIONAL => 'Provided by Skuggle',
            default => null,
        };
    }

    /**
     * @param  list<array<string, mixed>>  $sections
     */
    private function applySectionUpdates(Tenant $tenant, FormDefinition $definition, array $sections): void
    {
        foreach ($sections as $index => $section) {
            if (! is_array($section)) {
                continue;
            }

            if (! empty($section['id'])) {
                $model = FormSection::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('form_definition_id', $definition->id)
                    ->find((int) $section['id']);
                if ($model && $model->is_customizable) {
                    $model->update([
                        'name' => trim((string) ($section['name'] ?? $model->name)),
                        'sort_order' => (int) ($section['sortOrder'] ?? $index),
                    ]);
                }

                continue;
            }

            $name = trim((string) ($section['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            FormSection::query()->create([
                'tenant_id' => $tenant->id,
                'form_definition_id' => $definition->id,
                'section_key' => Str::slug($name, '_'),
                'name' => $name,
                'sort_order' => (int) ($section['sortOrder'] ?? $index),
                'is_customizable' => true,
            ]);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     */
    private function applyFieldUpdates(Tenant $tenant, FormDefinition $definition, array $fields): void
    {
        if (count($fields) > self::MAX_FIELDS_PER_FORM) {
            throw new ApiException('VALIDATION_ERROR', 'Too many fields on this form.', 422);
        }

        $sectionMap = $definition->sections()->get()->keyBy('section_key');

        foreach ($fields as $index => $field) {
            if (! is_array($field)) {
                continue;
            }

            $placement = null;
            if (! empty($field['id'])) {
                $placement = FormFieldPlacement::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('form_definition_id', $definition->id)
                    ->find((int) $field['id']);
            }

            if ($placement && $placement->lock_level === FormCatalog::LOCK_SYSTEM_REQUIRED) {
                $placement->update([
                    'sort_order' => (int) ($field['sortOrder'] ?? $placement->sort_order),
                ]);

                continue;
            }

            if ($placement) {
                $sectionKey = (string) ($field['sectionKey'] ?? $placement->formSection?->section_key ?? 'additional');
                $section = $sectionMap->get($sectionKey) ?? $placement->formSection;
                $placement->update([
                    'form_section_id' => $section?->id ?? $placement->form_section_id,
                    'sort_order' => (int) ($field['sortOrder'] ?? $index),
                    'required' => (bool) ($field['required'] ?? $placement->required),
                    'visible' => (bool) ($field['visible'] ?? $placement->visible),
                    'permissions' => $field['permissions'] ?? $placement->permissions,
                    'conditional_rules' => $field['conditionalRules'] ?? $placement->conditional_rules,
                    'overrides' => array_merge($placement->overrides ?? [], array_filter([
                        'placeholder' => $field['placeholder'] ?? null,
                        'helpText' => $field['helpText'] ?? null,
                        'showOnRegistration' => array_key_exists('showOnRegistration', $field) ? (bool) $field['showOnRegistration'] : null,
                        'includeInReports' => array_key_exists('includeInReports', $field) ? (bool) $field['includeInReports'] : null,
                        'includeInDownloads' => array_key_exists('includeInDownloads', $field) ? (bool) $field['includeInDownloads'] : null,
                        'requiredForCompletion' => array_key_exists('requiredForCompletion', $field) ? (bool) $field['requiredForCompletion'] : null,
                        'sensitive' => array_key_exists('sensitive', $field) ? (bool) $field['sensitive'] : null,
                    ], fn ($v) => $v !== null)),
                ]);

                if (($field['label'] ?? null) && $placement->fieldDefinition?->source === 'custom') {
                    $placement->fieldDefinition->update(['label' => trim((string) $field['label'])]);
                }

                continue;
            }

            $this->addField($tenant, $definition->form_key, array_merge($field, ['sortOrder' => $field['sortOrder'] ?? $index]));
        }
    }

    /**
     * @param  array<string, mixed>  $field
     */
    private function resolveOrCreateFieldDefinition(Tenant $tenant, array $field): FieldDefinition
    {
        $templateKey = (string) ($field['templateKey'] ?? '');
        if ($templateKey !== '') {
            $template = FieldTemplateLibrary::get($templateKey);
            if ($template === null) {
                throw new ApiException('VALIDATION_ERROR', 'Unknown field template.', 422);
            }

            return FieldDefinition::query()->firstOrCreate(
                ['tenant_id' => $tenant->id, 'field_key' => $templateKey],
                [
                    'label' => $template['label'],
                    'answer_type' => $template['answerType'],
                    'source' => 'platform',
                    'template_key' => $templateKey,
                    'options' => $template['options'] ?? [],
                    'config' => ['sensitive' => (bool) ($template['sensitive'] ?? false)],
                ],
            );
        }

        $label = trim((string) ($field['label'] ?? ''));
        if ($label === '') {
            throw new ApiException('VALIDATION_ERROR', 'Field label is required.', 422);
        }

        $key = Str::slug((string) ($field['key'] ?? $label), '_');
        if ($key === '' || ! preg_match('/^[a-z][a-z0-9_]{1,63}$/', $key)) {
            throw new ApiException('VALIDATION_ERROR', 'Field key is invalid.', 422);
        }

        $answerType = (string) ($field['answerType'] ?? AnswerTypes::SHORT_ANSWER);
        if (! in_array($answerType, AnswerTypes::all(), true)) {
            throw new ApiException('VALIDATION_ERROR', 'Unsupported answer type.', 422);
        }

        $options = collect($field['options'] ?? [])
            ->map(fn ($option) => trim((string) $option))
            ->filter()
            ->unique()
            ->take(self::MAX_OPTIONS)
            ->values()
            ->all();

        if ($answerType === AnswerTypes::CHOOSE_ONE && $options === []) {
            throw new ApiException('VALIDATION_ERROR', 'Choose One fields require at least one option.', 422);
        }

        return FieldDefinition::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'field_key' => $key],
            [
                'label' => $label,
                'answer_type' => $answerType,
                'source' => (string) ($field['source'] ?? 'custom'),
                'options' => $options,
                'config' => array_filter([
                    'placeholder' => trim((string) ($field['placeholder'] ?? '')),
                    'helpText' => trim((string) ($field['helpText'] ?? '')),
                    'sensitive' => (bool) ($field['sensitive'] ?? false),
                    'showOnRegistration' => (bool) ($field['showOnRegistration'] ?? true),
                    'includeInReports' => (bool) ($field['includeInReports'] ?? false),
                    'includeInDownloads' => (bool) ($field['includeInDownloads'] ?? false),
                    'requiredForCompletion' => (bool) ($field['requiredForCompletion'] ?? false),
                ], fn ($value) => $value !== '' && $value !== false),
            ],
        );
    }

    private function resolveSection(Tenant $tenant, FormDefinition $definition, string $sectionKey): FormSection
    {
        $section = FormSection::query()
            ->where('tenant_id', $tenant->id)
            ->where('form_definition_id', $definition->id)
            ->where('section_key', $sectionKey)
            ->first();

        if ($section) {
            return $section;
        }

        return FormSection::query()->create([
            'tenant_id' => $tenant->id,
            'form_definition_id' => $definition->id,
            'section_key' => $sectionKey,
            'name' => Str::headline(str_replace('_', ' ', $sectionKey)),
            'sort_order' => 999,
            'is_customizable' => true,
        ]);
    }

    private function castValue(string $answerType, mixed $raw, array $field): mixed
    {
        $label = (string) ($field['label'] ?? 'Field');

        return match ($answerType) {
            AnswerTypes::NUMBER, AnswerTypes::CURRENCY, AnswerTypes::PERCENTAGE => $this->castNumber($raw, $label),
            AnswerTypes::DATE, AnswerTypes::DATE_TIME => $this->castDate($raw, $label),
            AnswerTypes::YES_NO => filter_var($raw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $raw,
            AnswerTypes::CHOOSE_ONE => $this->castSelect($raw, (array) ($field['options'] ?? []), $label),
            AnswerTypes::CHOOSE_MANY => $this->castMany($raw, (array) ($field['options'] ?? []), $label),
            default => $this->castText($raw, $label),
        };
    }

    /** @param list<array<string, mixed>> $rules @param array<string, mixed> $values */
    private function conditionsMatch(array $rules, array $values): bool
    {
        foreach ($rules as $rule) {
            $sourceKey = (string) ($rule['fieldKey'] ?? $rule['field'] ?? '');
            if ($sourceKey === '') {
                continue;
            }
            $actual = $values[$sourceKey] ?? null;
            $expected = $rule['value'] ?? null;
            $matches = match ((string) ($rule['operator'] ?? 'is')) {
                'is_not' => (string) $actual !== (string) $expected,
                'contains' => str_contains(mb_strtolower((string) $actual), mb_strtolower((string) $expected)),
                'is_empty' => $actual === null || $actual === '',
                'is_not_empty' => $actual !== null && $actual !== '',
                default => (string) $actual === (string) $expected,
            };
            if (! $matches) {
                return false;
            }
        }

        return true;
    }

    /** @param array<string, mixed> $permissions */
    private function roleAllowed(array $permissions, string $key): bool
    {
        $roles = $permissions[$key] ?? [];
        if (! is_array($roles) || $roles === []) {
            return true;
        }
        $membership = request()?->attributes->get('membership');
        $role = $membership?->role?->name;

        return is_string($role) && in_array($role, $roles, true);
    }

    private function castText(mixed $raw, string $label): string
    {
        $value = trim((string) $raw);
        if ($value === '') {
            throw new \InvalidArgumentException("{$label} cannot be empty.");
        }
        if (mb_strlen($value) > 500) {
            throw new \InvalidArgumentException("{$label} is too long.");
        }

        return $value;
    }

    private function castNumber(mixed $raw, string $label): float|int
    {
        if (! is_numeric($raw)) {
            throw new \InvalidArgumentException("{$label} must be a number.");
        }

        return str_contains((string) $raw, '.') ? (float) $raw : (int) $raw;
    }

    private function castDate(mixed $raw, string $label): string
    {
        $value = trim((string) $raw);
        if ($value === '' || strtotime($value) === false) {
            throw new \InvalidArgumentException("{$label} must be a valid date.");
        }

        return date('Y-m-d', strtotime($value));
    }

    /**
     * @param  list<string>  $options
     */
    private function castSelect(mixed $raw, array $options, string $label): string
    {
        $value = trim((string) $raw);
        if ($value === '') {
            throw new \InvalidArgumentException("{$label} must be selected.");
        }
        if ($options !== [] && ! in_array($value, $options, true)) {
            throw new \InvalidArgumentException("{$label} contains an invalid option.");
        }

        return $value;
    }

    /** @param list<string> $options @return list<string> */
    private function castMany(mixed $raw, array $options, string $label): array
    {
        $values = is_array($raw) ? $raw : explode(',', (string) $raw);
        $values = collect($values)->map(fn ($value) => trim((string) $value))->filter()->unique()->values()->all();
        if ($values === []) {
            throw new \InvalidArgumentException("{$label} must be selected.");
        }
        if ($options !== [] && array_diff($values, $options) !== []) {
            throw new \InvalidArgumentException("{$label} contains an invalid option.");
        }

        return $values;
    }

    private function legacyToAnswerType(string $legacyType): string
    {
        return match ($legacyType) {
            'number' => AnswerTypes::NUMBER,
            'date' => AnswerTypes::DATE,
            'boolean' => AnswerTypes::YES_NO,
            'select' => AnswerTypes::CHOOSE_ONE,
            default => AnswerTypes::SHORT_ANSWER,
        };
    }

    private function categoryLabel(string $category): string
    {
        return match ($category) {
            'people' => 'People',
            'admissions' => 'Admissions',
            'academics' => 'Academics',
            default => Str::headline($category),
        };
    }

    private function cacheKey(Tenant $tenant, string $formKey, string $suffix): string
    {
        return "tenant:{$tenant->id}:form:{$formKey}:{$suffix}";
    }

    private function forgetCache(Tenant $tenant, string $formKey): void
    {
        Cache::forget($this->cacheKey($tenant, $formKey, 'definition_id'));
    }
}
