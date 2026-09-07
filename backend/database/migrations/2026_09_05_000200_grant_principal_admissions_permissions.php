<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            'admissions.manage',
            'admissions.application.view',
            'admissions.application.create',
            'admissions.application.update',
            'admissions.screening.manage',
            'admissions.decision.manage',
            'admissions.enrolment.convert',
            'admissions.document.manage',
            'admissions.settings.update',
        ];

        foreach ($permissions as $name) {
            DB::table('permissions')->updateOrInsert(['name' => $name], ['description' => null]);
        }

        $roleId = DB::table('roles')->where('name', 'principal')->value('id');
        if (! $roleId) {
            return;
        }

        foreach ($permissions as $permission) {
            $permissionId = DB::table('permissions')->where('name', $permission)->value('id');
            if (! $permissionId) {
                continue;
            }
            DB::table('role_permission')->insertOrIgnore([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
            ]);
        }
    }

    public function down(): void
    {
        $roleId = DB::table('roles')->where('name', 'principal')->value('id');
        if (! $roleId) {
            return;
        }

        $permissionIds = DB::table('permissions')
            ->whereIn('name', [
                'admissions.manage',
                'admissions.application.view',
                'admissions.application.create',
                'admissions.application.update',
                'admissions.screening.manage',
                'admissions.decision.manage',
                'admissions.enrolment.convert',
                'admissions.document.manage',
                'admissions.settings.update',
            ])
            ->pluck('id');

        if ($permissionIds->isEmpty()) {
            return;
        }

        DB::table('role_permission')
            ->where('role_id', $roleId)
            ->whereIn('permission_id', $permissionIds)
            ->delete();
    }
};
