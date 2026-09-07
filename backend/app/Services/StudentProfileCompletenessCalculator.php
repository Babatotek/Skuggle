<?php

namespace App\Services;

use App\Models\Student;

final class StudentProfileCompletenessCalculator
{
    /**
     * @return array{percent: int, sections: array<string, array{complete: bool, label: string, detail?: string}>}
     */
    public function calculate(Student $student): array
    {
        $student->loadMissing(['guardians', 'documents', 'medicalInformation', 'enrollments.schoolClass']);

        $sections = [
            'identity' => [
                'label' => 'Identity',
                'complete' => filled($student->first_name)
                    && filled($student->last_name)
                    && filled($student->date_of_birth)
                    && filled($student->gender),
            ],
            'photo' => [
                'label' => 'Photo',
                'complete' => filled($student->photo_key),
            ],
            'academic' => [
                'label' => 'Academic',
                'complete' => $student->enrollments->isNotEmpty()
                    && filled($student->admission_date),
            ],
            'guardian' => [
                'label' => 'Guardian',
                'complete' => $student->guardians->isNotEmpty(),
            ],
            'contact' => [
                'label' => 'Contact',
                'complete' => filled(data_get($student->metadata, 'residential.address'))
                    || filled(data_get($student->metadata, 'emergency.phone')),
            ],
            'medical' => [
                'label' => 'Medical',
                'complete' => $student->medicalInformation !== null,
            ],
            'documents' => [
                'label' => 'Documents',
                'complete' => $student->documents->count() >= 2,
                'detail' => $student->documents->count().'/4 recommended',
            ],
        ];

        $weights = [
            'identity' => 20,
            'photo' => 10,
            'academic' => 20,
            'guardian' => 20,
            'contact' => 10,
            'medical' => 10,
            'documents' => 10,
        ];

        $earned = 0;
        foreach ($sections as $key => $section) {
            if ($section['complete']) {
                $earned += $weights[$key];
            }
        }

        return [
            'percent' => min(100, $earned),
            'sections' => $sections,
        ];
    }
}
