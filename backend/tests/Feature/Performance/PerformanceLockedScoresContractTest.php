<?php

namespace Tests\Feature\Performance;

use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Assessment;
use App\Models\AssessmentScore;
use App\Models\Campus;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Term;
use App\Services\PerformanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class PerformanceLockedScoresContractTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    public function test_performance_aggregates_exclude_unlocked_assessment_scores(): void
    {
        $actor = $this->makeTenantUser('school_super_admin');
        app(TenantContext::class)->set($actor['tenant'], $actor['membership']);

        $session = AcademicSession::query()->create([
            'name' => '2026/27',
            'starts_at' => '2026-09-01',
            'ends_at' => '2027-08-01',
            'is_current' => true,
            'status' => 'active',
        ]);
        $term = Term::query()->create([
            'academic_session_id' => $session->id,
            'name' => 'First term',
            'sequence' => 1,
            'starts_at' => '2026-09-01',
            'ends_at' => '2026-12-20',
            'is_current' => true,
        ]);
        $campus = Campus::query()->create(['name' => 'Main', 'code' => 'MAIN', 'status' => 'active']);
        $class = SchoolClass::query()->create(['campus_id' => $campus->id, 'name' => 'JSS 1', 'arm' => 'A', 'status' => 'active']);
        $subject = Subject::query()->create(['name' => 'Mathematics', 'code' => 'MATH', 'status' => 'active']);
        $student = Student::query()->create([
            'admission_number' => 'ST-LOCK-1',
            'first_name' => 'Ada',
            'last_name' => 'Okafor',
            'gender' => 'female',
            'status' => 'active',
            'admission_date' => '2026-09-01',
            'date_of_birth' => '2014-01-01',
        ]);
        Enrollment::query()->create([
            'student_id' => $student->id,
            'class_id' => $class->id,
            'academic_session_id' => $session->id,
            'term_id' => $term->id,
            'status' => 'active',
        ]);

        $unlocked = Assessment::query()->create([
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'academic_session_id' => $session->id,
            'term_id' => $term->id,
            'created_by' => $actor['user']->id,
            'title' => 'Unlocked CA',
            'type' => 'continuous-assessment',
            'maximum_score' => 20,
            'status' => 'marking',
            'scheduled_at' => now(),
            'metadata' => [],
        ]);
        AssessmentScore::query()->create([
            'assessment_id' => $unlocked->id,
            'student_id' => $student->id,
            'score' => 5,
            'status' => 'ENTERED',
        ]);

        $locked = Assessment::query()->create([
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'academic_session_id' => $session->id,
            'term_id' => $term->id,
            'created_by' => $actor['user']->id,
            'title' => 'Locked Exam',
            'type' => 'exam',
            'maximum_score' => 40,
            'status' => 'locked',
            'scheduled_at' => now()->subDay(),
            'metadata' => ['lockedAt' => now()->toIso8601String(), 'lockVersion' => 1],
        ]);
        AssessmentScore::query()->create([
            'assessment_id' => $locked->id,
            'student_id' => $student->id,
            'score' => 36,
            'status' => 'LOCKED',
        ]);

        $service = app(PerformanceService::class);
        $students = $service->view('students')['rows'];
        $subjects = $service->view('subjects')['rows'];
        $insights = $service->view('insights')['summary'];

        $this->assertCount(1, $students);
        $this->assertSame($student->public_id, $students[0]['id']);
        $this->assertSame(36.0, $students[0]['averageScore']);
        $this->assertSame(1, $students[0]['assessments']);
        $this->assertSame(36.0, $subjects[0]['averageScore']);
        $this->assertSame(36.0, $insights['averageScore']);
    }
}
