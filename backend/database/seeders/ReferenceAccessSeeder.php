<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReferenceAccessSeeder extends Seeder
{
    public function run(): void
    {
        // Canonical rows are additive metadata only. Role grants below remain
        // unchanged until their explicit authorization migration wave.
        app(PermissionRegistrySynchronizer::class)->sync();

        $permissions = [
            'platform.view', 'tenants.manage', 'users.manage', 'settings.configure',
            'students.view', 'students.create', 'students.edit', 'students.import',
            'students.medical.view', 'students.medical.edit',
            'attendance.view', 'attendance.create', 'attendance.approve',
            'assessments.view', 'assessment.create', 'scores.edit', 'scores.approve',
            'assessment.smartmark.process', 'assessment.smartmark.review',
            'results.view', 'results.approve', 'results.publish',
            'reports.view', 'reports.export', 'finance.view', 'finance.manage',
            'library.view', 'library.create', 'library.annotate', 'library.assign',
            'library.version.manage', 'library.export', 'library.insights', 'ai.generate',
            'roles.manage', 'security.manage', 'audit.view',
            'admissions.manage',
            'admissions.application.view', 'admissions.application.create', 'admissions.application.update',
            'admissions.screening.manage', 'admissions.decision.manage', 'admissions.enrolment.convert',
            'admissions.document.manage', 'admissions.settings.update',
            'communication.send', 'operations.manage', 'services.manage', 'learning.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::query()->updateOrCreate(['name' => $permission], ['description' => null]);
        }

        $roleMap = [
            'platform_super_admin' => $permissions,
            'proprietor' => array_diff($permissions, ['platform.view', 'tenants.manage']),
            'director' => ['students.view', 'attendance.view', 'assessments.view', 'results.view', 'results.approve', 'results.publish', 'reports.view', 'reports.export', 'finance.view', 'library.view', 'library.insights'],
            'principal' => [
                'students.view', 'attendance.view', 'attendance.approve', 'assessments.view', 'scores.approve',
                'results.view', 'results.approve', 'results.publish', 'reports.view', 'reports.export',
                'finance.view', 'library.view', 'library.insights', 'services.manage', 'communication.send',
                'admissions.manage',
                'admissions.application.view', 'admissions.application.create', 'admissions.application.update',
                'admissions.screening.manage', 'admissions.decision.manage', 'admissions.enrolment.convert',
                'admissions.document.manage', 'admissions.settings.update',
            ],
            'head_teacher' => ['students.view', 'attendance.view', 'attendance.approve', 'assessments.view', 'scores.approve', 'results.view', 'results.approve', 'reports.view', 'library.view', 'library.insights'],
            'school_super_admin' => array_diff($permissions, ['platform.view', 'tenants.manage']),
            'school_admin' => [
                'students.view', 'students.create', 'students.edit', 'students.import',
                'students.medical.view', 'students.medical.edit',
                'attendance.view', 'attendance.create',
                    'assessments.view', 'assessment.create', 'scores.edit',
                    'assessment.smartmark.process', 'assessment.smartmark.review',
                    'results.view', 'reports.view', 'finance.view',
                'library.view', 'library.create', 'library.annotate', 'library.assign',
                'users.manage',
                'admissions.manage',
                'admissions.application.view', 'admissions.application.create', 'admissions.application.update',
                'admissions.screening.manage', 'admissions.decision.manage', 'admissions.enrolment.convert',
                'admissions.document.manage', 'admissions.settings.update',
                'communication.send', 'operations.manage', 'services.manage', 'learning.manage',
            ],
            'admission_officer' => [
                'students.view', 'students.create', 'students.edit', 'students.import',
                'students.medical.view', 'students.medical.edit', 'reports.view', 'admissions.manage',
                'admissions.application.view', 'admissions.application.create', 'admissions.application.update',
                'admissions.screening.manage', 'admissions.decision.manage', 'admissions.enrolment.convert',
                'admissions.document.manage', 'admissions.settings.update',
            ],
            'examination_officer' => ['students.view', 'assessments.view', 'assessment.create', 'scores.edit', 'scores.approve', 'assessment.smartmark.process', 'assessment.smartmark.review', 'results.view', 'results.approve', 'results.publish', 'reports.view', 'reports.export'],
            'bursar' => ['students.view', 'reports.view', 'reports.export', 'finance.view', 'finance.manage'],
            'teacher' => ['students.view', 'attendance.view', 'attendance.create', 'assessments.view', 'assessment.create', 'scores.edit', 'assessment.smartmark.process', 'assessment.smartmark.review', 'results.view', 'library.view', 'library.create', 'library.annotate', 'library.assign', 'library.version.manage', 'library.export', 'library.insights', 'ai.generate', 'learning.manage', 'communication.send'],
            'parent' => ['results.view', 'library.view'],
            'student' => ['assessments.view', 'assessment.cbt.attempt', 'results.view', 'library.view'],
        ];

        DB::transaction(function () use ($roleMap): void {
            foreach ($roleMap as $name => $rolePermissions) {
                $role = Role::query()->updateOrCreate(
                    ['name' => $name],
                    ['label' => $name === 'school_super_admin' ? 'Super Admin' : str($name)->replace('_', ' ')->title()->toString(), 'privileged' => in_array($name, ['platform_super_admin', 'proprietor', 'school_super_admin', 'bursar'], true)],
                );
                $ids = Permission::query()->whereIn('name', $rolePermissions)->pluck('id');
                $role->permissions()->sync($ids);
            }
        });
    }
}
