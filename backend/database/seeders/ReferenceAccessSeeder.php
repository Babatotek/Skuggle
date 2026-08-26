<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReferenceAccessSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'platform.view', 'tenants.manage', 'users.manage', 'settings.configure',
            'students.view', 'students.create', 'students.edit', 'students.import',
            'attendance.view', 'attendance.create', 'attendance.approve',
            'assessments.view', 'assessment.create', 'scores.edit', 'scores.approve',
            'results.view', 'results.approve', 'results.publish',
            'reports.view', 'reports.export', 'finance.view', 'finance.manage',
            'library.view', 'library.create', 'library.annotate', 'library.assign',
            'library.version.manage', 'library.export', 'library.insights', 'ai.generate',
        ];

        foreach ($permissions as $permission) {
            Permission::query()->updateOrCreate(['name' => $permission], ['description' => null]);
        }

        $roleMap = [
            'platform_super_admin' => $permissions,
            'proprietor' => array_diff($permissions, ['platform.view', 'tenants.manage']),
            'director' => ['students.view', 'attendance.view', 'assessments.view', 'results.view', 'results.approve', 'results.publish', 'reports.view', 'reports.export', 'finance.view', 'library.view', 'library.insights'],
            'principal' => ['students.view', 'attendance.view', 'attendance.approve', 'assessments.view', 'scores.approve', 'results.view', 'results.approve', 'results.publish', 'reports.view', 'reports.export', 'finance.view', 'library.view', 'library.insights'],
            'head_teacher' => ['students.view', 'attendance.view', 'attendance.approve', 'assessments.view', 'scores.approve', 'results.view', 'results.approve', 'reports.view', 'library.view', 'library.insights'],
            'school_admin' => array_diff($permissions, ['platform.view', 'tenants.manage']),
            'admission_officer' => ['students.view', 'students.create', 'students.edit', 'students.import', 'reports.view'],
            'examination_officer' => ['students.view', 'assessments.view', 'assessment.create', 'scores.edit', 'scores.approve', 'results.view', 'results.approve', 'results.publish', 'reports.view', 'reports.export'],
            'bursar' => ['students.view', 'reports.view', 'reports.export', 'finance.view', 'finance.manage'],
            'teacher' => ['students.view', 'attendance.view', 'attendance.create', 'assessments.view', 'assessment.create', 'scores.edit', 'results.view', 'library.view', 'library.create', 'library.annotate', 'library.assign', 'library.version.manage', 'library.export', 'library.insights', 'ai.generate'],
            'parent' => ['results.view', 'library.view'],
            'student' => ['assessments.view', 'results.view', 'library.view'],
        ];

        DB::transaction(function () use ($roleMap): void {
            foreach ($roleMap as $name => $rolePermissions) {
                $role = Role::query()->updateOrCreate(
                    ['name' => $name],
                    ['label' => str($name)->replace('_', ' ')->title()->toString(), 'privileged' => in_array($name, ['platform_super_admin', 'proprietor', 'school_admin', 'bursar'], true)],
                );
                $ids = Permission::query()->whereIn('name', $rolePermissions)->pluck('id');
                $role->permissions()->sync($ids);
            }
        });
    }
}
