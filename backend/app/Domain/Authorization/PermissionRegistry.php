<?php

namespace App\Domain\Authorization;

use LogicException;

final class PermissionRegistry
{
    public const VERSION = 3;

    /**
     * @return array<string, array{domain:string,resource:string,action:string,description:string,scopes:list<string>,privilege:string,delegable:bool,aliases:list<string>,status:string,introducedVersion:int,owner:string}>
     */
    public static function definitions(): array
    {
        /** @var array<string, array{domain:string,resource:string,action:string,description:string,scopes:list<string>,privilege:string,delegable:bool,aliases:list<string>,status:string,introducedVersion:int,owner:string}>|null $cached */
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        $rows = [
            ['platform.tenant.view', 'platform', 'tenant', 'view', 'View platform tenant inventory.', ['TENANT'], 'PLATFORM_CRITICAL', false, ['platform.view'], 'Platform Operations'],
            ['platform.tenant.manage', 'platform', 'tenant', 'manage', 'Manage tenant lifecycle at platform scope.', ['TENANT'], 'PLATFORM_CRITICAL', false, ['tenants.manage'], 'Platform Operations'],
            ['identity.user.manage', 'identity', 'user', 'manage', 'Manage users within the active tenant.', ['TENANT'], 'PRIVILEGED', true, ['users.manage'], 'Identity'],
            ['identity.role.manage', 'identity', 'role', 'manage', 'Manage tenant role membership.', ['TENANT'], 'PRIVILEGED', false, ['roles.manage'], 'Identity'],
            ['identity.security.manage', 'identity', 'security', 'manage', 'Manage tenant security controls.', ['TENANT'], 'PRIVILEGED', false, ['security.manage'], 'Security'],
            ['identity.audit.view', 'identity', 'audit', 'view', 'View tenant security audit events.', ['TENANT'], 'SENSITIVE', false, ['audit.view'], 'Security'],
            ['school.settings.update', 'school', 'settings', 'update', 'Update tenant school settings.', ['TENANT'], 'PRIVILEGED', true, ['settings.configure'], 'School Operations'],
            ['students.profile.view', 'students', 'profile', 'view', 'View student profiles subject to relationship policy.', ['LINKED_CHILDREN', 'ASSIGNED_CLASSES', 'TENANT', 'SPECIFIC_RESOURCE'], 'SENSITIVE', true, ['students.view'], 'Students'],
            ['students.profile.create', 'students', 'profile', 'create', 'Create student profiles within the tenant.', ['TENANT'], 'SENSITIVE', true, ['students.create'], 'Students'],
            ['students.profile.update', 'students', 'profile', 'update', 'Update visible student profiles.', ['TENANT', 'SPECIFIC_RESOURCE'], 'SENSITIVE', true, ['students.edit'], 'Students'],
            ['students.profile.import', 'students', 'profile', 'import', 'Import student profiles.', ['TENANT'], 'SENSITIVE', true, ['students.import'], 'Students'],
            ['students.medical.view', 'students', 'medical', 'view', 'View highly sensitive student medical data.', ['TENANT', 'SPECIFIC_RESOURCE'], 'PRIVILEGED', false, ['students.medical.view'], 'Student Safeguarding'],
            ['students.medical.update', 'students', 'medical', 'update', 'Update highly sensitive student medical data.', ['TENANT', 'SPECIFIC_RESOURCE'], 'PRIVILEGED', false, ['students.medical.edit'], 'Student Safeguarding'],
            ['attendance.student.view', 'attendance', 'student', 'view', 'View student attendance within an allowed relationship scope.', ['ASSIGNED_CLASSES', 'CAMPUS', 'TENANT'], 'SENSITIVE', true, ['attendance.view'], 'Attendance'],
            ['attendance.student.record', 'attendance', 'student', 'record', 'Record attendance for allowed students and classes.', ['ASSIGNED_CLASSES', 'CAMPUS'], 'SENSITIVE', true, ['attendance.create'], 'Attendance'],
            ['attendance.student.approve', 'attendance', 'student', 'approve', 'Approve attendance records.', ['CAMPUS', 'TENANT'], 'PRIVILEGED', true, ['attendance.approve'], 'Attendance'],
            ['assessment.assessment.view', 'assessment', 'assessment', 'view', 'View assessments allowed by assignment and tenant policy.', ['ASSIGNED_CLASSES', 'ASSIGNED_SUBJECTS', 'TENANT'], 'STANDARD', true, ['assessments.view'], 'Assessment'],
            ['assessment.assessment.create', 'assessment', 'assessment', 'create', 'Create an assessment within assigned scope.', ['ASSIGNED_CLASSES', 'ASSIGNED_SUBJECTS'], 'SENSITIVE', true, ['assessment.create'], 'Assessment'],
            ['assessment.score.enter', 'assessment', 'score', 'enter', 'Enter scores subject to teacher assignment policy.', ['ASSIGNED_CLASSES', 'ASSIGNED_SUBJECTS', 'SPECIFIC_RESOURCE'], 'SENSITIVE', true, ['scores.edit'], 'Assessment'],
            ['assessment.score.moderate', 'assessment', 'score', 'moderate', 'Moderate submitted assessment scores.', ['CAMPUS', 'TENANT', 'SPECIFIC_RESOURCE'], 'PRIVILEGED', true, ['scores.approve'], 'Assessment'],
            ['assessment.assessment.manage', 'assessment', 'assessment', 'manage', 'Operate across tenant assessment assignments.', ['TENANT'], 'PRIVILEGED', false, [], 'Assessment'],
            ['assessment.score.lock', 'assessment', 'score', 'lock', 'Lock validated assessment scores.', ['TENANT', 'SPECIFIC_RESOURCE'], 'PRIVILEGED', false, [], 'Assessment'],
            ['assessment.score.unlock', 'assessment', 'score', 'unlock', 'Reopen locked scores with an audited reason.', ['TENANT', 'SPECIFIC_RESOURCE'], 'PRIVILEGED', false, [], 'Assessment'],
            ['assessment.question.review', 'assessment', 'question', 'review', 'Review draft bank questions.', ['ASSIGNED_SUBJECTS', 'TENANT'], 'SENSITIVE', true, [], 'Assessment'],
            ['assessment.settings.configure', 'assessment', 'settings', 'configure', 'Configure assessment workflow defaults.', ['TENANT'], 'PRIVILEGED', false, [], 'Assessment'],
            ['assessment.cbt.attempt', 'assessment', 'cbt', 'attempt', 'Take an assigned computer-based assessment.', ['SELF'], 'SENSITIVE', false, [], 'Assessment'],
            ['assessment.smartmark.process', 'assessment', 'smartmark', 'process', 'Upload and process SmartMark optical answer-sheet batches.', ['ASSIGNED_CLASSES', 'ASSIGNED_SUBJECTS', 'SPECIFIC_RESOURCE'], 'SENSITIVE', true, [], 'Assessment'],
            ['assessment.smartmark.review', 'assessment', 'smartmark', 'review', 'Review SmartMark exceptions and commit verified scores.', ['ASSIGNED_CLASSES', 'ASSIGNED_SUBJECTS', 'SPECIFIC_RESOURCE'], 'SENSITIVE', true, [], 'Assessment'],
            ['performance.result.view', 'performance', 'result', 'view', 'View results permitted by student relationship policy.', ['SELF', 'LINKED_CHILDREN', 'ASSIGNED_CLASSES', 'TENANT'], 'SENSITIVE', true, ['results.view'], 'Performance'],
            ['performance.result.approve', 'performance', 'result', 'approve', 'Approve result publication state.', ['CAMPUS', 'TENANT'], 'PRIVILEGED', true, ['results.approve'], 'Performance'],
            ['performance.result.publish', 'performance', 'result', 'publish', 'Publish tenant results.', ['TENANT'], 'PRIVILEGED', false, ['results.publish'], 'Performance'],
            ['reporting.report.view', 'reporting', 'report', 'view', 'View authorized tenant reports.', ['OWN_RECORDS', 'TENANT'], 'SENSITIVE', true, ['reports.view'], 'Reporting'],
            ['reporting.report.export', 'reporting', 'report', 'export', 'Generate and download tenant reports.', ['OWN_RECORDS', 'TENANT'], 'SENSITIVE', true, ['reports.export'], 'Reporting'],
            ['finance.account.view', 'finance', 'account', 'view', 'View tenant finance records.', ['TENANT'], 'SENSITIVE', true, ['finance.view'], 'Finance'],
            ['finance.account.manage', 'finance', 'account', 'manage', 'Manage tenant finance records.', ['TENANT'], 'PRIVILEGED', false, ['finance.manage'], 'Finance'],
            ['library.resource.view', 'library', 'resource', 'view', 'View library resources.', ['TENANT', 'PUBLIC_PUBLISHED'], 'STANDARD', true, ['library.view'], 'Library'],
            ['library.resource.create', 'library', 'resource', 'create', 'Create library resources.', ['TENANT'], 'STANDARD', true, ['library.create'], 'Library'],
            ['library.annotation.create', 'library', 'annotation', 'create', 'Annotate accessible library resources.', ['OWN_RECORDS', 'SPECIFIC_RESOURCE'], 'STANDARD', true, ['library.annotate'], 'Library'],
            ['library.assignment.manage', 'library', 'assignment', 'manage', 'Assign library resources to learners.', ['ASSIGNED_CLASSES', 'TENANT'], 'SENSITIVE', true, ['library.assign'], 'Library'],
            ['library.version.manage', 'library', 'version', 'manage', 'Manage library resource versions.', ['OWN_RECORDS', 'TENANT'], 'SENSITIVE', true, ['library.version.manage'], 'Library'],
            ['library.export.create', 'library', 'export', 'create', 'Generate a private library export.', ['OWN_RECORDS', 'TENANT'], 'SENSITIVE', true, ['library.export'], 'Library'],
            ['library.insight.view', 'library', 'insight', 'view', 'View library engagement insights.', ['ASSIGNED_CLASSES', 'TENANT'], 'SENSITIVE', true, ['library.insights'], 'Library'],
            ['ai.content.generate', 'ai', 'content', 'generate', 'Generate AI-assisted content within quota.', ['SELF', 'TENANT'], 'SENSITIVE', true, ['ai.generate'], 'AI Platform'],
            ['admissions.application.manage', 'admissions', 'application', 'manage', 'Compatibility capability for the legacy aggregate admissions grant.', ['TENANT'], 'SENSITIVE', true, ['admissions.manage'], 'Admissions'],
            ['admissions.application.view', 'admissions', 'application', 'view', 'View admission applications and aggregate admissions metrics.', ['TENANT'], 'SENSITIVE', true, [], 'Admissions'],
            ['admissions.application.create', 'admissions', 'application', 'create', 'Create admission applications.', ['TENANT'], 'SENSITIVE', true, [], 'Admissions'],
            ['admissions.application.update', 'admissions', 'application', 'update', 'Update applications and supported lifecycle states.', ['TENANT', 'SPECIFIC_RESOURCE'], 'SENSITIVE', true, [], 'Admissions'],
            ['admissions.screening.manage', 'admissions', 'screening', 'manage', 'Schedule and complete applicant screenings.', ['TENANT', 'SPECIFIC_RESOURCE'], 'SENSITIVE', true, [], 'Admissions'],
            ['admissions.decision.manage', 'admissions', 'decision', 'manage', 'Record admission decisions and offers.', ['TENANT', 'SPECIFIC_RESOURCE'], 'PRIVILEGED', true, [], 'Admissions'],
            ['admissions.enrolment.convert', 'admissions', 'enrolment', 'convert', 'Convert accepted applicants into enrolled students.', ['TENANT', 'SPECIFIC_RESOURCE'], 'PRIVILEGED', false, [], 'Admissions'],
            ['admissions.document.manage', 'admissions', 'document', 'manage', 'Upload, download, and delete private applicant documents.', ['TENANT', 'SPECIFIC_RESOURCE'], 'SENSITIVE', true, [], 'Admissions'],
            ['admissions.settings.update', 'admissions', 'settings', 'update', 'Configure admission cycles and workflow settings.', ['TENANT'], 'PRIVILEGED', false, [], 'Admissions'],
            ['communication.message.send', 'communication', 'message', 'send', 'Send tenant communications to authorized audiences.', ['ASSIGNED_CLASSES', 'TENANT'], 'SENSITIVE', true, ['communication.send'], 'Communication'],
            ['operations.record.manage', 'operations', 'record', 'manage', 'Manage currently implemented school operations records.', ['TENANT'], 'SENSITIVE', true, ['operations.manage'], 'Operations'],
            ['services.record.manage', 'services', 'record', 'manage', 'Manage currently implemented school service records.', ['TENANT'], 'SENSITIVE', true, ['services.manage'], 'Services'],
            ['learning.record.manage', 'learning', 'record', 'manage', 'Manage currently implemented learning records.', ['ASSIGNED_CLASSES', 'TENANT'], 'SENSITIVE', true, ['learning.manage'], 'Learning'],
        ];

        $definitions = [];
        foreach ($rows as [$key, $domain, $resource, $action, $description, $scopes, $privilege, $delegable, $aliases, $owner]) {
            if (isset($definitions[$key])) {
                throw new LogicException('Duplicate canonical permission: '.$key);
            }
            $definitions[$key] = compact('domain', 'resource', 'action', 'description', 'scopes', 'privilege', 'delegable', 'aliases', 'owner') + ['status' => 'active', 'introducedVersion' => self::VERSION];
        }

        self::validate($definitions);

        return $cached = $definitions;
    }

    /** @return array<string, string> */
    public static function aliases(): array
    {
        /** @var array<string, string>|null $cached */
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        $aliases = [];
        foreach (self::definitions() as $canonical => $definition) {
            foreach ($definition['aliases'] as $legacy) {
                if (isset($aliases[$legacy])) {
                    throw new LogicException('Duplicate legacy permission alias: '.$legacy);
                }
                $aliases[$legacy] = $canonical;
            }
        }

        return $cached = $aliases;
    }

    /** @return array<string, array{targets:list<string>,reason:string,owner:string,introducedVersion:int,removalWave:int,telemetry:string}> */
    public static function aliasDefinitions(): array
    {
        $result = [];
        foreach (self::aliases() as $legacy => $canonical) {
            $definition = self::definitions()[$canonical];
            $result[$legacy] = [
                'targets' => [$canonical],
                'reason' => 'Preserve the reviewed pre-Wave-4 authorization meaning without granting future capabilities.',
                'owner' => $definition['owner'],
                'introducedVersion' => self::VERSION,
                'removalWave' => 24,
                'telemetry' => 'authz_legacy_alias_used',
            ];
        }

        return $result;
    }

    public static function canonicalFor(string $permission): ?string
    {
        return isset(self::definitions()[$permission]) ? $permission : (self::aliases()[$permission] ?? null);
    }

    /** @param array<string, array<string, mixed>> $definitions */
    private static function validate(array $definitions): void
    {
        foreach ($definitions as $key => $definition) {
            if (! preg_match('/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/', $key)) {
                throw new LogicException('Invalid canonical permission grammar: '.$key);
            }
            if (! PrivilegeClass::tryFrom((string) $definition['privilege'])) {
                throw new LogicException('Invalid privilege class for '.$key);
            }
            foreach ($definition['aliases'] as $alias) {
                if (str_contains($alias, '*')) {
                    throw new LogicException('Wildcard permission aliases are forbidden.');
                }
            }
            if (str_starts_with($key, 'platform.') && $definition['privilege'] !== PrivilegeClass::PLATFORM_CRITICAL->value) {
                throw new LogicException('Platform permissions must be PLATFORM_CRITICAL.');
            }
        }
    }
}
