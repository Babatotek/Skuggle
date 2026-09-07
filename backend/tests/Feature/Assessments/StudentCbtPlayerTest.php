<?php

namespace Tests\Feature\Assessments;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Campus;
use App\Models\Enrollment;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\TenantMembership;
use App\Models\Term;
use App\Models\User;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class StudentCbtPlayerTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    private function fixture(): array
    {
        $staff = $this->makeTenantUser('teacher');
        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        app(PermissionRegistrySynchronizer::class)->sync();

        $session = AcademicSession::query()->create(['name' => '2026/27', 'starts_at' => '2026-09-01', 'ends_at' => '2027-08-01', 'is_current' => true, 'status' => 'active']);
        $term = Term::query()->create(['academic_session_id' => $session->id, 'name' => 'First term', 'sequence' => 1, 'starts_at' => '2026-09-01', 'ends_at' => '2026-12-20', 'is_current' => true]);
        $campus = Campus::query()->create(['name' => 'Main', 'code' => 'MAIN', 'status' => 'active']);
        $class = SchoolClass::query()->create(['campus_id' => $campus->id, 'name' => 'JSS 1', 'arm' => 'A', 'status' => 'active']);
        $subject = Subject::query()->create(['name' => 'Mathematics', 'code' => 'MATH', 'status' => 'active']);
        DB::table('class_subject')->insert(['tenant_id' => $staff['tenant']->id, 'class_id' => $class->id, 'subject_id' => $subject->id]);

        $studentUser = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $studentRole = Role::query()->where('name', 'student')->firstOrFail();
        $studentRole->permissions()->syncWithoutDetaching([
            Permission::query()->where('name', 'assessment.cbt.attempt')->value('id'),
            Permission::query()->where('name', 'assessments.view')->value('id'),
        ]);
        $studentMembership = TenantMembership::query()->create([
            'tenant_id' => $staff['tenant']->id,
            'user_id' => $studentUser->id,
            'role_id' => $studentRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        $student = $this->makeStudentForTenant($staff['tenant'], [
            'user_id' => $studentUser->id,
            'first_name' => 'Test',
            'last_name' => 'Learner',
            'admission_number' => 'ST-CBT-1',
        ]);
        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        Enrollment::query()->create(['student_id' => $student->id, 'class_id' => $class->id, 'academic_session_id' => $session->id, 'term_id' => $term->id, 'status' => 'active']);
        $assessment = Assessment::query()->create([
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'academic_session_id' => $session->id,
            'term_id' => $term->id,
            'created_by' => $staff['user']->id,
            'title' => 'CBT Maths',
            'type' => 'test',
            'maximum_score' => 10,
            'status' => 'active',
            'revision' => 1,
            'scheduled_at' => now()->subMinutes(5),
            'metadata' => [
                'participantMode' => 'class',
                'contentMode' => 'questions',
                'delivery' => 'cbt',
                'startTime' => now()->subMinutes(5)->format('H:i'),
                'duration' => 60,
                'venue' => 'Online',
                'invigilator' => 'System',
            ],
        ]);
        AssessmentQuestion::query()->create([
            'assessment_id' => $assessment->id,
            'prompt' => '2 + 2 = ?',
            'question_type' => 'multiple-choice',
            'options' => ['3', '4', '5'],
            'correct_answer' => '4',
            'marks' => 10,
            'position' => 1,
        ]);
        app(TenantContext::class)->clear();
        app(CanonicalAuthorizationEvaluator::class)->forget();

        return [
            'staff' => $staff,
            'studentUser' => ['user' => $studentUser, 'membership' => $studentMembership, 'role' => $studentRole],
            'student' => $student,
            'assessment' => $assessment,
        ];
    }

    public function test_student_can_list_take_and_submit_cbt_into_assessment_scores(): void
    {
        $f = $this->fixture();
        $this->actingAsTenantUser($f['studentUser']['user'], $f['staff']['tenant']);

        $this->getJson('/api/v1/student/cbt/assessments')
            ->assertOk()
            ->assertJsonPath('data.data.0.title', 'CBT Maths')
            ->assertJsonPath('data.data.0.canAttempt', true);

        $id = $f['assessment']->public_id;
        $player = $this->getJson("/api/v1/student/cbt/assessments/{$id}")
            ->assertOk()
            ->assertJsonPath('data.questions.0.prompt', '2 + 2 = ?')
            ->json('data');
        $this->assertArrayNotHasKey('correctAnswer', $player['questions'][0]);

        $qid = $player['questions'][0]['id'];
        $this->postJson("/api/v1/student/cbt/assessments/{$id}/attempts", [
            'answers' => [$qid => '4'],
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.score', 10)
            ->assertJsonPath('data.percentage', 100);

        $this->assertDatabaseHas('assessment_scores', [
            'assessment_id' => $f['assessment']->id,
            'student_id' => $f['student']->id,
            'score' => 10,
            'status' => 'ENTERED',
        ]);
        $this->assertDatabaseHas('assessment_submissions', [
            'assessment_id' => $f['assessment']->id,
            'student_id' => $f['student']->id,
            'status' => 'submitted',
        ]);

        $this->postJson("/api/v1/student/cbt/assessments/{$id}/attempts", [
            'answers' => [$qid => '4'],
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertStatus(409);
    }

    public function test_student_can_save_draft_and_resume_answers(): void
    {
        $f = $this->fixture();
        $this->actingAsTenantUser($f['studentUser']['user'], $f['staff']['tenant']);
        $id = $f['assessment']->public_id;
        $qid = $this->getJson("/api/v1/student/cbt/assessments/{$id}")->json('data.questions.0.id');

        $this->putJson("/api/v1/student/cbt/assessments/{$id}/attempts", [
            'answers' => [$qid => '4'],
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');

        $this->getJson("/api/v1/student/cbt/assessments/{$id}")
            ->assertOk()
            ->assertJsonPath("data.answers.$qid", '4')
            ->assertJsonPath('data.attemptStatus', 'in_progress');
    }

    public function test_window_and_roster_gates_block_attempts(): void
    {
        $f = $this->fixture();
        app(TenantContext::class)->set($f['staff']['tenant'], $f['staff']['membership']);
        $f['assessment']->update(['scheduled_at' => now()->addDay()]);
        app(TenantContext::class)->clear();

        $this->actingAsTenantUser($f['studentUser']['user'], $f['staff']['tenant']);
        $this->postJson('/api/v1/student/cbt/assessments/'.$f['assessment']->public_id.'/attempts', [
            'answers' => ['x' => '4'],
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'CBT_WINDOW_CLOSED');
    }
}
