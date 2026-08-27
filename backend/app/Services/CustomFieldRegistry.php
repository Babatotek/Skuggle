<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Tenant;
use Illuminate\Support\Str;

final class CustomFieldRegistry
{
    public const ENTITY_STUDENT = 'student';

    public const ENTITY_STAFF = 'staff';

    private const ENTITIES = [self::ENTITY_STUDENT, self::ENTITY_STAFF];

    private const TYPES = ['text', 'number', 'date', 'select', 'boolean'];

    private const MAX_FIELDS = 50;

    private const MAX_OPTIONS = 30;

    /** @return list<string> */
    public static function entities(): array
    {
        return self::ENTITIES;
    }

    /** @return list<array<string, mixed>> */
    public function definitions(Tenant $tenant, string $entity, bool $registrationOnly = false): array
    {
        $this->assertEntity($entity);
        $fields = data_get($tenant->settings, $this->settingsPath($entity), []);
        if (! is_array($fields)) {
            return [];
        }

        $normalized = $this->normalizeDefinitions($fields, false);
        if ($registrationOnly) {
            return array_values(array_filter(
                $normalized,
                fn (array $field): bool => (bool) ($field['showOnRegistration'] ?? true),
            ));
        }

        return $normalized;
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return list<array<string, mixed>>
     */
    public function saveDefinitions(Tenant $tenant, string $entity, array $fields): array
    {
        $this->assertEntity($entity);
        $normalized = $this->normalizeDefinitions($fields, true);
        $settings = $tenant->settings ?? [];
        data_set($settings, $this->settingsPath($entity), $normalized);
        $tenant->update(['settings' => $settings]);

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function validateValues(
        Tenant $tenant,
        string $entity,
        array $values,
        bool $registrationOnly = false,
    ): array {
        $definitions = $this->definitions($tenant, $entity, $registrationOnly);
        $errors = [];
        $stored = [];

        foreach ($definitions as $field) {
            $key = (string) $field['key'];
            $label = (string) $field['label'];
            $type = (string) $field['type'];
            $required = (bool) $field['required'];
            $hasValue = array_key_exists($key, $values) && $values[$key] !== null && $values[$key] !== '';

            if (! $hasValue) {
                if ($required) {
                    $errors["customFields.{$key}"] = ["{$label} is required."];
                }

                continue;
            }

            $raw = $values[$key];
            try {
                $stored[$key] = $this->castValue($type, $raw, $field);
            } catch (\InvalidArgumentException $exception) {
                $errors["customFields.{$key}"] = [$exception->getMessage()];
            }
        }

        foreach (array_keys($values) as $key) {
            if (! in_array($key, array_column($definitions, 'key'), true)) {
                $errors["customFields.{$key}"] = ['This field is not configured for your school.'];
            }
        }

        if ($errors !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Custom field information is invalid.', 422, $errors);
        }

        return $stored;
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return list<array<string, mixed>>
     */
    private function normalizeDefinitions(array $fields, bool $strict): array
    {
        if (count($fields) > self::MAX_FIELDS) {
            throw new ApiException(
                'VALIDATION_ERROR',
                'A maximum of '.self::MAX_FIELDS.' custom fields is allowed.',
                422,
                ['fields' => ['Too many custom fields.']],
            );
        }

        $normalized = [];
        $keys = [];

        foreach ($fields as $index => $field) {
            if (! is_array($field)) {
                throw new ApiException('VALIDATION_ERROR', 'Each custom field must be an object.', 422);
            }

            $label = trim((string) ($field['label'] ?? ''));
            if ($label === '') {
                throw new ApiException('VALIDATION_ERROR', 'Custom field label is required.', 422, [
                    "fields.{$index}.label" => ['Label is required.'],
                ]);
            }

            $key = Str::slug((string) ($field['key'] ?? $label), '_');
            if ($key === '' || ! preg_match('/^[a-z][a-z0-9_]{1,63}$/', $key)) {
                throw new ApiException('VALIDATION_ERROR', 'Custom field key is invalid.', 422, [
                    "fields.{$index}.key" => ['Use lowercase letters, numbers, and underscores.'],
                ]);
            }

            if (in_array($key, $keys, true)) {
                throw new ApiException('VALIDATION_ERROR', 'Duplicate custom field keys are not allowed.', 422, [
                    "fields.{$index}.key" => ['This key is already used.'],
                ]);
            }
            $keys[] = $key;

            $type = (string) ($field['type'] ?? 'text');
            if (! in_array($type, self::TYPES, true)) {
                throw new ApiException('VALIDATION_ERROR', 'Unsupported custom field type.', 422, [
                    "fields.{$index}.type" => ['Type must be text, number, date, select, or boolean.'],
                ]);
            }

            $options = [];
            if ($type === 'select') {
                $options = collect($field['options'] ?? [])
                    ->map(fn ($option) => trim((string) $option))
                    ->filter()
                    ->unique()
                    ->values()
                    ->take(self::MAX_OPTIONS)
                    ->all();
                if ($strict && $options === []) {
                    throw new ApiException('VALIDATION_ERROR', 'Select fields require at least one option.', 422, [
                        "fields.{$index}.options" => ['Add at least one option.'],
                    ]);
                }
            }

            $normalized[] = [
                'key' => $key,
                'label' => $label,
                'type' => $type,
                'required' => (bool) ($field['required'] ?? false),
                'section' => trim((string) ($field['section'] ?? 'Additional Information')) ?: 'Additional Information',
                'placeholder' => trim((string) ($field['placeholder'] ?? '')),
                'helpText' => trim((string) ($field['helpText'] ?? '')),
                'showOnRegistration' => (bool) ($field['showOnRegistration'] ?? true),
                'order' => (int) ($field['order'] ?? $index),
                'options' => $options,
            ];
        }

        usort($normalized, fn (array $a, array $b): int => ($a['order'] <=> $b['order']) ?: strcmp($a['label'], $b['label']));

        return array_values($normalized);
    }

    private function castValue(string $type, mixed $raw, array $field): mixed
    {
        return match ($type) {
            'text' => $this->castText($raw, (string) $field['label']),
            'number' => $this->castNumber($raw, (string) $field['label']),
            'date' => $this->castDate($raw, (string) $field['label']),
            'boolean' => filter_var($raw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $raw,
            'select' => $this->castSelect($raw, (array) ($field['options'] ?? []), (string) $field['label']),
            default => throw new \InvalidArgumentException('Unsupported field type.'),
        };
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

    private function settingsPath(string $entity): string
    {
        return match ($entity) {
            self::ENTITY_STUDENT => 'registration.custom_fields.students',
            self::ENTITY_STAFF => 'registration.custom_fields.staff',
            default => throw new \InvalidArgumentException('Unknown entity.'),
        };
    }

    private function assertEntity(string $entity): void
    {
        if (! in_array($entity, self::ENTITIES, true)) {
            throw new ApiException('VALIDATION_ERROR', 'Unknown custom field entity.', 422);
        }
    }
}
