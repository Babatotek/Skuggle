<?php

namespace App\Domain\Forms;

final class FormCatalog
{
    public const LOCK_SYSTEM_REQUIRED = 'system_required';

    public const LOCK_SYSTEM_OPTIONAL = 'system_optional';

    public const LOCK_PLATFORM = 'platform';

    public const LOCK_CUSTOM = 'custom';

    public const LOCK_REGULATORY = 'regulatory';

    /** @return list<array<string, mixed>> */
    public static function all(): array
    {
        return array_values(self::definitions());
    }

    /** @return array<string, array<string, mixed>> */
    public static function definitions(): array
    {
        return [
            'student.enrolment' => self::form(
                'student.enrolment',
                'Student Enrolment',
                'people',
                'student',
                [
                    ['key' => 'identity', 'name' => 'Identity'],
                    ['key' => 'academic', 'name' => 'Academic Placement'],
                    ['key' => 'guardian', 'name' => 'Parent / Guardian'],
                    ['key' => 'contact', 'name' => 'Contact / Emergency'],
                    ['key' => 'medical', 'name' => 'Medical / Welfare'],
                    ['key' => 'documents', 'name' => 'Documents'],
                    ['key' => 'government', 'name' => 'Government Information'],
                    ['key' => 'additional', 'name' => 'Additional Information'],
                ],
            ),
            'student.profile' => self::form(
                'student.profile',
                'Student Profile',
                'people',
                'student',
                [
                    ['key' => 'identity', 'name' => 'Identity'],
                    ['key' => 'academic', 'name' => 'Academic Placement'],
                    ['key' => 'guardian', 'name' => 'Parent / Guardian'],
                    ['key' => 'contact', 'name' => 'Contact / Emergency'],
                    ['key' => 'medical', 'name' => 'Medical / Welfare'],
                    ['key' => 'government', 'name' => 'Government Information'],
                    ['key' => 'additional', 'name' => 'Additional Information'],
                ],
            ),
            'teacher.profile' => self::form(
                'teacher.profile',
                'Teacher Profile',
                'people',
                'teacher',
                [
                    ['key' => 'personal', 'name' => 'Personal Information'],
                    ['key' => 'professional', 'name' => 'Professional Information'],
                    ['key' => 'employment', 'name' => 'Employment Information'],
                    ['key' => 'emergency', 'name' => 'Emergency Contact'],
                    ['key' => 'documents', 'name' => 'Documents'],
                    ['key' => 'additional', 'name' => 'Additional Information'],
                ],
            ),
            'staff.profile' => self::form(
                'staff.profile',
                'Staff Profile',
                'people',
                'staff',
                [
                    ['key' => 'personal', 'name' => 'Personal Information'],
                    ['key' => 'employment', 'name' => 'Employment Information'],
                    ['key' => 'payroll', 'name' => 'Payroll Information'],
                    ['key' => 'emergency', 'name' => 'Emergency Contact'],
                    ['key' => 'documents', 'name' => 'Documents'],
                    ['key' => 'additional', 'name' => 'Additional Information'],
                ],
            ),
            'parent.profile' => self::form(
                'parent.profile',
                'Parent / Guardian Profile',
                'people',
                'parent',
                [
                    ['key' => 'personal', 'name' => 'Personal Information'],
                    ['key' => 'contact', 'name' => 'Contact Information'],
                    ['key' => 'pickup', 'name' => 'Pickup & Authorization'],
                    ['key' => 'additional', 'name' => 'Additional Information'],
                ],
            ),
            'admissions.application' => self::form(
                'admissions.application',
                'Admission Application',
                'admissions',
                'student',
                [
                    ['key' => 'applicant', 'name' => 'Applicant Information'],
                    ['key' => 'guardian', 'name' => 'Parent / Guardian'],
                    ['key' => 'additional', 'name' => 'Additional Information'],
                ],
            ),
        ];
    }

    public static function get(string $formKey): ?array
    {
        return self::definitions()[$formKey] ?? null;
    }

    public static function assertExists(string $formKey): array
    {
        $definition = self::get($formKey);
        if ($definition === null) {
            throw new \InvalidArgumentException("Unknown form key: {$formKey}");
        }

        return $definition;
    }

    /** @return list<string> */
    public static function legacyEntityKeys(): array
    {
        return ['student', 'staff', 'teacher', 'parent'];
    }

    public static function legacyEntityToFormKey(string $entity): ?string
    {
        return match ($entity) {
            'student' => 'student.enrolment',
            'staff' => 'staff.profile',
            'teacher' => 'teacher.profile',
            'parent' => 'parent.profile',
            default => null,
        };
    }

    /** @return list<array<string, mixed>> */
    public static function defaultFields(string $formKey): array
    {
        return match ($formKey) {
            'student.enrolment', 'student.profile' => [
                self::field('first_name', 'First Name', 'short_answer', 'identity', true),
                self::field('middle_name', 'Middle Name', 'short_answer', 'identity'),
                self::field('last_name', 'Last Name', 'short_answer', 'identity', true),
                self::field('date_of_birth', 'Date of Birth', 'date', 'identity', true),
                self::field('gender', 'Gender', 'choose_one', 'identity', true, ['Male', 'Female', 'Other', 'Prefer not to say']),
                self::field('admission_number', 'Admission Number', 'short_answer', 'academic', true),
                self::field('class_placement', 'Class Placement', 'short_answer', 'academic', true),
                self::field('guardian', 'Parent / Guardian', 'short_answer', 'guardian', true),
            ],
            'teacher.profile' => [
                self::field('first_name', 'First Name', 'short_answer', 'personal', true),
                self::field('middle_name', 'Middle Name', 'short_answer', 'personal'),
                self::field('last_name', 'Last Name', 'short_answer', 'personal', true),
                self::field('phone', 'Phone Number', 'phone', 'personal'),
                self::field('email', 'Email', 'email', 'personal', true),
                self::field('teaching_subjects', 'Teaching Subjects', 'short_answer', 'professional'),
                self::field('employment_date', 'Employment Date', 'date', 'employment'),
            ],
            'staff.profile' => [
                self::field('name', 'Full Name', 'short_answer', 'personal', true),
                self::field('employee_number', 'Staff ID', 'short_answer', 'employment', true),
                self::field('employment_type', 'Employment Type', 'choose_one', 'employment', true, ['Full time', 'Part time', 'Contract']),
                self::field('department', 'Department', 'short_answer', 'employment'),
                self::field('employment_date', 'Employment Date', 'date', 'employment'),
            ],
            'parent.profile' => [
                self::field('name', 'Full Name', 'short_answer', 'personal', true),
                self::field('phone', 'Phone Number', 'phone', 'contact', true),
                self::field('email', 'Email', 'email', 'contact'),
                self::field('relationship', 'Relationship', 'short_answer', 'personal', true),
            ],
            'admissions.application' => [
                self::field('first_name', 'First Name', 'short_answer', 'applicant', true),
                self::field('last_name', 'Last Name', 'short_answer', 'applicant', true),
                self::field('date_of_birth', 'Date of Birth', 'date', 'applicant', true),
                self::field('guardian', 'Parent / Guardian', 'short_answer', 'guardian', true),
            ],
            default => [],
        };
    }

    /** @param list<string> $options */
    private static function field(string $key, string $label, string $answerType, string $section, bool $required = false, array $options = []): array
    {
        return compact('key', 'label', 'answerType', 'section', 'required', 'options');
    }

    /**
     * @param  list<array{key: string, name: string}>  $sections
     * @return array<string, mixed>
     */
    private static function form(string $key, string $name, string $category, string $entity, array $sections): array
    {
        return [
            'key' => $key,
            'name' => $name,
            'category' => $category,
            'entity' => $entity,
            'sections' => $sections,
        ];
    }
}
