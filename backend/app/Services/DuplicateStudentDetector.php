<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\Student;

final class DuplicateStudentDetector
{
    /**
     * @param  array<string, mixed>  $input
     * @return list<array<string, mixed>>
     */
    public function findPossibleDuplicates(array $input, ?string $excludeStudentId = null): array
    {
        $matches = collect();

        if (! empty($input['firstName']) && ! empty($input['lastName']) && ! empty($input['dateOfBirth'])) {
            $query = Student::query()
                ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($input['firstName'])])
                ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($input['lastName'])])
                ->whereDate('date_of_birth', $input['dateOfBirth']);

            if ($excludeStudentId) {
                $query->where('public_id', '!=', $excludeStudentId);
            }

            $matches = $matches->merge($query->with(['enrollments.schoolClass'])->limit(5)->get());
        }

        if (! empty($input['admissionNumber'])) {
            $query = Student::query()->where('admission_number', $input['admissionNumber']);
            if ($excludeStudentId) {
                $query->where('public_id', '!=', $excludeStudentId);
            }
            $matches = $matches->merge($query->with(['enrollments.schoolClass'])->limit(3)->get());
        }

        foreach ($input['guardians'] ?? [] as $guardianInput) {
            if (! empty($guardianInput['phone'])) {
                $guardianIds = Guardian::query()->where('phone', $guardianInput['phone'])->pluck('id');
                if ($guardianIds->isNotEmpty()) {
                    $query = Student::query()->whereHas('guardians', fn ($q) => $q->whereIn('guardians.id', $guardianIds));
                    if ($excludeStudentId) {
                        $query->where('public_id', '!=', $excludeStudentId);
                    }
                    $matches = $matches->merge($query->with(['enrollments.schoolClass', 'guardians'])->limit(5)->get());
                }
            }

            if (! empty($guardianInput['email'])) {
                $guardianIds = Guardian::query()->where('email', mb_strtolower($guardianInput['email']))->pluck('id');
                if ($guardianIds->isNotEmpty()) {
                    $query = Student::query()->whereHas('guardians', fn ($q) => $q->whereIn('guardians.id', $guardianIds));
                    if ($excludeStudentId) {
                        $query->where('public_id', '!=', $excludeStudentId);
                    }
                    $matches = $matches->merge($query->with(['enrollments.schoolClass', 'guardians'])->limit(5)->get());
                }
            }
        }

        return $matches
            ->unique(fn (Student $student) => $student->public_id)
            ->take(8)
            ->map(fn (Student $student) => $this->presentMatch($student))
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function findMatchingGuardians(array $guardianInput): array
    {
        $matches = collect();

        if (! empty($guardianInput['phone'])) {
            $matches = $matches->merge(
                Guardian::query()->where('phone', $guardianInput['phone'])->with('students')->limit(3)->get()
            );
        }

        if (! empty($guardianInput['email'])) {
            $matches = $matches->merge(
                Guardian::query()->where('email', mb_strtolower($guardianInput['email']))->with('students')->limit(3)->get()
            );
        }

        return $matches
            ->unique(fn (Guardian $guardian) => $guardian->public_id)
            ->map(fn (Guardian $guardian) => [
                'id' => $guardian->public_id,
                'name' => $guardian->name,
                'phone' => $guardian->phone,
                'email' => $guardian->email,
                'hasAccount' => $guardian->user_id !== null,
                'linkedStudents' => $guardian->students->map(fn (Student $s) => trim("{$s->first_name} {$s->last_name}"))->values()->all(),
            ])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function presentMatch(Student $student): array
    {
        $enrollment = $student->enrollments->first();

        return [
            'id' => $student->public_id,
            'fullName' => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
            'admissionNumber' => $student->admission_number,
            'dateOfBirth' => $student->date_of_birth?->toDateString(),
            'status' => $student->status,
            'className' => $enrollment?->schoolClass?->name,
            'matchReason' => 'Possible existing student found',
        ];
    }
}
