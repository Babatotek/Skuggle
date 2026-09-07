<?php

namespace App\Services;

use App\Domain\Forms\FormCatalog;
use App\Exceptions\ApiException;
use App\Models\Tenant;

/**
 * Backward-compatible facade over the platform Form Engine.
 */
final class CustomFieldRegistry
{
    public const ENTITY_STUDENT = 'student';

    public const ENTITY_STAFF = 'staff';

    private const ENTITIES = [self::ENTITY_STUDENT, self::ENTITY_STAFF];

    public function __construct(
        private readonly FormEngineService $forms,
    ) {}

    /** @return list<string> */
    public static function entities(): array
    {
        return self::ENTITIES;
    }

    /** @return list<array<string, mixed>> */
    public function definitions(Tenant $tenant, string $entity, bool $registrationOnly = false): array
    {
        $this->assertEntity($entity);
        $this->forms->migrateLegacyTenantSettings($tenant);

        return $this->forms->legacyDefinitions($tenant, $entity, $registrationOnly);
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return list<array<string, mixed>>
     */
    public function saveDefinitions(Tenant $tenant, string $entity, array $fields): array
    {
        $this->assertEntity($entity);

        return $this->forms->saveLegacyDefinitions($tenant, $entity, $fields);
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
        $this->assertEntity($entity);
        $formKey = FormCatalog::legacyEntityToFormKey($entity);
        if ($formKey === null) {
            return [];
        }

        return $this->forms->validateValues($tenant, $formKey, $values, $registrationOnly);
    }

    private function assertEntity(string $entity): void
    {
        if (! in_array($entity, self::ENTITIES, true)) {
            throw new ApiException('VALIDATION_ERROR', 'Unknown custom field entity.', 422);
        }
    }
}
