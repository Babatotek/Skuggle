<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\Student;
use Illuminate\Support\Collection;

final class SmartmarkMatchingService
{
    public function __construct(private readonly AssessmentWorkflow $workflow) {}

    /**
     * @return array{student:?Student,flag_reason:?string}
     */
    public function match(Assessment $assessment, ?string $admissionNumber, ?string $studentName = null): array
    {
        $roster = $this->workflow->roster($assessment);
        if ($roster->isEmpty()) {
            return ['student' => null, 'flag_reason' => 'Assessment roster is empty.'];
        }

        $normalizedAdmission = $this->normalize($admissionNumber);
        if ($normalizedAdmission !== '') {
            $exact = $roster->first(fn (Student $student) => $this->normalize($student->admission_number) === $normalizedAdmission);
            if ($exact) {
                return ['student' => $exact, 'flag_reason' => null];
            }

            $near = $roster->filter(function (Student $student) use ($normalizedAdmission) {
                $candidate = $this->normalize($student->admission_number);

                return $candidate !== '' && levenshtein($candidate, $normalizedAdmission) <= 1;
            })->values();
            if ($near->count() === 1) {
                return ['student' => $near->first(), 'flag_reason' => 'Matched with a near-admission correction.'];
            }
            if ($near->count() > 1) {
                return ['student' => null, 'flag_reason' => 'Multiple roster students share a similar admission number.'];
            }
        }

        $normalizedName = $this->normalizeName($studentName);
        if ($normalizedName !== '') {
            $byName = $roster->filter(fn (Student $student) => $this->normalizeName($this->displayName($student)) === $normalizedName)->values();
            if ($byName->count() === 1) {
                return ['student' => $byName->first(), 'flag_reason' => 'Matched by unique roster name.'];
            }
            if ($byName->count() > 1) {
                return ['student' => null, 'flag_reason' => 'Multiple roster students share this name.'];
            }
        }

        return ['student' => null, 'flag_reason' => 'Unmatched student script.'];
    }

    /**
     * @return list<array{id:string,name:string,admissionNo:?string}>
     */
    public function rosterOptions(Assessment $assessment): array
    {
        return $this->workflow->roster($assessment)->map(fn (Student $student) => [
            'id' => $student->public_id,
            'name' => $this->displayName($student),
            'admissionNo' => $student->admission_number,
        ])->values()->all();
    }

    public function normalize(?string $value): string
    {
        return strtoupper(preg_replace('/[^A-Z0-9]/i', '', (string) $value) ?? '');
    }

    private function normalizeName(?string $value): string
    {
        return strtoupper(trim(preg_replace('/\s+/', ' ', (string) $value) ?? ''));
    }

    private function displayName(Student $student): string
    {
        return trim(($student->first_name ?? '').' '.($student->last_name ?? ''));
    }

    /**
     * @param  Collection<int, Student>  $roster
     */
    public function findOnRoster(Collection $roster, int $studentId): ?Student
    {
        return $roster->first(fn (Student $student) => (int) $student->getKey() === $studentId);
    }
}
