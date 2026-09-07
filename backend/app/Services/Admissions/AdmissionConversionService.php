<?php

namespace App\Services\Admissions;

use App\Domain\Admissions\ApplicationStatus;
use App\Exceptions\ApiException;
use App\Models\AdmissionApplication;
use App\Models\AdmissionConversion;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\DuplicateStudentDetector;
use App\Services\StudentEnrolmentService;
use Illuminate\Support\Facades\DB;

final class AdmissionConversionService
{
    public function __construct(
        private readonly DuplicateStudentDetector $duplicates,
        private readonly StudentEnrolmentService $enrolment,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @return array{conversion: AdmissionConversion, created: bool}
     */
    public function convert(AdmissionApplication $application, array $data, User $actor, string $idempotencyKey): array
    {
        return DB::transaction(function () use ($application, $data, $actor, $idempotencyKey): array {
            $locked = AdmissionApplication::query()->lockForUpdate()->findOrFail($application->getKey());
            $existing = $locked->conversion()->with(['student', 'enrollment'])->first();
            if ($existing) {
                return ['conversion' => $existing, 'created' => false];
            }
            if ($locked->statusType() !== ApplicationStatus::Accepted) {
                throw new ApiException('APPLICATION_NOT_ACCEPTED', 'Only accepted applications can be converted to a student.', 409);
            }

            $decision = $locked->decision()->with('offeredClass')->first();
            $classId = $data['classId'] ?? null;
            if (! $classId && $decision?->offered_class_id) {
                $classId = $decision->offeredClass->public_id;
            }
            if (! $classId) {
                $classId = $locked->requestedClass()->first()?->public_id;
            }
            if (! $classId) {
                throw new ApiException('CLASS_PLACEMENT_REQUIRED', 'Select a class before converting this applicant.', 422);
            }
            $birthDate = $locked->birthDate();
            if (! $birthDate || ! $locked->gender) {
                throw new ApiException('APPLICANT_IDENTITY_INCOMPLETE', 'Gender and date of birth are required before conversion.', 422);
            }
            if (! $locked->guardian_name || ! $locked->guardian_phone) {
                throw new ApiException('GUARDIAN_INFORMATION_REQUIRED', 'Guardian name and phone are required before conversion.', 422);
            }

            $guardians = [[
                'name' => $locked->guardian_name,
                'phone' => $locked->guardian_phone,
                'email' => $locked->guardian_email,
                'relationship' => $data['guardianRelationship'] ?? 'guardian',
                'preferredContact' => true,
            ]];
            $matches = $this->duplicates->findPossibleDuplicates([
                'firstName' => $locked->first_name,
                'lastName' => $locked->last_name,
                'dateOfBirth' => $birthDate->toDateString(),
                'guardians' => $guardians,
            ]);
            if ($matches !== []) {
                throw new ApiException('POSSIBLE_DUPLICATE_STUDENT', 'A possible existing student must be resolved before conversion.', 409, [
                    'matches' => $matches,
                ]);
            }

            $student = $this->enrolment->enrol([
                'firstName' => $locked->first_name,
                'middleName' => $locked->middle_name,
                'lastName' => $locked->last_name,
                'gender' => $locked->gender,
                'dateOfBirth' => $birthDate->toDateString(),
                'nationality' => $locked->nationality,
                'admissionDate' => $data['admissionDate'] ?? now()->toDateString(),
                'classId' => $classId,
                'academicSessionId' => $data['academicSessionId'] ?? null,
                'termId' => $data['termId'] ?? null,
                'admissionType' => $data['admissionType'] ?? 'new',
                'studentCategory' => $data['studentCategory'] ?? 'regular',
                'boardingType' => $data['boardingType'] ?? null,
                'status' => 'enrolled',
                'guardians' => $guardians,
                'customFields' => $data['customFields'] ?? [],
                'admission' => [
                    'applicationId' => $locked->public_id,
                    'applicationReference' => $locked->reference,
                ],
            ], null, $actor);

            $enrollment = $student->enrollments->first();
            $conversion = $locked->conversion()->create([
                'student_id' => $student->getKey(),
                'enrollment_id' => $enrollment?->getKey(),
                'idempotency_key' => $idempotencyKey,
                'converted_by' => $actor->getKey(),
                'converted_at' => now(),
            ]);
            $locked->update([
                'status' => ApplicationStatus::Enrolled,
                'status_changed_at' => now(),
                'updated_by' => $actor->getKey(),
            ]);
            $locked->history()->create([
                'from_status' => ApplicationStatus::Accepted,
                'to_status' => ApplicationStatus::Enrolled,
                'reason' => 'Converted to student',
                'metadata' => ['student_public_id' => $student->public_id],
                'changed_by' => $actor->getKey(),
                'changed_at' => now(),
            ]);
            $this->audit->record('admissions.application.converted', $locked, ['status' => ApplicationStatus::Accepted->value], [
                'status' => ApplicationStatus::Enrolled->value,
                'student_id' => $student->public_id,
            ]);

            return ['conversion' => $conversion->load(['student', 'enrollment']), 'created' => true];
        });
    }
}
