<?php

namespace Database\Seeders;

use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Announcement;
use App\Models\Assessment;
use App\Models\AssessmentScore;
use App\Models\AttendanceRecord;
use App\Models\Campus;
use App\Models\Employee;
use App\Models\Enrollment;
use App\Models\Guardian;
use App\Models\LibraryResource;
use App\Models\Message;
use App\Models\PaymentTransaction;
use App\Models\ResultPublication;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\Term;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seeds Royal Gateway Academy (Demo) as a full walkthrough school:
 * classes, students, staff links, attendance, assessments, results,
 * announcements, messages, payments, and library — for every school role.
 * Local / XAMPP only.
 */
class DemoTenantDataSeeder extends Seeder
{
    public function run(): void
    {
        $school = Tenant::query()
            ->where('slug', DemoUsersSeeder::DEMO_SCHOOL_SLUG)
            ->firstOrFail();

        $context = app(TenantContext::class);
        $context->set($school);

        try {
            $campus = Campus::query()->firstOrCreate(
                ['tenant_id' => $school->getKey(), 'code' => 'MAIN'],
                ['name' => 'Main Campus', 'status' => 'active', 'public_id' => (string) Str::ulid()],
            );

            $session = AcademicSession::query()->firstOrCreate(
                ['tenant_id' => $school->getKey(), 'name' => '2025/2026'],
                [
                    'starts_at' => '2025-09-01',
                    'ends_at' => '2026-07-31',
                    'is_current' => true,
                    'status' => 'active',
                ],
            );
            $session->forceFill([
                'starts_at' => '2025-09-01',
                'ends_at' => '2026-07-31',
                'is_current' => true,
                'status' => 'active',
            ])->save();

            AcademicSession::query()
                ->where('tenant_id', $school->getKey())
                ->whereKeyNot($session->getKey())
                ->update(['is_current' => false]);

            $terms = [];
            foreach ([
                ['First Term', 1, '2025-09-01', '2025-12-15'],
                ['Second Term', 2, '2026-01-08', '2026-04-10'],
                ['Third Term', 3, '2026-04-20', '2026-07-31'],
            ] as [$name, $sequence, $start, $end]) {
                $term = Term::query()->updateOrCreate(
                    [
                        'tenant_id' => $school->getKey(),
                        'academic_session_id' => $session->getKey(),
                        'sequence' => $sequence,
                    ],
                    [
                        'name' => $name,
                        'starts_at' => $start,
                        'ends_at' => $end,
                        'is_current' => $sequence === 1,
                    ],
                );
                $terms[$sequence] = $term;
            }

            $currentTerm = $terms[1];

            $classDefs = [
                ['Grade 6', 'A', 'primary'],
                ['Grade 6', 'B', 'primary'],
                ['Grade 7', 'B', 'junior_secondary'],
                ['Grade 8', 'A', 'junior_secondary'],
                ['Grade 9', 'A', 'junior_secondary'],
                ['JSS 2', 'A', 'junior_secondary'],
                ['JSS 2', 'B', 'junior_secondary'],
                ['JSS 3', 'A', 'junior_secondary'],
                ['Primary 6', 'A', 'primary'],
            ];

            $classes = [];
            foreach ($classDefs as [$name, $arm, $level]) {
                $class = SchoolClass::query()->firstOrCreate(
                    [
                        'tenant_id' => $school->getKey(),
                        'campus_id' => $campus->getKey(),
                        'name' => $name,
                        'arm' => $arm,
                    ],
                    [
                        'educational_level' => $level,
                        'capacity' => 40,
                        'status' => 'active',
                    ],
                );
                $classes["{$name} {$arm}"] = $class;
            }

            $subjects = [];
            foreach ([
                ['Mathematics', 'MATH'],
                ['English Language', 'ENG'],
                ['Basic Science', 'BSC'],
                ['Civic Education', 'CIV'],
                ['Computer Studies', 'CMP'],
            ] as [$subjectName, $code]) {
                $subjects[$code] = Subject::query()->firstOrCreate(
                    ['tenant_id' => $school->getKey(), 'code' => $code],
                    [
                        'name' => $subjectName,
                        'status' => 'active',
                    ],
                );
            }

            $jss2a = $classes['JSS 2 A'];
            foreach (['MATH', 'ENG', 'BSC', 'CIV', 'CMP'] as $code) {
                DB::table('class_subject')->updateOrInsert(
                    [
                        'tenant_id' => $school->getKey(),
                        'class_id' => $jss2a->getKey(),
                        'subject_id' => $subjects[$code]->getKey(),
                    ],
                    [],
                );
            }

            $studentsByAdmission = [];
            foreach ($this->demoStudents() as $row) {
                $classKey = $row['classArm'];
                $class = $classes[$classKey] ?? $classes['JSS 2 A'];

                $student = Student::query()->updateOrCreate(
                    [
                        'tenant_id' => $school->getKey(),
                        'admission_number' => $row['admissionNo'],
                    ],
                    [
                        'first_name' => $row['firstName'],
                        'last_name' => $row['lastName'],
                        'gender' => strtolower($row['gender']),
                        'date_of_birth' => $row['dob'],
                        'nationality' => $row['nationality'],
                        'state_of_origin' => $row['stateOfOrigin'],
                        'admission_date' => $row['admissionDate'],
                        'status' => 'active',
                        'metadata' => [
                            'demo_key' => $row['id'],
                            'photo_url' => $row['photo'],
                            'current_average' => $row['currentAverage'],
                            'attendance_rate' => $row['attendanceRate'],
                            'fees_status' => $row['feesStatus'],
                            'outstanding_fees' => $row['outstandingFees'],
                            'trend' => $row['trend'],
                            'trend_percent' => $row['trendPercent'],
                        ],
                    ],
                );

                Enrollment::query()->updateOrCreate(
                    [
                        'tenant_id' => $school->getKey(),
                        'student_id' => $student->getKey(),
                        'academic_session_id' => $session->getKey(),
                    ],
                    [
                        'class_id' => $class->getKey(),
                        'status' => 'active',
                    ],
                );

                $guardian = Guardian::query()->updateOrCreate(
                    [
                        'tenant_id' => $school->getKey(),
                        'email' => $row['guardianEmail'],
                    ],
                    [
                        'name' => $row['guardianName'],
                        'phone' => $row['guardianPhone'],
                        'address' => ['text' => 'Lagos, Nigeria'],
                    ],
                );

                if (! $student->guardians()->where('guardians.id', $guardian->getKey())->exists()) {
                    $student->guardians()->attach($guardian->getKey(), [
                        'tenant_id' => $school->getKey(),
                        'relationship' => $row['guardianRelationship'],
                        'preferred_contact' => true,
                        'billing_responsible' => true,
                        'authorized_pickup' => true,
                    ]);
                }

                $studentsByAdmission[$row['admissionNo']] = $student;
            }

            $users = $this->demoUsersByEmail([
                'admin@royalgateway.edu.ng',
                'principal@royalgateway.edu.ng',
                'adewale.o@royalgateway.edu.ng',
                'bursar@royalgateway.edu.ng',
                'exams@royalgateway.edu.ng',
                'bello.folashade@gmail.com',
                'nathan.bello@student.royalgateway.edu.ng',
            ]);

            $this->linkIdentities($users, $studentsByAdmission);
            $this->seedStaff($school, $users);
            $this->seedTeacherAssignments($school, $users, $classes, $subjects, $session);
            $this->seedAttendance($school, $users, $classes, $session, $currentTerm, $studentsByAdmission);
            $this->seedAssessmentsAndResults($school, $users, $classes, $subjects, $session, $currentTerm, $studentsByAdmission);
            $this->seedCommunications($school, $users);
            $this->seedPayments($school, $studentsByAdmission);
            $this->seedLibrary($school, $users, $subjects);

            $school->update([
                'quota_usage' => array_merge($school->quota_usage ?? [], [
                    'students' => Student::query()->where('tenant_id', $school->getKey())->count(),
                    'users' => User::query()
                        ->whereHas('memberships', fn ($q) => $q->where('tenant_id', $school->getKey()))
                        ->count(),
                ]),
            ]);
        } finally {
            $context->clear();
        }

        $this->command?->info('Demo school walkthrough data seeded for all roles (Royal Gateway Academy).');
    }

    /**
     * @param  list<string>  $emails
     * @return array<string, User>
     */
    private function demoUsersByEmail(array $emails): array
    {
        $users = [];
        foreach ($emails as $email) {
            $user = User::query()->where('email', mb_strtolower($email))->first();
            if ($user) {
                $users[mb_strtolower($email)] = $user;
            }
        }

        return $users;
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, Student>  $studentsByAdmission
     */
    private function linkIdentities(array $users, array $studentsByAdmission): void
    {
        $parent = $users['bello.folashade@gmail.com'] ?? null;
        if ($parent) {
            Guardian::query()
                ->where('email', 'bello.folashade@gmail.com')
                ->update(['user_id' => $parent->getKey()]);
        }

        $studentUser = $users['nathan.bello@student.royalgateway.edu.ng'] ?? null;
        $nathan = $studentsByAdmission['RGA26/1006'] ?? null;
        if ($studentUser && $nathan) {
            $nathan->forceFill(['user_id' => $studentUser->getKey()])->save();
        }
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedStaff(Tenant $school, array $users): void
    {
        $staff = [
            ['admin@royalgateway.edu.ng', 'RGA-E-001', 'Demo School Admin', 'full_time'],
            ['principal@royalgateway.edu.ng', 'RGA-E-002', 'Mrs. Adeyemi', 'full_time'],
            ['adewale.o@royalgateway.edu.ng', 'RGA-E-003', 'Mr. Adewale', 'full_time'],
            ['bursar@royalgateway.edu.ng', 'RGA-E-004', 'Mrs. Okonkwo', 'full_time'],
            ['exams@royalgateway.edu.ng', 'RGA-E-005', 'Mr. Danladi', 'full_time'],
        ];

        foreach ($staff as [$email, $number, $name, $type]) {
            $user = $users[$email] ?? null;
            Employee::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'employee_number' => $number,
                ],
                [
                    'user_id' => $user?->getKey(),
                    'name' => $name,
                    'employment_type' => $type,
                    'started_at' => '2023-09-01',
                    'status' => 'active',
                ],
            );
        }
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, SchoolClass>  $classes
     * @param  array<string, Subject>  $subjects
     */
    private function seedTeacherAssignments(
        Tenant $school,
        array $users,
        array $classes,
        array $subjects,
        AcademicSession $session,
    ): void {
        $teacher = $users['adewale.o@royalgateway.edu.ng'] ?? null;
        if (! $teacher) {
            return;
        }

        foreach ([
            ['JSS 2 A', 'MATH'],
            ['JSS 2 A', 'ENG'],
            ['JSS 2 B', 'MATH'],
        ] as [$classKey, $subjectCode]) {
            TeacherAssignment::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'user_id' => $teacher->getKey(),
                    'class_id' => $classes[$classKey]->getKey(),
                    'subject_id' => $subjects[$subjectCode]->getKey(),
                    'academic_session_id' => $session->getKey(),
                ],
                [
                    'assignment_type' => 'subject_teacher',
                ],
            );
        }
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, SchoolClass>  $classes
     * @param  array<string, Student>  $studentsByAdmission
     */
    private function seedAttendance(
        Tenant $school,
        array $users,
        array $classes,
        AcademicSession $session,
        Term $term,
        array $studentsByAdmission,
    ): void {
        $teacher = $users['adewale.o@royalgateway.edu.ng'] ?? $users['admin@royalgateway.edu.ng'] ?? null;
        if (! $teacher) {
            return;
        }

        $class = $classes['JSS 2 A'];
        $enrolled = Student::query()
            ->where('tenant_id', $school->getKey())
            ->whereHas('enrollments', fn ($q) => $q->where('class_id', $class->getKey())->where('academic_session_id', $session->getKey()))
            ->get();

        if ($enrolled->isEmpty()) {
            $enrolled = collect([$studentsByAdmission['RGA26/1006'] ?? null])->filter();
        }

        foreach (range(0, 9) as $daysAgo) {
            $date = now()->subDays($daysAgo)->toDateString();
            foreach ($enrolled as $index => $student) {
                $status = 'present';
                if ($daysAgo === 2 && $index === 0) {
                    $status = 'late';
                }
                if ($daysAgo === 5 && $student->admission_number === 'RGA26/1007') {
                    $status = 'absent';
                }

                AttendanceRecord::query()->updateOrCreate(
                    [
                        'tenant_id' => $school->getKey(),
                        'student_id' => $student->getKey(),
                        'class_id' => $class->getKey(),
                        'attendance_date' => $date,
                    ],
                    [
                        'academic_session_id' => $session->getKey(),
                        'term_id' => $term->getKey(),
                        'status' => $status,
                        'recorded_by' => $teacher->getKey(),
                        'public_id' => (string) Str::ulid(),
                    ],
                );
            }
        }
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, SchoolClass>  $classes
     * @param  array<string, Subject>  $subjects
     * @param  array<string, Student>  $studentsByAdmission
     */
    private function seedAssessmentsAndResults(
        Tenant $school,
        array $users,
        array $classes,
        array $subjects,
        AcademicSession $session,
        Term $term,
        array $studentsByAdmission,
    ): void {
        $teacher = $users['adewale.o@royalgateway.edu.ng'] ?? null;
        $principal = $users['principal@royalgateway.edu.ng'] ?? $users['admin@royalgateway.edu.ng'] ?? null;
        $exams = $users['exams@royalgateway.edu.ng'] ?? $teacher;
        if (! $teacher || ! $principal) {
            return;
        }

        $class = $classes['JSS 2 A'];
        $enrolled = Student::query()
            ->where('tenant_id', $school->getKey())
            ->whereHas('enrollments', fn ($q) => $q->where('class_id', $class->getKey())->where('academic_session_id', $session->getKey()))
            ->get();

        if ($enrolled->isEmpty() && isset($studentsByAdmission['RGA26/1006'])) {
            $enrolled = collect([$studentsByAdmission['RGA26/1006']]);
        }

        $assessmentDefs = [
            ['First Term Mathematics CA1', 'MATH', 'continuous_assessment', 40],
            ['First Term English Language Test', 'ENG', 'test', 40],
            ['First Term Basic Science Quiz', 'BSC', 'quiz', 20],
        ];

        foreach ($assessmentDefs as [$title, $subjectCode, $type, $max]) {
            $assessment = Assessment::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'class_id' => $class->getKey(),
                    'subject_id' => $subjects[$subjectCode]->getKey(),
                    'academic_session_id' => $session->getKey(),
                    'term_id' => $term->getKey(),
                    'title' => $title,
                ],
                [
                    'created_by' => ($exams ?? $teacher)->getKey(),
                    'type' => $type,
                    'maximum_score' => $max,
                    'status' => 'submitted',
                    'scheduled_at' => now()->subDays(14),
                    'published_at' => now()->subDays(7),
                    'public_id' => (string) Str::ulid(),
                ],
            );

            foreach ($enrolled as $student) {
                $base = (float) ($student->metadata['current_average'] ?? 70);
                $score = round(min($max, max(8, ($base / 100) * $max + random_int(-3, 3))), 1);

                AssessmentScore::query()->updateOrCreate(
                    [
                        'tenant_id' => $school->getKey(),
                        'assessment_id' => $assessment->getKey(),
                        'student_id' => $student->getKey(),
                    ],
                    [
                        'score' => $score,
                        'status' => 'submitted',
                        'graded_by' => $teacher->getKey(),
                        'submitted_at' => now()->subDays(10),
                        'graded_at' => now()->subDays(8),
                        'public_id' => (string) Str::ulid(),
                    ],
                );
            }
        }

        foreach ($enrolled as $student) {
            ResultPublication::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'student_id' => $student->getKey(),
                    'academic_session_id' => $session->getKey(),
                    'term_id' => $term->getKey(),
                ],
                [
                    'status' => 'published',
                    'published_at' => now()->subDays(3),
                    'published_by' => $principal->getKey(),
                    'public_id' => (string) Str::ulid(),
                ],
            );
        }
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedCommunications(Tenant $school, array $users): void
    {
        $admin = $users['admin@royalgateway.edu.ng'] ?? null;
        $principal = $users['principal@royalgateway.edu.ng'] ?? $admin;
        $teacher = $users['adewale.o@royalgateway.edu.ng'] ?? $admin;
        $parent = $users['bello.folashade@gmail.com'] ?? null;
        $student = $users['nathan.bello@student.royalgateway.edu.ng'] ?? null;

        if ($principal) {
            Announcement::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'title' => 'First Term Mid-Term Break Notice',
                ],
                [
                    'body' => 'Dear parents and students, mid-term break runs from Friday to Monday. Classes resume Tuesday. Please ensure all library books are returned.',
                    'audience' => ['parents', 'students', 'staff'],
                    'status' => 'published',
                    'published_at' => now()->subDays(2),
                    'created_by' => $principal->getKey(),
                    'public_id' => (string) Str::ulid(),
                ],
            );

            Announcement::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'title' => 'Staff Briefing — Continuous Assessment Week',
                ],
                [
                    'body' => 'All subject teachers should finalise CA1 scores by Friday. Examination officer will lock mark sheets thereafter.',
                    'audience' => ['staff'],
                    'status' => 'published',
                    'published_at' => now()->subDay(),
                    'created_by' => $principal->getKey(),
                    'public_id' => (string) Str::ulid(),
                ],
            );
        }

        if ($teacher && $parent) {
            Message::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'sender_id' => $teacher->getKey(),
                    'recipient_id' => $parent->getKey(),
                    'body' => 'Good afternoon Mrs. Bello. Nathan is doing well in Mathematics. Please encourage him to practise the homework set for Friday.',
                ],
                [
                    'public_id' => (string) Str::ulid(),
                    'read_at' => null,
                ],
            );
        }

        if ($admin && $student) {
            Message::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'sender_id' => $admin->getKey(),
                    'recipient_id' => $student->getKey(),
                    'body' => 'Nathan, your First Term results are now published. Open Results to view your report summary.',
                ],
                [
                    'public_id' => (string) Str::ulid(),
                    'read_at' => null,
                ],
            );
        }
    }

    /**
     * @param  array<string, Student>  $studentsByAdmission
     */
    private function seedPayments(Tenant $school, array $studentsByAdmission): void
    {
        $nathan = $studentsByAdmission['RGA26/1006'] ?? null;
        $michael = $studentsByAdmission['RGA26/1003'] ?? null;

        $payments = [
            [
                'ref' => 'RGA-PAY-DEMO-001',
                'amount' => 15000000,
                'status' => 'succeeded',
                'student' => $nathan,
                'label' => 'First Term Tuition (partial)',
                'paid' => true,
            ],
            [
                'ref' => 'RGA-PAY-DEMO-002',
                'amount' => 4500000,
                'status' => 'pending',
                'student' => $nathan,
                'label' => 'Outstanding First Term balance',
                'paid' => false,
            ],
            [
                'ref' => 'RGA-PAY-DEMO-003',
                'amount' => 2500000,
                'status' => 'succeeded',
                'student' => $michael,
                'label' => 'Library & PTA levy',
                'paid' => true,
            ],
        ];

        foreach ($payments as $payment) {
            if (! $payment['student']) {
                continue;
            }

            PaymentTransaction::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'idempotency_key' => $payment['ref'],
                ],
                [
                    'provider' => 'paystack',
                    'provider_reference' => $payment['ref'],
                    'amount_minor' => $payment['amount'],
                    'currency' => 'NGN',
                    'status' => $payment['status'],
                    'paid_at' => $payment['paid'] ? now()->subDays(12) : null,
                    'metadata' => [
                        'student_admission' => $payment['student']->admission_number,
                        'student_name' => trim($payment['student']->first_name.' '.$payment['student']->last_name),
                        'label' => $payment['label'],
                        'demo' => true,
                    ],
                    'public_id' => (string) Str::ulid(),
                ],
            );
        }
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, Subject>  $subjects
     */
    private function seedLibrary(Tenant $school, array $users, array $subjects): void
    {
        $teacher = $users['adewale.o@royalgateway.edu.ng'] ?? $users['admin@royalgateway.edu.ng'] ?? null;
        if (! $teacher) {
            return;
        }

        LibraryResource::query()->updateOrCreate(
            [
                'tenant_id' => $school->getKey(),
                'slug' => 'jss2-algebra-basics',
            ],
            [
                'title' => 'JSS 2 Algebra Basics',
                'description' => 'Introductory algebra notes for First Term — expressions, simple equations, and word problems.',
                'author' => 'Mr. Adewale',
                'resource_type' => 'note',
                'educational_level' => 'junior_secondary',
                'class_name' => 'JSS 2',
                'subject_id' => $subjects['MATH']->getKey(),
                'subject_label' => 'Mathematics',
                'term_label' => 'First Term',
                'topic' => 'Algebra',
                'estimated_study_minutes' => 35,
                'access_tier' => 'free',
                'source_label' => 'Royal Gateway Academy',
                'learning_objectives' => ['Simplify algebraic expressions', 'Solve linear equations'],
                'school_approved' => true,
                'is_public' => false,
                'created_by' => $teacher->getKey(),
                'updated_by' => $teacher->getKey(),
                'status' => 'published',
                'published_at' => now()->subDays(5),
                'public_id' => (string) Str::ulid(),
            ],
        );

        LibraryResource::query()->updateOrCreate(
            [
                'tenant_id' => $school->getKey(),
                'slug' => 'english-comprehension-practice',
            ],
            [
                'title' => 'English Comprehension Practice Pack',
                'description' => 'Short passages with questions for JSS 2 continuous assessment practice.',
                'author' => 'English Department',
                'resource_type' => 'worksheet',
                'educational_level' => 'junior_secondary',
                'class_name' => 'JSS 2',
                'subject_id' => $subjects['ENG']->getKey(),
                'subject_label' => 'English Language',
                'term_label' => 'First Term',
                'topic' => 'Comprehension',
                'estimated_study_minutes' => 25,
                'access_tier' => 'free',
                'source_label' => 'Royal Gateway Academy',
                'school_approved' => true,
                'is_public' => false,
                'created_by' => $teacher->getKey(),
                'updated_by' => $teacher->getKey(),
                'status' => 'published',
                'published_at' => now()->subDays(4),
                'public_id' => (string) Str::ulid(),
            ],
        );
    }

    /**
     * Mirrors src/data/mockData.ts INITIAL_STUDENTS.
     *
     * @return list<array<string, mixed>>
     */
    private function demoStudents(): array
    {
        return [
            [
                'id' => 'stu_1', 'admissionNo' => 'RGA26/1001', 'firstName' => 'Aarav', 'lastName' => 'Johnson',
                'photo' => 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'Grade 6 A', 'gender' => 'Male', 'dob' => '2014-03-15', 'stateOfOrigin' => 'Lagos',
                'nationality' => 'Nigerian', 'admissionDate' => '2022-09-10', 'guardianName' => 'Samuel Johnson',
                'guardianPhone' => '+234 803 219 4481', 'guardianEmail' => 'sam.johnson@gmail.com',
                'guardianRelationship' => 'Father', 'currentAverage' => 82, 'attendanceRate' => 98,
                'feesStatus' => 'Paid', 'outstandingFees' => 0, 'trend' => 'improving', 'trendPercent' => 5,
            ],
            [
                'id' => 'stu_2', 'admissionNo' => 'RGA26/1002', 'firstName' => 'Zara', 'lastName' => 'Okafor',
                'photo' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'Grade 7 B', 'gender' => 'Female', 'dob' => '2013-07-22', 'stateOfOrigin' => 'Anambra',
                'nationality' => 'Nigerian', 'admissionDate' => '2023-09-08', 'guardianName' => 'Ngozi Okafor',
                'guardianPhone' => '+234 802 876 1123', 'guardianEmail' => 'ngozi.okafor@gmail.com',
                'guardianRelationship' => 'Mother', 'currentAverage' => 88, 'attendanceRate' => 97,
                'feesStatus' => 'Paid', 'outstandingFees' => 0, 'trend' => 'improving', 'trendPercent' => 8,
            ],
            [
                'id' => 'stu_3', 'admissionNo' => 'RGA26/1003', 'firstName' => 'Michael', 'lastName' => 'Boateng',
                'photo' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'Grade 8 A', 'gender' => 'Male', 'dob' => '2012-11-04', 'stateOfOrigin' => 'Oyo',
                'nationality' => 'Nigerian', 'admissionDate' => '2021-09-12', 'guardianName' => 'Kwame Boateng',
                'guardianPhone' => '+234 814 990 4455', 'guardianEmail' => 'kboateng@yahoo.com',
                'guardianRelationship' => 'Father', 'currentAverage' => 76, 'attendanceRate' => 94,
                'feesStatus' => 'Partial', 'outstandingFees' => 25000, 'trend' => 'steady', 'trendPercent' => 1,
            ],
            [
                'id' => 'stu_4', 'admissionNo' => 'RGA26/1004', 'firstName' => 'Fatima', 'lastName' => 'Yusuf',
                'photo' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'Grade 6 B', 'gender' => 'Female', 'dob' => '2014-05-18', 'stateOfOrigin' => 'Kano',
                'nationality' => 'Nigerian', 'admissionDate' => '2024-01-15', 'guardianName' => 'Ibrahim Yusuf',
                'guardianPhone' => '+234 809 112 3344', 'guardianEmail' => 'i.yusuf@kntrading.com',
                'guardianRelationship' => 'Father', 'currentAverage' => 58, 'attendanceRate' => 92,
                'feesStatus' => 'Paid', 'outstandingFees' => 0, 'trend' => 'declining', 'trendPercent' => -6,
            ],
            [
                'id' => 'stu_5', 'admissionNo' => 'RGA26/1005', 'firstName' => 'Daniel', 'lastName' => 'Mensah',
                'photo' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'Grade 9 A', 'gender' => 'Male', 'dob' => '2011-09-30', 'stateOfOrigin' => 'Ogun',
                'nationality' => 'Nigerian', 'admissionDate' => '2020-09-14', 'guardianName' => 'Gladys Mensah',
                'guardianPhone' => '+234 803 765 4321', 'guardianEmail' => 'g.mensah@gmail.com',
                'guardianRelationship' => 'Mother', 'currentAverage' => 79, 'attendanceRate' => 95,
                'feesStatus' => 'Paid', 'outstandingFees' => 0, 'trend' => 'improving', 'trendPercent' => 4,
            ],
            [
                'id' => 'stu_6', 'admissionNo' => 'RGA26/1006', 'firstName' => 'Nathan', 'lastName' => 'Bello',
                'photo' => 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'JSS 2 A', 'gender' => 'Male', 'dob' => '2013-02-14', 'stateOfOrigin' => 'Kogi',
                'nationality' => 'Nigerian', 'admissionDate' => '2023-09-11', 'guardianName' => 'Folashade Bello',
                'guardianPhone' => '+234 803 555 7890', 'guardianEmail' => 'bello.folashade@gmail.com',
                'guardianRelationship' => 'Mother', 'currentAverage' => 74, 'attendanceRate' => 96,
                'feesStatus' => 'Partial', 'outstandingFees' => 45000, 'trend' => 'improving', 'trendPercent' => 6,
            ],
            [
                'id' => 'stu_7', 'admissionNo' => 'RGA26/1007', 'firstName' => 'David', 'lastName' => 'Okafor',
                'photo' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'JSS 2 A', 'gender' => 'Male', 'dob' => '2013-08-19', 'stateOfOrigin' => 'Enugu',
                'nationality' => 'Nigerian', 'admissionDate' => '2023-09-11', 'guardianName' => 'Chidi Okafor',
                'guardianPhone' => '+234 802 334 9911', 'guardianEmail' => 'c.okafor@gmail.com',
                'guardianRelationship' => 'Father', 'currentAverage' => 64, 'attendanceRate' => 76,
                'feesStatus' => 'Paid', 'outstandingFees' => 0, 'trend' => 'declining', 'trendPercent' => -9,
            ],
            [
                'id' => 'stu_8', 'admissionNo' => 'RGA26/1008', 'firstName' => 'Emmanuel', 'lastName' => 'John',
                'photo' => 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'Primary 6 A', 'gender' => 'Male', 'dob' => '2014-12-05', 'stateOfOrigin' => 'Akwa Ibom',
                'nationality' => 'Nigerian', 'admissionDate' => '2022-09-10', 'guardianName' => 'Victoria John',
                'guardianPhone' => '+234 812 778 9900', 'guardianEmail' => 'v.john@outlook.com',
                'guardianRelationship' => 'Mother', 'currentAverage' => 71, 'attendanceRate' => 91,
                'feesStatus' => 'Overdue', 'outstandingFees' => 70000, 'trend' => 'steady', 'trendPercent' => 0,
            ],
            [
                'id' => 'stu_9', 'admissionNo' => 'RGA26/1009', 'firstName' => 'Grace', 'lastName' => 'Mark',
                'photo' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
                'classArm' => 'JSS 3 A', 'gender' => 'Female', 'dob' => '2012-04-10', 'stateOfOrigin' => 'Rivers',
                'nationality' => 'Nigerian', 'admissionDate' => '2022-09-10', 'guardianName' => 'Mark Peters',
                'guardianPhone' => '+234 805 123 4567', 'guardianEmail' => 'm.peters@yahoo.com',
                'guardianRelationship' => 'Father', 'currentAverage' => 67, 'attendanceRate' => 88,
                'feesStatus' => 'Paid', 'outstandingFees' => 0, 'trend' => 'improving', 'trendPercent' => 3,
            ],
        ];
    }
}
