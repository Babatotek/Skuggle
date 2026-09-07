<?php

namespace Tests\Support;

use App\Domain\Tenancy\TenantContext;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Student;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Support\Str;

trait CreatesTenantUsers
{
    protected function seedAccessControl(): void
    {
        $permissions = [
            'students.view', 'students.create', 'students.edit', 'students.import',
            'students.medical.view', 'students.medical.edit',
            'attendance.view', 'attendance.create',
            'assessments.view', 'assessment.create', 'scores.edit', 'results.view',
            'assessment.smartmark.process', 'assessment.smartmark.review',
            'results.approve', 'results.publish',
            'reports.view', 'reports.export', 'finance.view', 'finance.manage',
            'library.view', 'library.create', 'ai.generate', 'settings.configure', 'users.manage',
            'roles.manage', 'security.manage', 'audit.view',
            'admissions.manage',
            'admissions.application.view', 'admissions.application.create', 'admissions.application.update',
            'admissions.screening.manage', 'admissions.decision.manage', 'admissions.enrolment.convert',
            'admissions.document.manage', 'admissions.settings.update',
            'communication.send', 'operations.manage', 'services.manage', 'learning.manage',
            'assessment.cbt.attempt',
        ];

        foreach ($permissions as $name) {
            Permission::query()->firstOrCreate(['name' => $name], ['description' => null]);
        }

        foreach ([
            'school_super_admin' => [
                'privileged' => true,
                'permissions' => array_merge($permissions, ['roles.manage', 'security.manage', 'audit.view']),
            ],
            'school_admin' => [
                'privileged' => false,
                'permissions' => [
                    'students.view', 'students.create', 'students.edit', 'students.import',
                    'students.medical.view', 'students.medical.edit',
                    'attendance.view', 'attendance.create',
                    'assessments.view', 'assessment.create', 'scores.edit',
                    'assessment.smartmark.process', 'assessment.smartmark.review',
                    'results.view', 'reports.view', 'finance.view', 'users.manage',
                    'library.view',
                    'admissions.manage',
                    'admissions.application.view', 'admissions.application.create', 'admissions.application.update',
                    'admissions.screening.manage', 'admissions.decision.manage', 'admissions.enrolment.convert',
                    'admissions.document.manage', 'admissions.settings.update',
                    'communication.send', 'operations.manage', 'services.manage', 'learning.manage',
                ],
            ],
            'admission_officer' => [
                'privileged' => false,
                'permissions' => [
                    'students.view', 'students.create', 'students.edit', 'students.import',
                    'admissions.application.view', 'admissions.application.create', 'admissions.application.update',
                    'admissions.screening.manage', 'admissions.decision.manage', 'admissions.enrolment.convert',
                    'admissions.document.manage', 'admissions.settings.update',
                ],
            ],
            'examination_officer' => [
                'privileged' => false,
                'permissions' => [
                    'students.view', 'assessments.view', 'assessment.create', 'scores.edit',
                    'assessment.smartmark.process', 'assessment.smartmark.review',
                    'results.view', 'results.approve', 'results.publish', 'reports.view', 'reports.export',
                ],
            ],
            'teacher' => ['privileged' => false, 'permissions' => ['students.view', 'attendance.view', 'attendance.create', 'assessments.view', 'assessment.create', 'scores.edit', 'assessment.smartmark.process', 'assessment.smartmark.review', 'results.view', 'library.view', 'ai.generate']],
            'student' => ['privileged' => false, 'permissions' => ['assessments.view', 'assessment.cbt.attempt', 'results.view', 'library.view']],
            'parent' => ['privileged' => false, 'permissions' => ['results.view', 'library.view']],
        ] as $roleName => $config) {
            $role = Role::query()->updateOrCreate(
                ['name' => $roleName],
                ['label' => $roleName, 'privileged' => $config['privileged']],
            );
            $role->permissions()->sync(Permission::query()->whereIn('name', $config['permissions'])->pluck('id'));
        }
    }

    /**
     * @return array{tenant: Tenant, user: User, membership: TenantMembership, role: Role}
     */
    protected function makeTenantUser(string $roleName = 'teacher', array $tenantOverrides = [], array $userOverrides = []): array
    {
        $this->seedAccessControl();

        $tenant = Tenant::query()->create(array_merge([
            'name' => 'School '.Str::random(6),
            'slug' => 'school-'.Str::lower(Str::random(8)),
            'code' => strtoupper(Str::random(8)),
            'status' => 'active',
            'quota_limits' => [
                'students' => 1000,
                'storage_bytes' => 5368709120,
                'ai_requests_per_day' => 5,
            ],
        ], $tenantOverrides));

        $user = User::factory()->create(array_merge([
            'status' => 'active',
            'email_verified_at' => now(),
        ], $userOverrides));

        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $membership = TenantMembership::query()->create([
            'tenant_id' => $tenant->getKey(),
            'user_id' => $user->getKey(),
            'role_id' => $role->getKey(),
            'status' => 'active',
            'joined_at' => now(),
        ]);

        return compact('tenant', 'user', 'membership', 'role');
    }

    protected function actingAsTenantUser(User $user, Tenant $tenant): static
    {
        return $this->actingAs($user, 'sanctum')
            ->withSession(['tenant_public_id' => $tenant->public_id])
            ->withHeader('X-Tenant-Id', (string) $tenant->public_id);
    }

    protected function makeStudentForTenant(Tenant $tenant, array $overrides = []): Student
    {
        $context = app(TenantContext::class);
        $context->set($tenant);
        try {
            return Student::query()->create(array_merge([
                'admission_number' => 'ADM-'.Str::upper(Str::random(6)),
                'first_name' => 'Ada',
                'last_name' => 'Okafor',
                'gender' => 'female',
                'status' => 'active',
                'admission_date' => now()->toDateString(),
                'date_of_birth' => now()->subYears(10)->toDateString(),
            ], $overrides));
        } finally {
            $context->clear();
        }
    }
}
