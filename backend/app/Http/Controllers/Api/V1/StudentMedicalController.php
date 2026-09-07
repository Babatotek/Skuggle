<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentMedicalInformation;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentMedicalController extends Controller
{
    public function show(string $student): JsonResponse
    {
        $record = Student::query()->where('public_id', $student)->firstOrFail();
        $this->authorize('viewMedical', $record);

        $medical = $record->medicalInformation;

        return ApiResponse::success($medical ? $this->present($medical) : null);
    }

    public function update(string $student, Request $request, AuditLogger $audit): JsonResponse
    {
        $record = Student::query()->where('public_id', $student)->firstOrFail();
        $this->authorize('updateMedical', $record);

        $data = $request->validate([
            'bloodGroup' => ['nullable', 'string', 'max:8'],
            'genotype' => ['nullable', 'string', 'max:8'],
            'conditions' => ['nullable', 'string', 'max:5000'],
            'allergies' => ['nullable', 'string', 'max:5000'],
            'medications' => ['nullable', 'string', 'max:5000'],
            'dietaryRestrictions' => ['nullable', 'string', 'max:5000'],
            'disabilityNeeds' => ['nullable', 'string', 'max:5000'],
            'specialEducationalNeeds' => ['nullable', 'string', 'max:5000'],
            'emergencyNotes' => ['nullable', 'string', 'max:5000'],
        ]);

        $medical = StudentMedicalInformation::query()->updateOrCreate(
            ['student_id' => $record->getKey()],
            array_merge([
                'updated_by' => $request->user()->getKey(),
            ], [
                'blood_group' => $data['bloodGroup'] ?? null,
                'genotype' => $data['genotype'] ?? null,
                'conditions' => $data['conditions'] ?? null,
                'allergies' => $data['allergies'] ?? null,
                'medications' => $data['medications'] ?? null,
                'dietary_restrictions' => $data['dietaryRestrictions'] ?? null,
                'disability_needs' => $data['disabilityNeeds'] ?? null,
                'special_educational_needs' => $data['specialEducationalNeeds'] ?? null,
                'emergency_notes' => $data['emergencyNotes'] ?? null,
            ]),
        );

        $audit->record('student.medical_updated', $record, [], ['student_id' => $record->public_id]);

        return ApiResponse::success($this->present($medical));
    }

    /** @return array<string, mixed> */
    private function present(StudentMedicalInformation $medical): array
    {
        return [
            'bloodGroup' => $medical->blood_group,
            'genotype' => $medical->genotype,
            'conditions' => $medical->conditions,
            'allergies' => $medical->allergies,
            'medications' => $medical->medications,
            'dietaryRestrictions' => $medical->dietary_restrictions,
            'disabilityNeeds' => $medical->disability_needs,
            'specialEducationalNeeds' => $medical->special_educational_needs,
            'emergencyNotes' => $medical->emergency_notes,
            'updatedAt' => $medical->updated_at?->toIso8601String(),
        ];
    }
}
