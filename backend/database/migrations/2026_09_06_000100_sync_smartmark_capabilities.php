<?php

use App\Models\Permission;
use App\Models\Role;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrySynchronizer::class)->sync();

        $ids = Permission::query()
            ->whereIn('name', ['assessment.smartmark.process', 'assessment.smartmark.review'])
            ->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        Role::query()
            ->whereIn('name', ['teacher', 'examination_officer', 'school_admin', 'school_super_admin', 'proprietor', 'platform_super_admin'])
            ->each(function (Role $role) use ($ids): void {
                $role->permissions()->syncWithoutDetaching($ids);
            });
    }

    public function down(): void
    {
        // Capability grants are additive; leave role assignments intact on rollback.
    }
};
