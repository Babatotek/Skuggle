<?php

namespace App\Domain\Forms;

final class FieldTemplateLibrary
{
    /** @return list<array<string, mixed>> */
    public static function all(): array
    {
        return array_values(self::templates());
    }

    /** @return array<string, array<string, mixed>> */
    public static function templates(): array
    {
        return [
            'nin' => self::template('nin', 'National Identification Number (NIN)', 'short_answer', ['student', 'teacher', 'staff', 'parent'], true, ['NG']),
            'state_of_origin' => self::template('state_of_origin', 'State of Origin', 'choose_one', ['student', 'teacher', 'staff'], false, ['NG']),
            'lga' => self::template('lga', 'Local Government Area (LGA)', 'short_answer', ['student', 'teacher', 'staff'], false, ['NG']),
            'birth_registration_number' => self::template('birth_registration_number', 'Birth Registration Number', 'short_answer', ['student'], false, ['NG']),
            'trcn_number' => self::template('trcn_number', 'TRCN Number', 'short_answer', ['teacher'], false, ['NG']),
            'blood_group' => self::template('blood_group', 'Blood Group', 'choose_one', ['student'], false, [], ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'genotype' => self::template('genotype', 'Genotype', 'choose_one', ['student'], false, [], ['AA', 'AS', 'AC', 'SS', 'SC']),
            'staff_id' => self::template('staff_id', 'Staff ID', 'short_answer', ['staff', 'teacher'], false),
            'pension_number' => self::template('pension_number', 'Pension Number', 'short_answer', ['staff', 'teacher'], true),
            'tax_id' => self::template('tax_id', 'Tax ID', 'short_answer', ['staff', 'teacher'], true),
            'emergency_contact' => self::template('emergency_contact', 'Emergency Contact', 'short_answer', ['student', 'teacher', 'staff', 'parent']),
            'previous_school' => self::template('previous_school', 'Previous School', 'short_answer', ['student']),
            'scholarship_type' => self::template('scholarship_type', 'Scholarship Type', 'choose_one', ['student']),
            'house' => self::template('house', 'House', 'choose_one', ['student']),
            'hostel_room' => self::template('hostel_room', 'Hostel Room', 'short_answer', ['student']),
            'bus_route_code' => self::template('bus_route_code', 'Bus Route Code', 'short_answer', ['student']),
            'employer' => self::template('employer', 'Employer', 'short_answer', ['parent', 'staff', 'teacher']),
            'preferred_language' => self::template('preferred_language', 'Preferred Communication Language', 'choose_one', ['parent']),
            'pickup_authorization_code' => self::template('pickup_authorization_code', 'Authorized Pickup Code', 'short_answer', ['parent']),
            'grade_level' => self::template('grade_level', 'Grade Level', 'choose_one', ['staff']),
            'employment_category' => self::template('employment_category', 'Employment Category', 'choose_one', ['staff', 'teacher']),
            'teaching_licence' => self::template('teaching_licence', 'Teaching Licence', 'short_answer', ['teacher']),
            'highest_qualification' => self::template('highest_qualification', 'Highest Qualification', 'short_answer', ['teacher', 'staff']),
            'years_of_experience' => self::template('years_of_experience', 'Years of Experience', 'number', ['teacher', 'staff']),
        ];
    }

    public static function get(string $templateKey): ?array
    {
        return self::templates()[$templateKey] ?? null;
    }

    /**
     * @param  list<string>  $entities
     * @param  list<string>  $jurisdictions
     * @param  list<string>  $options
     * @return array<string, mixed>
     */
    private static function template(
        string $key,
        string $label,
        string $answerType,
        array $entities,
        bool $sensitive = false,
        array $jurisdictions = [],
        array $options = [],
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'answerType' => $answerType,
            'entities' => $entities,
            'sensitive' => $sensitive,
            'jurisdictions' => $jurisdictions,
            'options' => $options,
        ];
    }
}
