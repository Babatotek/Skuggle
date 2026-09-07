<?php

namespace Database\Seeders;

use App\Domain\Admissions\ApplicationStatus;
use App\Domain\Tenancy\TenantContext;
use App\Models\AdmissionApplication;
use App\Models\AdmissionConversion;
use App\Models\AdmissionCycle;
use App\Models\AdmissionDecision;
use App\Models\AdmissionDocument;
use App\Models\AdmissionOfferLetter;
use App\Models\AdmissionScreening;
use App\Models\AdmissionWorkflowHistory;
use App\Models\Campus;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdmissionsSeeder extends Seeder
{
    public function run(): void
    {
        $school = Tenant::query()
            ->where('slug', DemoUsersSeeder::DEMO_SCHOOL_SLUG)
            ->first();

        if (! $school) {
            return;
        }

        $context = app(TenantContext::class);
        $context->set($school);

        try {
            $campus = Campus::query()->firstOrCreate(
                ['tenant_id' => $school->getKey(), 'code' => 'MAIN'],
                ['name' => 'Main Campus', 'status' => 'active', 'public_id' => (string) Str::ulid()]
            );

            // Ensure key admission classes exist
            $admissionClasses = [
                ['JSS 1', 'A', 'junior_secondary'],
                ['JSS 1', 'B', 'junior_secondary'],
                ['JSS 2', 'A', 'junior_secondary'],
                ['JSS 2', 'B', 'junior_secondary'],
                ['Primary 5', 'A', 'primary'],
                ['Grade 6', 'A', 'primary'],
            ];

            $classes = [];
            foreach ($admissionClasses as [$name, $arm, $level]) {
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
                    ]
                );
                $classes["{$name} {$arm}"] = $class;
            }

            // Find staff / admin user for attribution
            $adminUser = User::query()->where('email', DemoUsersSeeder::DEMO_TENANT_EMAIL)->first()
                ?? User::query()->where('email', 'officer@royalgateway.edu.ng')->first()
                ?? User::query()->first();
            $adminId = $adminUser?->getKey();

            // 1. Admission Cycles
            $activeCycle = AdmissionCycle::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'name' => '2025/2026 Academic Intake',
                ],
                [
                    'opens_at' => '2025-05-01',
                    'closes_at' => '2026-09-30',
                    'status' => 'active',
                    'currency' => 'NGN',
                    'application_fee_minor' => 2500000,
                    'settings' => [
                        'require_documents' => true,
                        'auto_screening' => false,
                        'offer_validity_days' => 14,
                    ],
                    'created_by' => $adminId,
                ]
            );

            $pastCycle = AdmissionCycle::query()->updateOrCreate(
                [
                    'tenant_id' => $school->getKey(),
                    'name' => '2024/2025 Regular Intake',
                ],
                [
                    'opens_at' => '2024-05-01',
                    'closes_at' => '2025-08-31',
                    'status' => 'closed',
                    'currency' => 'NGN',
                    'application_fee_minor' => 2000000,
                    'created_by' => $adminId,
                ]
            );

            // 2. Clear existing demo applications to reseed cleanly
            $existingAppIds = AdmissionApplication::query()
                ->where('tenant_id', $school->getKey())
                ->pluck('id');

            if ($existingAppIds->isNotEmpty()) {
                AdmissionDocument::query()->whereIn('admission_application_id', $existingAppIds)->delete();
                AdmissionOfferLetter::query()->whereIn('admission_application_id', $existingAppIds)->delete();
                AdmissionWorkflowHistory::query()->whereIn('admission_application_id', $existingAppIds)->delete();
                AdmissionScreening::query()->whereIn('admission_application_id', $existingAppIds)->delete();
                AdmissionDecision::query()->whereIn('admission_application_id', $existingAppIds)->delete();
                AdmissionConversion::query()->whereIn('admission_application_id', $existingAppIds)->delete();
                AdmissionApplication::query()->whereIn('id', $existingAppIds)->forceDelete();
            }

            // 3. Applications Data Definition
            $applicants = [
                // --- DRAFT (2) ---
                [
                    'ref' => 'APP-202509-DFT001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Draft,
                    'first_name' => 'Zainab',
                    'middle_name' => 'Fatima',
                    'last_name' => 'Ibrahim',
                    'gender' => 'female',
                    'dob' => '2013-04-10',
                    'guardian_name' => 'Alhaji Ibrahim Danladi',
                    'guardian_phone' => '+2348031112233',
                    'guardian_email' => 'danladi.ibrahim@gmail.com',
                    'submitted_at' => null,
                    'created_at' => now()->subDays(2),
                    'notes' => 'Awaiting previous school testimonial and passport photo.',
                ],
                [
                    'ref' => 'APP-202509-DFT002',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 B'] ?? null,
                    'status' => ApplicationStatus::Draft,
                    'first_name' => 'Chinedu',
                    'middle_name' => 'Paul',
                    'last_name' => 'Okeke',
                    'gender' => 'male',
                    'dob' => '2012-11-20',
                    'guardian_name' => 'Dr. Emeka Okeke',
                    'guardian_phone' => '+2348022223344',
                    'guardian_email' => 'e.okeke@outlook.com',
                    'submitted_at' => null,
                    'created_at' => now()->subDays(1),
                    'notes' => 'Draft started via parent self-service portal.',
                ],

                // --- SUBMITTED (3) -> In Screening Queue ---
                [
                    'ref' => 'APP-202509-SUB001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Submitted,
                    'first_name' => 'Favour',
                    'middle_name' => 'Oluwaseun',
                    'last_name' => 'Adeleke',
                    'gender' => 'female',
                    'dob' => '2013-02-15',
                    'guardian_name' => 'Mrs. Funke Adeleke',
                    'guardian_phone' => '+2348055556677',
                    'guardian_email' => 'funke.adeleke@gmail.com',
                    'submitted_at' => now()->subDays(3),
                    'created_at' => now()->subDays(4),
                    'notes' => 'Application complete with birth certificate and Grade 6 report.',
                    'docs' => [['birth_certificate', 'favour_birth_cert.pdf'], ['previous_result', 'primary6_report.pdf']],
                ],
                [
                    'ref' => 'APP-202509-SUB002',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 B'] ?? null,
                    'status' => ApplicationStatus::Submitted,
                    'first_name' => 'Kamsiyochukwu',
                    'middle_name' => 'Chukwudi',
                    'last_name' => 'Eze',
                    'gender' => 'male',
                    'dob' => '2013-06-18',
                    'guardian_name' => 'Chief Ikenna Eze',
                    'guardian_phone' => '+2348077778899',
                    'guardian_email' => 'ikenna.eze@gmail.com',
                    'submitted_at' => now()->subDays(2),
                    'created_at' => now()->subDays(3),
                    'notes' => 'Transfer candidate from Corona School.',
                    'docs' => [['birth_certificate', 'eze_birth_certificate.pdf'], ['previous_result', 'corona_terminal_report.pdf']],
                ],
                [
                    'ref' => 'APP-202509-SUB003',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Submitted,
                    'first_name' => 'Amina',
                    'middle_name' => 'Bilkisu',
                    'last_name' => 'Abdul',
                    'gender' => 'female',
                    'dob' => '2013-08-25',
                    'guardian_name' => 'Malam Abdulrasheed Lawal',
                    'guardian_phone' => '+2348099990011',
                    'guardian_email' => 'abdul.amina@gmail.com',
                    'submitted_at' => now()->subHours(18),
                    'created_at' => now()->subDays(1),
                    'notes' => 'Applied for boarding placement.',
                    'docs' => [['birth_certificate', 'amina_birth_cert.pdf']],
                ],

                // --- SCREENING IN PROGRESS (2) -> In Screening Queue ---
                [
                    'ref' => 'APP-202509-SCR001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Screening,
                    'first_name' => 'Damilola',
                    'middle_name' => 'Eniola',
                    'last_name' => 'Oladipo',
                    'gender' => 'female',
                    'dob' => '2013-01-30',
                    'guardian_name' => 'Engr. Taiwo Oladipo',
                    'guardian_phone' => '+2348123456789',
                    'guardian_email' => 'taiwo.oladipo@yahoo.com',
                    'submitted_at' => now()->subDays(7),
                    'created_at' => now()->subDays(8),
                    'notes' => 'Entrance examination and oral interview scheduled.',
                    'screening' => ['status' => 'scheduled', 'scheduled_at' => now()->addDay()],
                    'docs' => [['birth_certificate', 'damilola_birth_certificate.pdf'], ['immunization_record', 'immunization_card.pdf']],
                ],
                [
                    'ref' => 'APP-202509-SCR002',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 2 A'] ?? null,
                    'status' => ApplicationStatus::Screening,
                    'first_name' => 'Victor',
                    'middle_name' => 'Chibuike',
                    'last_name' => 'Okafor',
                    'gender' => 'male',
                    'dob' => '2012-09-14',
                    'guardian_name' => 'Barrister Obi Okafor',
                    'guardian_phone' => '+2348134567890',
                    'guardian_email' => 'obi.okafor@gmail.com',
                    'submitted_at' => now()->subDays(6),
                    'created_at' => now()->subDays(7),
                    'notes' => 'Direct transfer assessment for JSS 2.',
                    'screening' => ['status' => 'scheduled', 'scheduled_at' => now()->addDays(2)],
                    'docs' => [['birth_certificate', 'victor_birth_cert.pdf'], ['previous_result', 'jss1_transcript.pdf']],
                ],

                // --- SCREENED (3) -> In Decisions Queue ---
                [
                    'ref' => 'APP-202509-SCD001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Screened,
                    'first_name' => 'Somtochukwu',
                    'middle_name' => 'Franklin',
                    'last_name' => 'Nwosu',
                    'gender' => 'male',
                    'dob' => '2013-03-22',
                    'guardian_name' => 'Mrs. Ngozi Nwosu',
                    'guardian_phone' => '+2348145678901',
                    'guardian_email' => 'ngozi.nwosu@gmail.com',
                    'submitted_at' => now()->subDays(10),
                    'created_at' => now()->subDays(12),
                    'notes' => 'Candidate demonstrated strong aptitude in STEM subjects.',
                    'screening' => ['status' => 'passed', 'score' => 88.50, 'notes' => 'Excellent performance in Mathematics (92%) and English (85%). Recommended for admission.'],
                    'docs' => [['birth_certificate', 'somto_birth_cert.pdf'], ['previous_result', 'pri6_report.pdf']],
                ],
                [
                    'ref' => 'APP-202509-SCD002',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 B'] ?? null,
                    'status' => ApplicationStatus::Screened,
                    'first_name' => 'Blessing',
                    'middle_name' => 'Ayomide',
                    'last_name' => 'Adebayo',
                    'gender' => 'female',
                    'dob' => '2013-07-09',
                    'guardian_name' => 'Pastor Segun Adebayo',
                    'guardian_phone' => '+2348156789012',
                    'guardian_email' => 'pastor.adebayo@gmail.com',
                    'submitted_at' => now()->subDays(9),
                    'created_at' => now()->subDays(11),
                    'notes' => 'Screening completed. Strong language skills.',
                    'screening' => ['status' => 'passed', 'score' => 76.00, 'notes' => 'Good oral communication, satisfactory quantitative reasoning.'],
                    'docs' => [['birth_certificate', 'blessing_cert.pdf']],
                ],
                [
                    'ref' => 'APP-202509-SCD003',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Screened,
                    'first_name' => 'Farouk',
                    'middle_name' => 'Usman',
                    'last_name' => 'Sani',
                    'gender' => 'male',
                    'dob' => '2013-05-04',
                    'guardian_name' => 'Alhaji Sani Aliyu',
                    'guardian_phone' => '+2348167890123',
                    'guardian_email' => 'sani.farouk@yahoo.com',
                    'submitted_at' => now()->subDays(8),
                    'created_at' => now()->subDays(10),
                    'notes' => 'Screening passed.',
                    'screening' => ['status' => 'passed', 'score' => 82.00, 'notes' => 'Well balanced assessment score across subjects.'],
                    'docs' => [['birth_certificate', 'farouk_birth_cert.pdf']],
                ],

                // --- WAITLISTED (1) ---
                [
                    'ref' => 'APP-202509-WTL001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 B'] ?? null,
                    'status' => ApplicationStatus::Waitlisted,
                    'first_name' => 'Tariq',
                    'middle_name' => 'Ahmed',
                    'last_name' => 'Mohammed',
                    'gender' => 'male',
                    'dob' => '2013-10-11',
                    'guardian_name' => 'Mrs. Aisha Mohammed',
                    'guardian_phone' => '+2348178901234',
                    'guardian_email' => 'aisha.m@gmail.com',
                    'submitted_at' => now()->subDays(14),
                    'created_at' => now()->subDays(16),
                    'notes' => 'Placed on waitlist pending class capacity review.',
                    'screening' => ['status' => 'passed', 'score' => 64.00, 'notes' => 'Met minimum cut-off, waitlisted due to capacity.'],
                    'decision' => ['decision' => 'waitlisted', 'notes' => 'Waitlisted for second batch intake.'],
                ],

                // --- OFFERED (2) -> In Decisions Queue with offer response action ---
                [
                    'ref' => 'APP-202509-OFR001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Offered,
                    'first_name' => 'Toluwani',
                    'middle_name' => 'Grace',
                    'last_name' => 'Balogun',
                    'gender' => 'female',
                    'dob' => '2013-09-17',
                    'guardian_name' => 'Mr. Gbenga Balogun',
                    'guardian_phone' => '+2348189012345',
                    'guardian_email' => 'gbenga.balogun@gmail.com',
                    'submitted_at' => now()->subDays(15),
                    'created_at' => now()->subDays(17),
                    'notes' => 'Provisional admission offer issued.',
                    'screening' => ['status' => 'passed', 'score' => 91.00, 'notes' => 'Exceptional entrance score. Ranked top 5% of applicant pool.'],
                    'decision' => [
                        'decision' => 'offered',
                        'offered_class' => $classes['JSS 1 A'] ?? null,
                        'offer_ref' => 'OFF-202509-BAL001',
                        // Expiring in 4 days -> triggers expiringOffers KPI & Task
                        'expires_at' => Carbon::today()->addDays(4)->toDateString(),
                        'notes' => 'Full offer issued for JSS 1 (A). Acceptance deadline: 4 days.',
                    ],
                    'offer_letter' => ['status' => 'sent', 'ref' => 'OFL-2025-001'],
                    'docs' => [['birth_certificate', 'toluwani_birth.pdf'], ['previous_result', 'toluwani_report.pdf']],
                ],
                [
                    'ref' => 'APP-202509-OFR002',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Offered,
                    'first_name' => 'Halima',
                    'middle_name' => 'Zainab',
                    'last_name' => 'Danjuma',
                    'gender' => 'female',
                    'dob' => '2013-12-05',
                    'guardian_name' => 'Col. S. Danjuma',
                    'guardian_phone' => '+2348190123456',
                    'guardian_email' => 'danjuma.h@gmail.com',
                    'submitted_at' => now()->subDays(12),
                    'created_at' => now()->subDays(14),
                    'notes' => 'Offer issued.',
                    'screening' => ['status' => 'passed', 'score' => 84.50, 'notes' => 'Commendable screening score.'],
                    'decision' => [
                        'decision' => 'offered',
                        'offered_class' => $classes['JSS 1 A'] ?? null,
                        'offer_ref' => 'OFF-202509-DAN002',
                        'expires_at' => Carbon::today()->addDays(12)->toDateString(),
                        'notes' => 'Offer extended.',
                    ],
                    'offer_letter' => ['status' => 'sent', 'ref' => 'OFL-2025-002'],
                    'docs' => [['birth_certificate', 'halima_birth_cert.pdf']],
                ],

                // --- ACCEPTED (2) -> In Enrolment Queue ready to convert ---
                [
                    'ref' => 'APP-202509-ACC001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Accepted,
                    'first_name' => 'Morayo',
                    'middle_name' => 'Elizabeth',
                    'last_name' => 'Ogundimu',
                    'gender' => 'female',
                    'dob' => '2013-04-19',
                    'guardian_name' => 'Mrs. Titilayo Ogundimu',
                    'guardian_phone' => '+2348011223344',
                    'guardian_email' => 'titi.ogundimu@gmail.com',
                    'submitted_at' => now()->subDays(20),
                    'created_at' => now()->subDays(22),
                    'notes' => 'Offer formally accepted by parent. Acceptance fee verified.',
                    'screening' => ['status' => 'passed', 'score' => 94.00, 'notes' => 'Outstanding academic foundation.'],
                    'decision' => [
                        'decision' => 'offered',
                        'offered_class' => $classes['JSS 1 A'] ?? null,
                        'offer_ref' => 'OFF-202509-OGU001',
                        'expires_at' => Carbon::today()->subDays(2)->toDateString(),
                        'notes' => 'Accepted prior to deadline.',
                    ],
                    'offer_letter' => ['status' => 'accepted', 'ref' => 'OFL-2025-003'],
                    'docs' => [['birth_certificate', 'morayo_birth.pdf'], ['immunization_record', 'medical_clearance.pdf']],
                ],
                [
                    'ref' => 'APP-202509-ACC002',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 2 A'] ?? null,
                    'status' => ApplicationStatus::Accepted,
                    'first_name' => 'Emeka',
                    'middle_name' => 'Kalu',
                    'last_name' => 'Obi',
                    'gender' => 'male',
                    'dob' => '2012-08-30',
                    'guardian_name' => 'Prof. Chuka Obi',
                    'guardian_phone' => '+2348022334455',
                    'guardian_email' => 'chuka.obi@unilag.edu.ng',
                    'submitted_at' => now()->subDays(18),
                    'created_at' => now()->subDays(20),
                    'notes' => 'Transfer accepted into JSS 2 (A). Awaiting student registration.',
                    'screening' => ['status' => 'passed', 'score' => 89.00, 'notes' => 'Strong performance on transfer placement assessment.'],
                    'decision' => [
                        'decision' => 'offered',
                        'offered_class' => $classes['JSS 2 A'] ?? null,
                        'offer_ref' => 'OFF-202509-OBI002',
                        'expires_at' => Carbon::today()->addDays(5)->toDateString(),
                        'notes' => 'Accepted by guardian.',
                    ],
                    'offer_letter' => ['status' => 'accepted', 'ref' => 'OFL-2025-004'],
                    'docs' => [['birth_certificate', 'emeka_birth_cert.pdf'], ['previous_result', 'jss1_annual_report.pdf']],
                ],

                // --- DECLINED (1) ---
                [
                    'ref' => 'APP-202509-DEC001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 B'] ?? null,
                    'status' => ApplicationStatus::Declined,
                    'first_name' => 'Chidinma',
                    'middle_name' => 'Joy',
                    'last_name' => 'Nwankwo',
                    'gender' => 'female',
                    'dob' => '2013-03-14',
                    'guardian_name' => 'Mr. Uche Nwankwo',
                    'guardian_phone' => '+2348033445566',
                    'guardian_email' => 'uche.nwankwo@gmail.com',
                    'submitted_at' => now()->subDays(25),
                    'created_at' => now()->subDays(28),
                    'notes' => 'Family relocated to Abuja before resumption.',
                    'screening' => ['status' => 'passed', 'score' => 85.00, 'notes' => 'Candidate passed screening successfully.'],
                    'decision' => [
                        'decision' => 'offered',
                        'offered_class' => $classes['JSS 1 B'] ?? null,
                        'offer_ref' => 'OFF-202509-NWK001',
                        'expires_at' => Carbon::today()->subDays(5)->toDateString(),
                        'notes' => 'Offer declined due to interstate relocation.',
                    ],
                ],

                // --- REJECTED (1) ---
                [
                    'ref' => 'APP-202509-REJ001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Rejected,
                    'first_name' => 'Babajide',
                    'middle_name' => 'Ayodele',
                    'last_name' => 'Sanwo',
                    'gender' => 'male',
                    'dob' => '2013-01-12',
                    'guardian_name' => 'Mr. Kayode Sanwo',
                    'guardian_phone' => '+2348044556677',
                    'guardian_email' => 'kayode.sanwo@gmail.com',
                    'submitted_at' => now()->subDays(22),
                    'created_at' => now()->subDays(24),
                    'notes' => 'Candidate did not attain minimum screening threshold.',
                    'screening' => ['status' => 'failed', 'score' => 38.00, 'notes' => 'Below cut-off mark (50%) in quantitative and verbal reasoning.'],
                    'decision' => [
                        'decision' => 'rejected',
                        'notes' => 'Did not meet academic admission standards for current intake.',
                    ],
                ],

                // --- ENROLLED / CONVERTED (2) ---
                [
                    'ref' => 'APP-202508-ENR001',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 1 A'] ?? null,
                    'status' => ApplicationStatus::Enrolled,
                    'first_name' => 'Simisola',
                    'middle_name' => 'Adeola',
                    'last_name' => 'Ajayi',
                    'gender' => 'female',
                    'dob' => '2013-05-16',
                    'guardian_name' => 'Dr. Yemi Ajayi',
                    'guardian_phone' => '+2348066778899',
                    'guardian_email' => 'yemi.ajayi@gmail.com',
                    'submitted_at' => now()->subMonths(1),
                    'created_at' => now()->subMonths(1)->subDays(5),
                    'notes' => 'Enrolled and student record created.',
                    'screening' => ['status' => 'passed', 'score' => 96.00, 'notes' => 'Highest screening score in 2025 intake.'],
                    'decision' => [
                        'decision' => 'offered',
                        'offered_class' => $classes['JSS 1 A'] ?? null,
                        'offer_ref' => 'OFF-202508-AJY001',
                        'expires_at' => Carbon::today()->subDays(15)->toDateString(),
                    ],
                    'converted' => true,
                    'docs' => [['birth_certificate', 'simi_birth.pdf'], ['immunization_record', 'simi_medical.pdf']],
                ],
                [
                    'ref' => 'APP-202507-ENR002',
                    'cycle' => $activeCycle,
                    'class' => $classes['JSS 2 A'] ?? null,
                    'status' => ApplicationStatus::Enrolled,
                    'first_name' => 'David',
                    'middle_name' => 'Temitope',
                    'last_name' => 'Oladipo',
                    'gender' => 'male',
                    'dob' => '2012-07-21',
                    'guardian_name' => 'Engr. Taiwo Oladipo',
                    'guardian_phone' => '+2348123456789',
                    'guardian_email' => 'taiwo.oladipo@yahoo.com',
                    'submitted_at' => now()->subMonths(2),
                    'created_at' => now()->subMonths(2)->subDays(4),
                    'notes' => 'Transfer student successfully enrolled in JSS 2.',
                    'screening' => ['status' => 'passed', 'score' => 90.00, 'notes' => 'Excellent placement test.'],
                    'decision' => [
                        'decision' => 'offered',
                        'offered_class' => $classes['JSS 2 A'] ?? null,
                        'offer_ref' => 'OFF-202507-OLA002',
                        'expires_at' => Carbon::today()->subDays(45)->toDateString(),
                    ],
                    'converted' => true,
                    'docs' => [['birth_certificate', 'david_birth.pdf']],
                ],
            ];

            // 4. Create and link each applicant record
            foreach ($applicants as $data) {
                /** @var AdmissionApplication $app */
                $app = AdmissionApplication::query()->create([
                    'tenant_id' => $school->getKey(),
                    'public_id' => (string) Str::ulid(),
                    'admission_cycle_id' => $data['cycle']->getKey(),
                    'requested_class_id' => $data['class']?->getKey(),
                    'reference' => $data['ref'],
                    'status' => $data['status'],
                    'first_name' => $data['first_name'],
                    'middle_name' => $data['middle_name'] ?? null,
                    'last_name' => $data['last_name'],
                    'gender' => $data['gender'],
                    'date_of_birth' => $data['dob'],
                    'nationality' => 'Nigerian',
                    'guardian_name' => $data['guardian_name'],
                    'guardian_phone' => $data['guardian_phone'],
                    'guardian_email' => $data['guardian_email'],
                    'custom_fields' => [
                        'previous_school' => 'St. Saviour Primary School',
                        'emergency_contact' => $data['guardian_phone'],
                        'blood_group' => 'O+',
                    ],
                    'notes' => $data['notes'] ?? null,
                    'submitted_at' => $data['submitted_at'],
                    'status_changed_at' => $data['submitted_at'] ?? $data['created_at'],
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                    'created_at' => $data['created_at'],
                    'updated_at' => $data['created_at'],
                ]);

                // Initial history entry
                $app->history()->create([
                    'tenant_id' => $school->getKey(),
                    'public_id' => (string) Str::ulid(),
                    'from_status' => null,
                    'to_status' => ApplicationStatus::Draft->value,
                    'reason' => 'Application initiated',
                    'changed_by' => $adminId,
                    'changed_at' => $data['created_at'],
                ]);

                if ($data['submitted_at']) {
                    $app->history()->create([
                        'tenant_id' => $school->getKey(),
                        'public_id' => (string) Str::ulid(),
                        'from_status' => ApplicationStatus::Draft->value,
                        'to_status' => ApplicationStatus::Submitted->value,
                        'reason' => 'Application submitted with documents',
                        'changed_by' => $adminId,
                        'changed_at' => $data['submitted_at'],
                    ]);
                }

                // Documents
                if (! empty($data['docs'])) {
                    foreach ($data['docs'] as [$docType, $origName]) {
                        $app->documents()->create([
                            'tenant_id' => $school->getKey(),
                            'public_id' => (string) Str::ulid(),
                            'document_type' => $docType,
                            'original_name' => $origName,
                            'storage_key' => "admissions/{$school->getKey()}/{$app->getKey()}/{$origName}",
                            'mime_type' => 'application/pdf',
                            'file_size' => rand(150000, 750000),
                            'sha256' => hash('sha256', $origName . $app->getKey()),
                            'scan_status' => 'clean',
                            'uploaded_by' => $adminId,
                        ]);
                    }
                }

                // Screening
                if (! empty($data['screening'])) {
                    $screeningInfo = $data['screening'];
                    $isCompleted = ($screeningInfo['status'] ?? '') === 'passed' || ($screeningInfo['status'] ?? '') === 'failed';
                    $app->screenings()->create([
                        'tenant_id' => $school->getKey(),
                        'public_id' => (string) Str::ulid(),
                        'status' => $screeningInfo['status'],
                        'scheduled_at' => $screeningInfo['scheduled_at'] ?? $data['submitted_at']?->copy()->addDays(2),
                        'completed_at' => $isCompleted ? $data['submitted_at']?->copy()->addDays(3) : null,
                        'score' => $screeningInfo['score'] ?? null,
                        'notes' => $screeningInfo['notes'] ?? 'Screening interview and examination.',
                        'assessed_by' => $adminId,
                    ]);

                    $app->history()->create([
                        'tenant_id' => $school->getKey(),
                        'public_id' => (string) Str::ulid(),
                        'from_status' => ApplicationStatus::Submitted->value,
                        'to_status' => $isCompleted ? ApplicationStatus::Screened->value : ApplicationStatus::Screening->value,
                        'reason' => $isCompleted ? "Screening completed (Score: {$screeningInfo['score']}%)" : 'Screening scheduled',
                        'changed_by' => $adminId,
                        'changed_at' => $data['submitted_at']?->copy()->addDays(2) ?? now(),
                    ]);
                }

                // Decision
                if (! empty($data['decision'])) {
                    $decInfo = $data['decision'];
                    $offeredClass = $decInfo['offered_class'] ?? $data['class'] ?? null;
                    $app->decision()->create([
                        'tenant_id' => $school->getKey(),
                        'public_id' => (string) Str::ulid(),
                        'offered_class_id' => $offeredClass?->getKey(),
                        'decision' => $decInfo['decision'],
                        'offer_reference' => $decInfo['offer_ref'] ?? ('OFF-' . now()->format('Ym') . '-' . Str::upper(Str::random(6))),
                        'expires_at' => $decInfo['expires_at'] ?? Carbon::today()->addDays(14)->toDateString(),
                        'notes' => $decInfo['notes'] ?? null,
                        'decided_at' => $data['submitted_at']?->copy()->addDays(4) ?? now(),
                        'decided_by' => $adminId,
                    ]);

                    $app->history()->create([
                        'tenant_id' => $school->getKey(),
                        'public_id' => (string) Str::ulid(),
                        'from_status' => ApplicationStatus::Screened->value,
                        'to_status' => $decInfo['decision'] === 'offered' ? ApplicationStatus::Offered->value : ($decInfo['decision'] === 'waitlisted' ? ApplicationStatus::Waitlisted->value : ApplicationStatus::Rejected->value),
                        'reason' => "Decision recorded: {$decInfo['decision']}",
                        'changed_by' => $adminId,
                        'changed_at' => $data['submitted_at']?->copy()->addDays(4) ?? now(),
                    ]);
                }

                // Offer letter
                if (! empty($data['offer_letter'])) {
                    $letterInfo = $data['offer_letter'];
                    $app->offerLetters()->create([
                        'tenant_id' => $school->getKey(),
                        'public_id' => (string) Str::ulid(),
                        'reference' => $letterInfo['ref'],
                        'status' => $letterInfo['status'],
                        'issued_at' => $data['submitted_at']?->copy()->addDays(5) ?? now(),
                        'content' => [
                            'welcome_message' => "Congratulations {$data['first_name']} on your provisional admission to Fiwasaye Girls Grammar School.",
                            'resumption_date' => '2025-09-08',
                            'requirements' => ['Proof of payment', 'Medical certificate', 'Two passport photographs'],
                        ],
                        'created_by' => $adminId,
                    ]);
                }

                // Conversion for Enrolled
                if (! empty($data['converted'])) {
                    // Link to an existing student or create a student
                    $existingStudent = Student::query()
                        ->where('tenant_id', $school->getKey())
                        ->where('first_name', $data['first_name'])
                        ->where('last_name', $data['last_name'])
                        ->first();

                    if (! $existingStudent) {
                        $existingStudent = Student::query()->create([
                            'tenant_id' => $school->getKey(),
                            'admission_number' => 'RGA26/' . rand(2000, 2999),
                            'first_name' => $data['first_name'],
                            'middle_name' => $data['middle_name'] ?? null,
                            'last_name' => $data['last_name'],
                            'gender' => $data['gender'],
                            'date_of_birth' => $data['dob'],
                            'status' => 'active',
                            'admission_date' => $data['submitted_at']?->copy()->addDays(10)->toDateString() ?? now()->toDateString(),
                            'public_id' => (string) Str::ulid(),
                        ]);
                    }

                    $academicSession = \App\Models\AcademicSession::query()
                        ->where('tenant_id', $school->getKey())
                        ->where('is_current', true)
                        ->first()
                        ?? \App\Models\AcademicSession::query()
                            ->where('tenant_id', $school->getKey())
                            ->first();

                    $enrollment = null;
                    if ($academicSession) {
                        $enrollment = Enrollment::query()->firstOrCreate(
                            [
                                'tenant_id' => $school->getKey(),
                                'student_id' => $existingStudent->getKey(),
                                'academic_session_id' => $academicSession->getKey(),
                            ],
                            [
                                'class_id' => $data['class']?->getKey() ?? ($classes['JSS 1 A'] ?? null)?->getKey(),
                                'status' => 'active',
                                'public_id' => (string) Str::ulid(),
                            ]
                        );
                    }

                    AdmissionConversion::query()->updateOrCreate(
                        [
                            'tenant_id' => $school->getKey(),
                            'admission_application_id' => $app->getKey(),
                        ],
                        [
                            'student_id' => $existingStudent->getKey(),
                            'enrollment_id' => $enrollment?->getKey(),
                            'idempotency_key' => 'conv_' . $app->getKey(),
                            'converted_by' => $adminId,
                            'converted_at' => $data['submitted_at']?->copy()->addDays(10) ?? now(),
                            'public_id' => (string) Str::ulid(),
                        ]
                    );

                    $app->history()->create([
                        'tenant_id' => $school->getKey(),
                        'public_id' => (string) Str::ulid(),
                        'from_status' => ApplicationStatus::Accepted->value,
                        'to_status' => ApplicationStatus::Enrolled->value,
                        'reason' => "Converted to student record ({$existingStudent->admission_number})",
                        'changed_by' => $adminId,
                        'changed_at' => $data['submitted_at']?->copy()->addDays(10) ?? now(),
                    ]);
                }
            }

            $this->command?->info("Admissions seeded successfully for {$school->name} (" . count($applicants) . ' applicants).');
        } finally {
            $context->clear();
        }
    }
}
