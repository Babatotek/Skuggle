<?php

namespace App\Domain\Identity;

final class SchoolRoles
{
    public const PLATFORM_SUPER_ADMIN = 'platform_super_admin';

    public const SCHOOL_SUPER_ADMIN = 'school_super_admin';

    public const SCHOOL_ADMIN = 'school_admin';

    public const LEGACY_ADMIN = 'admin';

    /**
     * @return list<string>
     */
    public static function schoolSuperAdminPermissions(array $allPermissionNames): array
    {
        return array_values(array_diff($allPermissionNames, ['platform.view', 'tenants.manage']));
    }

    /**
     * Delegated School Admin Officer permissions. Governance stays on Super Admin.
     *
     * @return list<string>
     */
    public static function schoolAdminPermissions(): array
    {
        return [
            'students.view', 'students.create', 'students.edit', 'students.import',
            'attendance.view', 'attendance.create',
            'assessments.view', 'assessment.create', 'scores.edit',
            'results.view',
            'reports.view',
            'finance.view',
            'library.view', 'library.create', 'library.annotate', 'library.assign',
            'users.manage',
            'admissions.manage',
            'admissions.application.view', 'admissions.application.create', 'admissions.application.update',
            'admissions.screening.manage', 'admissions.decision.manage', 'admissions.enrolment.convert',
            'admissions.document.manage', 'admissions.settings.update',
            'communication.send', 'operations.manage', 'services.manage', 'learning.manage',
        ];
    }

    /**
     * @return list<string>
     */
    public static function governancePermissions(): array
    {
        return ['roles.manage', 'security.manage', 'audit.view', 'settings.configure', 'results.approve', 'results.publish', 'finance.manage'];
    }

    public static function isSchoolSuperAdmin(?string $role): bool
    {
        return $role === self::SCHOOL_SUPER_ADMIN;
    }

    public static function isSchoolAdminOfficer(?string $role): bool
    {
        return $role === self::SCHOOL_ADMIN;
    }

    public static function isPlatformSuperAdmin(?string $role): bool
    {
        return in_array($role, [self::PLATFORM_SUPER_ADMIN, 'platform_owner'], true);
    }

    public static function isTenantGovernanceRole(?string $role): bool
    {
        return self::isSchoolSuperAdmin($role);
    }

    /**
     * Roles that historically meant "school tenant administrator".
     *
     * @return list<string>
     */
    public static function legacyTenantOwnerAliases(): array
    {
        return [self::LEGACY_ADMIN, self::SCHOOL_ADMIN];
    }

    /**
     * @return list<string>
     */
    public static function subscriptionNotifyRoles(): array
    {
        return [self::SCHOOL_SUPER_ADMIN, self::SCHOOL_ADMIN];
    }

    /**
     * Roles a given actor may invite into their tenant.
     *
     * @return list<string>
     */
    public static function invitableRolesFor(?string $actorRole): array
    {
        $staff = ['teacher', 'parent', 'student', 'bursar', 'principal', 'examination_officer', 'admission_officer'];

        if (self::isSchoolSuperAdmin($actorRole)) {
            return array_merge($staff, [self::SCHOOL_ADMIN]);
        }

        if (self::isSchoolAdminOfficer($actorRole)) {
            return $staff;
        }

        return in_array($actorRole, ['principal'], true) ? ['teacher', 'parent', 'student'] : [];
    }
}
