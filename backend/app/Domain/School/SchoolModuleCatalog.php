<?php

namespace App\Domain\School;

final class SchoolModuleCatalog
{
    /**
     * @return array<string, array{label: string, permission: string, writePermission: string, statuses: list<string>, fields: list<array{key: string, label: string, type: string, required?: bool, options?: list<string>}>}>
     */
    public static function all(): array
    {
        return [
            'houses' => self::module('Houses', 'settings.configure', ['name' => 'House name', 'colour' => 'Colour', 'patron' => 'Patron']),
            'facilities' => self::module('Facilities', 'operations.manage', ['name' => 'Facility', 'location' => 'Location', 'capacity' => 'Capacity']),
            'calendar' => self::module('Academic Calendar', 'settings.configure', ['title' => 'Event', 'starts_at' => 'Starts', 'ends_at' => 'Ends', 'audience' => 'Audience'], ['scheduled', 'completed', 'cancelled']),
            'scheme-of-work' => self::module('Scheme of Work', 'students.view', ['subject' => 'Subject', 'class' => 'Class', 'term' => 'Term', 'teacher' => 'Teacher', 'topics' => 'Total topics', 'completed_topics' => 'Completed topics', 'notes' => 'Notes'], ['draft', 'submitted', 'under_review', 'approved', 'returned']),
            'lesson-plans' => self::module('Lesson Plans', 'students.view', ['teacher' => 'Teacher', 'subject' => 'Subject', 'class' => 'Class', 'term' => 'Term', 'week' => 'Week', 'topics' => 'Topic', 'notes' => 'Learning objectives'], ['draft', 'submitted', 'under_review', 'approved', 'returned']),
            'exam-scheduling' => self::module('Exam Scheduling', 'assessment.create', ['title' => 'Exam', 'class' => 'Class', 'subject' => 'Subject', 'starts_at' => 'Starts', 'venue' => 'Venue'], ['scheduled', 'in_progress', 'completed']),
            'interventions' => self::module('Interventions', 'students.view', ['student' => 'Student', 'issue' => 'Issue', 'owner' => 'Owner', 'next_review' => 'Next review'], ['open', 'in_progress', 'resolved']),
            'staff-attendance' => self::module('Staff Attendance', 'attendance.view', ['staff' => 'Staff', 'date' => 'Date', 'check_in' => 'Check in', 'check_out' => 'Check out'], ['present', 'absent', 'late', 'leave']),
            'absences' => self::module('Absence Management', 'attendance.view', ['person' => 'Name', 'role' => 'Role', 'date' => 'Date', 'reason' => 'Reason'], ['reported', 'approved', 'rejected']),
            'late-arrivals' => self::module('Late Arrivals', 'attendance.view', ['person' => 'Name', 'date' => 'Date', 'minutes' => 'Minutes late', 'reason' => 'Reason'], ['recorded', 'excused']),
            'biometrics' => self::module('Biometrics', 'attendance.create', ['device' => 'Device', 'location' => 'Location', 'provider' => 'Provider'], ['active', 'offline', 'retired']),
            'attendance-notifications' => self::module('Attendance Notifications', 'attendance.create', ['trigger' => 'Trigger', 'channel' => 'Channel', 'audience' => 'Audience'], ['active', 'paused']),
            'discounts' => self::module('Discounts', 'finance.manage', ['name' => 'Name', 'percent' => 'Percent', 'applies_to' => 'Applies to'], ['active', 'expired']),
            'scholarships' => self::module('Scholarships', 'finance.manage', ['name' => 'Name', 'student' => 'Student', 'amount' => 'Amount', 'term' => 'Term'], ['active', 'ended']),
            'payment-plans' => self::module('Payment Plans', 'finance.manage', ['name' => 'Name', 'instalments' => 'Instalments', 'applies_to' => 'Applies to'], ['active', 'closed']),
            'expenses' => self::module('Expenses', 'finance.manage', ['title' => 'Title', 'category' => 'Category', 'amount' => 'Amount', 'spent_on' => 'Date'], ['draft', 'approved', 'paid']),
            'reconciliation' => self::module('Reconciliation', 'finance.manage', ['period' => 'Period', 'expected' => 'Expected', 'received' => 'Received', 'variance' => 'Variance'], ['open', 'balanced', 'exception']),
            'email-campaigns' => self::module('Email', 'communication.send', ['subject' => 'Subject', 'audience' => 'Audience', 'body' => 'Body'], ['draft', 'queued', 'sent']),
            'sms-campaigns' => self::module('SMS', 'communication.send', ['audience' => 'Audience', 'body' => 'Message'], ['draft', 'queued', 'sent']),
            'push-campaigns' => self::module('Push Notifications', 'communication.send', ['title' => 'Title', 'audience' => 'Audience', 'body' => 'Body'], ['draft', 'queued', 'sent']),
            'virtual-classes' => self::module('Virtual Classes', 'learning.manage', ['title' => 'Title', 'class' => 'Class', 'platform' => 'Platform', 'join_url' => 'Join URL'], ['scheduled', 'live', 'ended']),
            'live-lessons' => self::module('Live Lessons', 'learning.manage', ['title' => 'Title', 'subject' => 'Subject', 'starts_at' => 'Starts', 'join_url' => 'Join URL'], ['scheduled', 'live', 'ended']),
            'recorded-lessons' => self::module('Recorded Lessons', 'library.view', ['title' => 'Title', 'subject' => 'Subject', 'url' => 'Recording URL'], ['published', 'draft']),
            'assignments' => self::module('Assignments', 'learning.manage', ['title' => 'Title', 'class' => 'Class', 'due_at' => 'Due', 'instructions' => 'Instructions'], ['assigned', 'closed']),
            'discussions' => self::module('Discussions', 'learning.manage', ['topic' => 'Topic', 'class' => 'Class', 'prompt' => 'Prompt'], ['open', 'closed']),
            'behaviour' => self::module('Behaviour', 'services.manage', ['student' => 'Student', 'incident' => 'Incident', 'points' => 'Points'], ['recorded', 'reviewed']),
            'discipline' => self::module('Discipline', 'services.manage', ['student' => 'Student', 'action' => 'Action', 'reason' => 'Reason'], ['open', 'resolved']),
            'welfare' => self::module('Welfare', 'services.manage', ['student' => 'Student', 'case' => 'Case', 'owner' => 'Owner'], ['open', 'monitoring', 'closed']),
            'counselling' => self::module('Counselling', 'services.manage', ['student' => 'Student', 'session_at' => 'Session', 'notes' => 'Notes'], ['scheduled', 'completed']),
            'transport' => self::module('Transport', 'services.manage', ['route' => 'Route', 'vehicle' => 'Vehicle', 'driver' => 'Driver'], ['active', 'inactive']),
            'student-support' => self::module('Student Support', 'services.manage', ['student' => 'Student', 'need' => 'Need', 'owner' => 'Owner'], ['open', 'closed']),
            'assets' => self::module('Assets', 'operations.manage', ['name' => 'Asset', 'tag' => 'Tag', 'location' => 'Location'], ['in_service', 'repair', 'retired']),
            'inventory' => self::module('Inventory', 'operations.manage', ['item' => 'Item', 'quantity' => 'Quantity', 'location' => 'Location'], ['in_stock', 'low', 'out']),
            'approvals' => self::module('Approvals', 'operations.manage', ['request' => 'Request', 'requester' => 'Requester', 'type' => 'Type'], ['pending', 'approved', 'rejected']),
            'documents' => self::module('Documents', 'operations.manage', ['title' => 'Title', 'category' => 'Category', 'owner' => 'Owner'], ['active', 'archived']),
            'workflows' => self::module('Workflow Rules', 'settings.configure', ['name' => 'Name', 'trigger' => 'Trigger', 'action' => 'Action'], ['active', 'paused']),
            'automation' => self::module('Automation', 'settings.configure', ['name' => 'Name', 'schedule' => 'Schedule', 'action' => 'Action'], ['active', 'paused']),
            'integrations' => self::module('Integrations', 'security.manage', ['name' => 'Name', 'provider' => 'Provider', 'purpose' => 'Purpose'], ['connected', 'disabled']),
            'security-settings' => self::module('Security', 'security.manage', ['control' => 'Control', 'value' => 'Value'], ['enabled', 'disabled']),
            'auth-policies' => self::module('Authentication Policies', 'security.manage', ['policy' => 'Policy', 'value' => 'Value'], ['enforced', 'optional']),
            'system-config' => self::module('System Configuration', 'settings.configure', ['key' => 'Key', 'value' => 'Value'], ['active']),
        ];
    }

    /**
     * @return array{label: string, permission: string, writePermission: string, statuses: list<string>, fields: list<array{key: string, label: string, type: string, required?: bool}>}|null
     */
    public static function get(string $module): ?array
    {
        return self::all()[$module] ?? null;
    }

    /**
     * @return list<string>
     */
    public static function permissionNames(): array
    {
        return ['admissions.manage', 'communication.send', 'operations.manage', 'services.manage', 'learning.manage'];
    }

    /**
     * @param  array<string, string>  $fields
     * @param  list<string>  $statuses
     * @return array{label: string, permission: string, writePermission: string, statuses: list<string>, fields: list<array{key: string, label: string, type: string, required?: bool}>}
     */
    private static function module(string $label, string $permission, array $fields, array $statuses = ['active', 'archived']): array
    {
        $mapped = [];
        foreach ($fields as $key => $fieldLabel) {
            $type = str_contains($key, '_at') || $key === 'date' || $key === 'spent_on' ? 'date' : (in_array($key, ['body', 'notes', 'instructions', 'prompt', 'policy'], true) ? 'textarea' : 'text');
            $mapped[] = ['key' => $key, 'label' => $fieldLabel, 'type' => $type, 'required' => $key === array_key_first($fields)];
        }

        return [
            'label' => $label,
            'permission' => $permission,
            'writePermission' => $permission,
            'statuses' => $statuses,
            'fields' => $mapped,
        ];
    }
}
