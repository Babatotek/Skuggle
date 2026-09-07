<?php

namespace App\Services;

use App\Domain\Authorization\PermissionRegistry;
use App\Models\Permission;

final class PermissionRegistrySynchronizer
{
    /** @return array{created:int,updated:int,unknown:list<array{key:string,classification:string}>} */
    public function sync(): array
    {
        $created = 0;
        $updated = 0;
        foreach (PermissionRegistry::definitions() as $key => $definition) {
            $permission = Permission::query()->firstOrNew(['name' => $key]);
            $wasNew = ! $permission->exists;
            $description = $definition['description'];
            if ($permission->description !== $description) {
                $permission->description = $description;
                $updated += $wasNew ? 0 : 1;
            }
            $permission->save();
            $created += $wasNew ? 1 : 0;
        }

        $known = array_merge(array_keys(PermissionRegistry::definitions()), array_keys(PermissionRegistry::aliases()));
        $unknown = Permission::query()->whereNotIn('name', $known)->orderBy('name')->pluck('name')->map(fn (string $key) => [
            'key' => $key,
            'classification' => str_starts_with($key, 'custom.') || str_starts_with($key, 'manual.')
                ? 'MANUAL/CUSTOM'
                : (preg_match('/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/', $key) ? 'UNMAPPED' : 'INVALID'),
        ])->all();

        return compact('created', 'updated', 'unknown');
    }
}
