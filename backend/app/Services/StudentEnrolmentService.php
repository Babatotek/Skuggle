<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Exceptions\ApiException;
use App\Models\AcademicSession;
use App\Models\Guardian;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentMedicalInformation;
use App\Models\StudentStatusHistory;
use App\Models\Term;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

final class StudentEnrolmentService
{
    public function __construct(
        private readonly TenantContext $context,
        private readonly AdmissionNumberGenerator $admissionNumbers,
        private readonly CustomFieldRegistry $customFields,
        private readonly StudentProfileCompletenessCalculator $completeness,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function enrol(array $data, ?UploadedFile $photo = null, ?User $actor = null): Student
    {
        $isDraft = ($data['status'] ?? '') === 'draft' || ($data['saveAsDraft'] ?? false);
        $validatedCustomFields = $this->customFields->validateValues(
            $this->context->tenant(),
            CustomFieldRegistry::ENTITY_STUDENT,
            $data['customFields'] ?? [],
            ! $isDraft,
        );
        $data['customFields'] = $validatedCustomFields;

        return DB::transaction(function () use ($data, $photo, $actor, $isDraft): Student {

            $class = ! empty($data['classId'])
                ? SchoolClass::query()->where('public_id', $data['classId'])->firstOrFail()
                : null;
            $session = $this->resolveSession($data['academicSessionId'] ?? null, $isDraft);
            $term = $session ? $this->resolveTerm($data['termId'] ?? null, $session) : null;

            $status = $data['status'] ?? ($isDraft ? 'draft' : 'enrolled');
            if (! in_array($status, Student::lifecycleStatuses(), true)) {
                $status = $isDraft ? 'draft' : 'enrolled';
            }

            $admissionNumber = $data['admissionNumber'] ?? null;
            if (! $admissionNumber) {
                $admissionNumber = $this->admissionNumbers->generate(
                    $class?->public_id,
                    $data['admissionType'] ?? null,
                    data_get($data, 'campusCode'),
                );
            }

            $metadata = $this->buildMetadata($data);

            $student = Student::query()->create([
                'admission_number' => $admissionNumber,
                'first_name' => $data['firstName'],
                'middle_name' => $data['middleName'] ?? null,
                'last_name' => $data['lastName'],
                'preferred_name' => $data['preferredName'] ?? null,
                'gender' => $data['gender'] ?? null,
                'date_of_birth' => $data['dateOfBirth'] ?? null,
                'nationality' => $data['nationality'] ?? null,
                'country_code' => $data['countryCode'] ?? null,
                'state_of_origin' => $data['stateOfOrigin'] ?? null,
                'local_government_area' => $data['localGovernmentArea'] ?? null,
                'religion' => $data['religion'] ?? null,
                'admission_date' => $data['admissionDate'] ?? now()->toDateString(),
                'status' => $status,
                'metadata' => $metadata,
            ]);

            if ($class && $session) {
                $student->enrollments()->create([
                    'class_id' => $class->getKey(),
                    'academic_session_id' => $session->getKey(),
                    'term_id' => $term?->getKey(),
                    'status' => in_array($status, ['active', 'enrolled'], true) ? 'active' : 'pending',
                    'admission_type' => $data['admissionType'] ?? null,
                    'student_category' => $data['studentCategory'] ?? null,
                    'boarding_type' => $data['boardingType'] ?? null,
                ]);
            }

            $this->syncGuardians($student, $data['guardians'] ?? []);
            $this->syncMedical($student, $data['medical'] ?? [], $actor);
            $this->storePhoto($student, $photo);

            if ($status !== 'draft') {
                StudentStatusHistory::query()->create([
                    'student_id' => $student->getKey(),
                    'from_status' => null,
                    'to_status' => $status,
                    'reason' => 'Initial enrolment',
                    'changed_by' => $actor?->getKey(),
                    'changed_at' => now(),
                ]);
            }

            $this->provisionPortalAccess($student, $data['portal'] ?? [], $actor);

            $completeness = $this->completeness->calculate($student->fresh(['guardians', 'documents', 'medicalInformation', 'enrollments']));
            $student->update(['profile_completion_percent' => $completeness['percent']]);

            $this->audit->record('student.created', $student, [], [
                'admission_number' => $student->admission_number,
                'status' => $student->status,
                'class' => $class?->public_id,
                'admission_overridden' => isset($data['admissionNumber']),
            ]);

            return $student->fresh(['enrollments.schoolClass', 'enrollments.academicSession', 'guardians', 'medicalInformation']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function buildMetadata(array $data): ?array
    {
        $metadata = [];

        if (! empty($data['residential'])) {
            $metadata['residential'] = $data['residential'];
        }
        if (! empty($data['emergency'])) {
            $metadata['emergency'] = $data['emergency'];
        }
        if (! empty($data['admission'])) {
            $metadata['admission'] = $data['admission'];
        }
        if (! empty($data['portal'])) {
            $metadata['portal'] = array_diff_key($data['portal'], ['parentPassword' => true, 'studentPassword' => true]);
        }
        if (! empty($data['customFields'])) {
            $metadata['custom_fields'] = $data['customFields'];
        }

        return $metadata === [] ? null : $metadata;
    }

    /** @param  list<array<string, mixed>>  $guardians */
    private function syncGuardians(Student $student, array $guardians): void
    {
        foreach ($guardians as $index => $input) {
            if (! empty($input['guardianId'])) {
                $guardian = Guardian::query()->where('public_id', $input['guardianId'])->firstOrFail();
            } else {
                $guardian = Guardian::query()->create([
                    'name' => $input['name'],
                    'phone' => $input['phone'],
                    'email' => isset($input['email']) ? mb_strtolower($input['email']) : null,
                    'address' => isset($input['address']) ? ['text' => $input['address']] : null,
                ]);
            }

            $student->guardians()->attach($guardian->getKey(), [
                'tenant_id' => $student->tenant_id,
                'relationship' => $input['relationship'] ?? 'guardian',
                'preferred_contact' => (bool) ($input['preferredContact'] ?? $index === 0),
                'billing_responsible' => (bool) ($input['billingResponsible'] ?? false),
                'authorized_pickup' => (bool) ($input['authorizedPickup'] ?? false),
                'lives_with_student' => (bool) ($input['livesWithStudent'] ?? false),
            ]);
        }
    }

    /** @param  array<string, mixed>  $medical */
    private function syncMedical(Student $student, array $medical, ?User $actor): void
    {
        if ($medical === []) {
            return;
        }

        StudentMedicalInformation::query()->updateOrCreate(
            ['student_id' => $student->getKey()],
            [
                'blood_group' => $medical['bloodGroup'] ?? null,
                'genotype' => $medical['genotype'] ?? null,
                'conditions' => $medical['conditions'] ?? null,
                'allergies' => $medical['allergies'] ?? null,
                'medications' => $medical['medications'] ?? null,
                'dietary_restrictions' => $medical['dietaryRestrictions'] ?? null,
                'disability_needs' => $medical['disabilityNeeds'] ?? null,
                'special_educational_needs' => $medical['specialEducationalNeeds'] ?? null,
                'emergency_notes' => $medical['emergencyNotes'] ?? null,
                'updated_by' => $actor?->getKey() ?? $this->context->membership()->user_id,
            ],
        );
    }

    private function storePhoto(Student $student, ?UploadedFile $photo): void
    {
        if (! $photo) {
            return;
        }

        $path = $photo->store("students/{$student->public_id}", (string) config('skuggle.library.disk'));
        $student->update(['photo_key' => $path]);
        $this->audit->record('student.photo_changed', $student, [], ['photo_key' => $path]);
    }

    /** @param  array<string, mixed>  $portal */
    private function provisionPortalAccess(Student $student, array $portal, ?User $actor): void
    {
        if (($portal['createStudentLogin'] ?? false) && ! $student->user_id) {
            // Student account linking deferred to invite acceptance workflow
            $this->audit->record('student.portal_requested', $student, [], ['type' => 'student_login']);
        }

        if (($portal['sendParentInvitation'] ?? false) && ! empty($portal['parentEmail'])) {
            $this->audit->record('student.portal_requested', $student, [], [
                'type' => 'parent_invitation',
                'email_hash' => hash('sha256', (string) $portal['parentEmail']),
            ]);
        }
    }

    private function resolveSession(?string $sessionPublicId, bool $allowMissing = false): ?AcademicSession
    {
        if ($sessionPublicId) {
            return AcademicSession::query()->where('public_id', $sessionPublicId)->firstOrFail();
        }

        $session = AcademicSession::query()->where('is_current', true)->first();
        if (! $session && ! $allowMissing) {
            throw new ApiException('ACADEMIC_CONTEXT_REQUIRED', 'Configure an academic session before registering students.', 409);
        }

        return $session;
    }

    private function resolveTerm(?string $termPublicId, AcademicSession $session): ?Term
    {
        if ($termPublicId) {
            return Term::query()->where('public_id', $termPublicId)->where('academic_session_id', $session->getKey())->first();
        }

        return Term::query()->where('academic_session_id', $session->getKey())->where('is_current', true)->first();
    }
}
