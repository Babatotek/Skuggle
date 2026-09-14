<?php

namespace App\Services;

use App\Domain\Authorization\PermissionRegistry;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantAccessRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Provisions the shared role templates as school-owned defaults for every tenant.
 * Copies stay editable/deletable per school; missing templates are not recreated
 * after the school has been provisioned once.
 */
final class TenantAccessRoleDefaults
{
    /** @var list<string> */
    public const TEMPLATE_KEYS = [
        'school_admin',
        'principal',
        'teacher',
        'bursar',
        'examination_officer',
        'admission_officer',
    ];

    public function ensureFor(Tenant $tenant): void
    {
        if ($tenant->type !== 'school') {
            return;
        }

        if (data_get($tenant->settings, 'access_roles.defaults_provisioned')) {
            return;
        }

        DB::transaction(function () use ($tenant): void {
            $locked = Tenant::query()->whereKey($tenant->getKey())->lockForUpdate()->first();
            if (! $locked || data_get($locked->settings, 'access_roles.defaults_provisioned')) {
                return;
            }

            foreach (self::TEMPLATE_KEYS as $templateKey) {
                $this->ensureTemplate($locked, $templateKey);
            }

            $settings = $locked->settings ?? [];
            data_set($settings, 'access_roles.defaults_provisioned', true);
            data_set($settings, 'access_roles.defaults_provisioned_at', now()->toIso8601String());
            $locked->update(['settings' => $settings]);
        });

        $tenant->refresh();
    }

    private function ensureTemplate(Tenant $tenant, string $templateKey): void
    {
        $exists = TenantAccessRole::query()
            ->where('tenant_id', $tenant->getKey())
            ->where('template_key', $templateKey)
            ->exists();
        if ($exists) {
            return;
        }

        $template = Role::query()->with('permissions')->where('name', $templateKey)->first();
        if (! $template) {
            return;
        }

        $name = trim((string) $template->label);
        if ($name === '' || $name === $template->name) {
            $name = Str::title(str_replace('_', ' ', $templateKey));
        }
        if (TenantAccessRole::query()->where('tenant_id', $tenant->getKey())->where('name', $name)->exists()) {
            TenantAccessRole::query()
                ->where('tenant_id', $tenant->getKey())
                ->where('name', $name)
                ->whereNull('template_key')
                ->update(['template_key' => $templateKey]);

            return;
        }

        $role = TenantAccessRole::query()->create([
            'name' => $name,
            'description' => $template->description ?: 'Default school access role from the shared '.$name.' template.',
            'category' => $this->categoryFor($templateKey),
            'template_key' => $templateKey,
        ]);

        $this->syncDelegablePermissions($role, $template->permissions->pluck('name')->all());
    }

    /** @param list<string> $permissionNames */
    public function syncDelegablePermissions(TenantAccessRole $role, array $permissionNames): array
    {
        $allowed = [];
        foreach ($permissionNames as $name) {
            $canonical = PermissionRegistry::canonicalFor($name) ?? $name;
            $definition = PermissionRegistry::definitions()[$canonical] ?? null;
            if (! $definition || ! ($definition['delegable'] ?? false) || str_starts_with($canonical, 'platform.')) {
                continue;
            }
            $permission = Permission::query()
                ->where(fn ($query) => $query->where('name', $canonical)->orWhere('name', $name))
                ->first();
            if ($permission) {
                $allowed[$permission->getKey()] = $permission->name;
            }
        }
        $role->permissions()->sync(array_keys($allowed));

        return array_values($allowed);
    }

    private function categoryFor(string $templateKey): string
    {
        return match ($templateKey) {
            'school_admin' => 'Administration',
            'principal' => 'Academic Leadership',
            'teacher' => 'Teaching',
            'bursar' => 'Finance',
            'examination_officer', 'admission_officer' => 'Student Services',
            default => 'Custom',
        };
    }
}
