<?php

namespace Tests\Feature\Assessments;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentScore;
use App\Models\AssessmentSubmission;
use App\Models\Campus;
use App\Models\Employee;
use App\Models\Enrollment;
use App\Models\Permission;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\Term;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class AssessmentRemainingPrdSliceTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    private function fixture(): array
    {
        $actor = $this->makeTenantUser('teacher');
        app(TenantContext::class)->set($actor['tenant'], $actor['membership']);
        app(PermissionRegistrySynchronizer::class)->sync();
        foreach (['assessment.score.moderate', 'assessment.score.lock', 'assessment.score.enter', 'scores.approve'] as $cap) {
            $id = Permission::query()->where('name', $cap)->value('id');
            if ($id) {
                $actor['role']->permissions()->syncWithoutDetaching([$id]);
            }
        }
        $actor['membership']->unsetRelation('role');
        app(CanonicalAuthorizationEvaluator::class)->forget();

        $session = AcademicSession::query()->create(['name' => '2026/27', 'starts_at' => '2026-09-01', 'ends_at' => '2027-08-01', 'is_current' => true, 'status' => 'active']);
        $term = Term::query()->create(['academic_session_id' => $session->id, 'name' => 'First term', 'sequence' => 1, 'starts_at' => '2026-09-01', 'ends_at' => '2026-12-20', 'is_current' => true]);
        $campus = Campus::query()->create(['name' => 'Main', 'code' => 'MAIN', 'status' => 'active']);
        $class = SchoolClass::query()->create(['campus_id' => $campus->id, 'name' => 'JSS 1', 'arm' => 'A', 'status' => 'active']);
        $subject = Subject::query()->create(['name' => 'Mathematics', 'code' => 'MATH', 'status' => 'active']);
        DB::table('class_subject')->insert(['tenant_id' => $actor['tenant']->id, 'class_id' => $class->id, 'subject_id' => $subject->id]);
        Employee::query()->create(['user_id' => $actor['user']->id, 'employee_number' => 'T-R', 'name' => 'Teacher', 'employment_type' => 'full_time', 'status' => 'active']);
        TeacherAssignment::query()->create(['user_id' => $actor['user']->id, 'class_id' => $class->id, 'subject_id' => $subject->id, 'academic_session_id' => $session->id]);
        $student = $this->makeStudentForTenant($actor['tenant'], ['admission_number' => 'ST-R-1', 'first_name' => 'Ada', 'last_name' => 'Ok']);
        app(TenantContext::class)->set($actor['tenant'], $actor['membership']);
        Enrollment::query()->create(['student_id' => $student->id, 'class_id' => $class->id, 'academic_session_id' => $session->id, 'term_id' => $term->id, 'status' => 'active']);
        $assessment = Assessment::query()->create([
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'academic_session_id' => $session->id,
            'term_id' => $term->id,
            'created_by' => $actor['user']->id,
            'title' => 'PRD closeout',
            'type' => 'test',
            'maximum_score' => 10,
            'status' => 'moderation',
            'revision' => 1,
            'scheduled_at' => now()->subDay(),
            'metadata' => [
                'participantMode' => 'class',
                'contentMode' => 'questions',
                'delivery' => 'cbt',
                'startTime' => '09:00',
                'duration' => 40,
                'venue' => 'Hall',
                'invigilator' => 'EO',
                'moderationStage' => 'subject_head',
                'submittedAt' => now()->toIso8601String(),
            ],
        ]);
        AssessmentQuestion::query()->create([
            'assessment_id' => $assessment->id,
            'prompt' => '2+2?',
            'question_type' => 'multiple-choice',
            'options' => ['3', '4'],
            'correct_answer' => '4',
            'marks' => 10,
            'position' => 1,
        ]);
        AssessmentScore::query()->create([
            'assessment_id' => $assessment->id,
            'student_id' => $student->id,
            'score' => 10,
            'status' => 'ENTERED',
        ]);
        AssessmentSubmission::query()->create([
            'assessment_id' => $assessment->id,
            'student_id' => $student->id,
            'answers' => [],
            'status' => 'submitted',
            'started_at' => now()->subHour(),
            'submitted_at' => now()->subMinutes(30),
        ]);
        // Fix submission answers with question public id after create
        $qid = AssessmentQuestion::query()->where('assessment_id', $assessment->id)->value('public_id');
        AssessmentSubmission::query()->where('assessment_id', $assessment->id)->update(['answers' => [$qid => '4']]);
        app(TenantContext::class)->clear();
        app(CanonicalAuthorizationEvaluator::class)->forget();
        $this->actingAsTenantUser($actor['user'], $actor['tenant']);

        return compact('actor', 'assessment', 'student');
    }

    public function test_multi_stage_moderation_subject_head_then_eo(): void
    {
        $f = $this->fixture();
        $id = $f['assessment']->public_id;
        $this->postJson("/api/v1/assessments/{$id}/transition", [
            'action' => 'moderate',
            'revision' => 1,
            'acknowledgeWarnings' => true,
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.status', 'under_review');

        $revision = $this->getJson("/api/v1/assessments/{$id}")->json('data.revision');
        $this->postJson("/api/v1/assessments/{$id}/transition", [
            'action' => 'moderate',
            'revision' => $revision,
            'acknowledgeWarnings' => true,
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.status', 'validated');
    }

    public function test_item_analytics_and_export_and_theory_suggest(): void
    {
        $f = $this->fixture();
        $id = $f['assessment']->public_id;
        $this->getJson("/api/v1/assessments/{$id}/item-analytics")
            ->assertOk()
            ->assertJsonPath('data.attemptCount', 1)
            ->assertJsonPath('data.items.0.correct', 1);

        $this->get("/api/v1/assessments/{$id}/export")->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');

        app(TenantContext::class)->set($f['actor']['tenant'], $f['actor']['membership']);
        AssessmentQuestion::query()->create([
            'assessment_id' => $f['assessment']->id,
            'prompt' => 'Explain photosynthesis',
            'question_type' => 'essay',
            'options' => [],
            'correct_answer' => 'Light energy converts CO2 and water',
            'marks' => 5,
            'position' => 2,
            'rubric' => [['label' => 'Accuracy', 'maxMarks' => 5]],
        ]);
        $essayId = AssessmentQuestion::query()->where('assessment_id', $f['assessment']->id)->where('question_type', 'essay')->value('public_id');
        AssessmentSubmission::query()->where('assessment_id', $f['assessment']->id)->update([
            'answers' => array_merge(
                AssessmentSubmission::query()->where('assessment_id', $f['assessment']->id)->value('answers') ?? [],
                [$essayId => 'Plants use sunlight to make food from carbon dioxide and water.']
            ),
        ]);
        app(TenantContext::class)->clear();

        $suggestion = $this->postJson("/api/v1/assessments/{$id}/theory/{$f['student']->public_id}/suggest", [], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->json('data');
        $this->assertArrayHasKey('suggestedScore', $suggestion);

        $this->postJson("/api/v1/assessments/{$id}/theory/{$f['student']->public_id}/apply", [
            'score' => $suggestion['suggestedScore'],
            'suggestion' => $suggestion,
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.status', 'ENTERED');
    }

    public function test_print_pack_includes_qr_svg(): void
    {
        $f = $this->fixture();
        $this->getJson('/api/v1/assessments/'.$f['assessment']->public_id.'/papers')
            ->assertOk()
            ->assertJsonPath('data.header.qrSvg', fn ($v) => is_string($v) && str_starts_with($v, 'data:image/svg+xml;base64,'))
            ->assertJsonPath('data.candidates.0.qrSvg', fn ($v) => is_string($v) && str_starts_with($v, 'data:image/svg+xml;base64,'));
    }
}
