<?php

use App\Domain\Identity\SchoolRoles;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        foreach (['roles.manage', 'security.manage', 'audit.view'] as $name) {
            Permission::query()->firstOrCreate(['name' => $name], ['description' => null]);
        }

        $all = Permission::query()->pluck('name')->all();
        $superPermissions = SchoolRoles::schoolSuperAdminPermissions($all);

        $legacyOwner = Role::query()->where('name', SchoolRoles::SCHOOL_ADMIN)->first();
        $legacyAdmin = Role::query()->where('name', SchoolRoles::LEGACY_ADMIN)->first();

        $super = Role::query()->updateOrCreate(
            ['name' => SchoolRoles::SCHOOL_SUPER_ADMIN],
            ['label' => 'Super Admin', 'privileged' => true],
        );
        $super->permissions()->sync(Permission::query()->whereIn('name', $superPermissions)->pluck('id'));

        $ownerIds = collect([$legacyOwner?->getKey(), $legacyAdmin?->getKey()])->filter()->unique()->all();

        if ($ownerIds !== []) {
            DB::table('tenant_memberships')
                ->whereIn('role_id', $ownerIds)
                ->update(['role_id' => $super->getKey()]);

            if (Schema::hasTable('tenant_invitations')) {
                DB::table('tenant_invitations')
                    ->whereIn('role_id', $ownerIds)
                    ->where('status', 'pending')
                    ->update(['role_id' => $super->getKey()]);
            }
        }

        $officer = Role::query()->updateOrCreate(
            ['name' => SchoolRoles::SCHOOL_ADMIN],
            ['label' => 'School Admin', 'privileged' => false],
        );
        $officer->permissions()->sync(
            Permission::query()->whereIn('name', SchoolRoles::schoolAdminPermissions())->pluck('id'),
        );
    }

    public function down(): void
    {
        $super = Role::query()->where('name', SchoolRoles::SCHOOL_SUPER_ADMIN)->first();
        $officer = Role::query()->where('name', SchoolRoles::SCHOOL_ADMIN)->first();

        if ($super && $officer) {
            DB::table('tenant_memberships')
                ->where('role_id', $super->getKey())
                ->update(['role_id' => $officer->getKey()]);

            $officer->forceFill(['privileged' => true, 'label' => 'School Admin'])->save();
        }

        Role::query()->where('name', SchoolRoles::SCHOOL_SUPER_ADMIN)->delete();
    }
};
