<?php

namespace Tests\Feature\Assessments;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Campus;
use App\Models\Employee;
use App\Models\Enrollment;
use App\Models\Permission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\Term;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class AssessmentV2Test extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    private function fixture(): array
    {
        $actor = $this->makeTenantUser('teacher');
        app(TenantContext::class)->set($actor['tenant'], $actor['membership']);
        $session = AcademicSession::query()->create(['name' => '2026/27', 'starts_at' => '2026-09-01', 'ends_at' => '2027-08-01', 'is_current' => true, 'status' => 'active']);
        $term = Term::query()->create(['academic_session_id' => $session->id, 'name' => 'First term', 'sequence' => 1, 'starts_at' => '2026-09-01', 'ends_at' => '2026-12-20', 'is_current' => true]);
        $campus = Campus::query()->create(['name' => 'Main', 'code' => 'MAIN', 'status' => 'active']);
        $class = SchoolClass::query()->create(['campus_id' => $campus->id, 'name' => 'JSS 1', 'arm' => 'A', 'status' => 'active']);
        $subject = Subject::query()->create(['name' => 'Mathematics', 'code' => 'MATH', 'status' => 'active']);
        DB::table('class_subject')->insert(['tenant_id' => $actor['tenant']->id, 'class_id' => $class->id, 'subject_id' => $subject->id]);
        Employee::query()->create(['user_id' => $actor['user']->id, 'employee_number' => 'T1', 'name' => 'Test Teacher', 'employment_type' => 'full_time', 'status' => 'active']);
        TeacherAssignment::query()->create(['user_id' => $actor['user']->id, 'class_id' => $class->id, 'subject_id' => $subject->id, 'academic_session_id' => $session->id]);
        $student = Student::query()->create(['admission_number' => 'ST1', 'first_name' => 'Test', 'last_name' => 'Learner', 'gender' => 'female', 'status' => 'active', 'admission_date' => '2026-09-01', 'date_of_birth' => '2014-01-01']);
        Enrollment::query()->create(['student_id' => $student->id, 'class_id' => $class->id, 'academic_session_id' => $session->id, 'term_id' => $term->id, 'status' => 'active']);
        $assessment = Assessment::query()->create(['class_id' => $class->id, 'subject_id' => $subject->id, 'academic_session_id' => $session->id, 'term_id' => $term->id, 'created_by' => $actor['user']->id, 'title' => 'Domain test', 'type' => 'test', 'maximum_score' => 40, 'status' => 'completed', 'scheduled_at' => now(), 'metadata' => ['participantMode' => 'class']]);
        app(TenantContext::class)->clear();
        $this->actingAsTenantUser($actor['user'], $actor['tenant']);

        return compact('actor', 'session', 'term', 'class', 'subject', 'student', 'assessment');
    }

    private function headers(): array
    {
        return ['Idempotency-Key' => (string) Str::uuid()];
    }

    private function grant(array $f, string $capability): void
    {
        app(PermissionRegistrySynchronizer::class)->sync();
        $f['actor']['role']->permissions()->syncWithoutDetaching([Permission::query()->where('name', $capability)->value('id')]);
        $f['actor']['membership']->unsetRelation('role');
        app(CanonicalAuthorizationEvaluator::class)->forget();
    }

    public function test_overview_and_pagination_use_real_assigned_context(): void
    {
        $f = $this->fixture();
        $this->getJson('/api/v1/assessments/overview')->assertOk()->assertJsonPath('data.metrics.marking', 1)->assertJsonPath('data.recent.0.title', 'Domain test');
        $this->getJson('/api/v1/assessments?search=Domain&perPage=1')->assertOk()->assertJsonPath('data.meta.total', 1);
        $this->getJson('/api/v1/assessments?type=exam')->assertOk()->assertJsonPath('data.meta.total', 0);
    }

    public function test_scores_support_absent_exempt_and_revision_conflict(): void
    {
        $f = $this->fixture();
        $id = $f['assessment']->public_id;
        $student = $f['student']->public_id;
        $revision = $this->getJson("/api/v1/assessments/{$id}/scores")->assertOk()->json('data.revision');
        $body = ['revision' => $revision, 'scores' => [$student => null], 'states' => [$student => 'ABSENT']];
        $this->putJson("/api/v1/assessments/{$id}/scores", $body, $this->headers())->assertOk();
        $this->putJson("/api/v1/assessments/{$id}/scores", $body, $this->headers())->assertStatus(409);
        $revision = $this->getJson("/api/v1/assessments/{$id}/scores")->json('data.revision');
        $body['revision'] = $revision;
        $body['states'][$student] = 'EXEMPT';
        $this->putJson("/api/v1/assessments/{$id}/scores", $body, $this->headers())->assertOk();
        $this->getJson("/api/v1/assessments/{$id}/scores")->assertJsonPath('data.students.0.state', 'EXEMPT');
    }

    public function test_invalid_scores_and_foreign_roster_are_denied(): void
    {
        $f = $this->fixture();
        $id = $f['assessment']->public_id;
        $revision = $this->getJson("/api/v1/assessments/{$id}/scores")->json('data.revision');
        foreach ([[$f['student']->public_id => 41], [$f['student']->public_id => -1], ['foreign-student' => 20]] as $scores) {
            $this->putJson("/api/v1/assessments/{$id}/scores", ['revision' => $revision, 'scores' => $scores], $this->headers())->assertStatus(422);
        }
    }

    public function test_lock_requires_validation_and_unlock_requires_capability_and_reason(): void
    {
        $f = $this->fixture();
        $id = $f['assessment']->public_id;
        $this->grant($f, 'assessment.score.lock');
        $this->grant($f, 'assessment.score.moderate');
        $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => 'lock', 'revision' => 1], $this->headers())->assertStatus(409);
        $revision = $this->getJson("/api/v1/assessments/{$id}/scores")->json('data.revision');
        $this->putJson("/api/v1/assessments/{$id}/scores", ['revision' => $revision, 'scores' => [$f['student']->public_id => 30]], $this->headers())->assertOk();
        foreach (['submit', 'moderate', 'moderate', 'lock'] as $action) {
            $revision = $this->getJson("/api/v1/assessments/{$id}")->assertOk()->json('data.revision');
            $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => $action, 'revision' => $revision, 'acknowledgeWarnings' => true], $this->headers())->assertOk();
        }
        $scores = $this->getJson("/api/v1/assessments/{$id}/scores")->assertJsonPath('data.editable', false)->json('data');
        $this->putJson("/api/v1/assessments/{$id}/scores", ['revision' => $scores['revision'], 'scores' => [$f['student']->public_id => 31]], $this->headers())->assertStatus(409);
        $revision = $this->getJson("/api/v1/assessments/{$id}")->json('data.revision');
        $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => 'reopen', 'revision' => $revision, 'reason' => 'Correction'], $this->headers())->assertForbidden();
        $this->grant($f, 'assessment.score.unlock');
        $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => 'reopen', 'revision' => $revision], $this->headers())->assertStatus(422);
        $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => 'reopen', 'revision' => $revision, 'reason' => 'Correction'], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'UNLOCK_IMPACT_UNACKNOWLEDGED');
        $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => 'reopen', 'revision' => $revision, 'reason' => 'Correction', 'acknowledgeImpact' => true], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.status', 'reopened');
        $this->assertDatabaseHas('audit_logs', ['action' => 'assessment.reopen']);
    }

    public function test_unrelated_teacher_and_role_label_alone_grant_nothing(): void
    {
        $f = $this->fixture();
        app(TenantContext::class)->set($f['actor']['tenant'], $f['actor']['membership']);
        TeacherAssignment::query()->delete();
        app(TenantContext::class)->clear();
        $this->getJson('/api/v1/assessments/'.$f['assessment']->public_id)->assertNotFound();
        $this->getJson('/api/v1/assessments')->assertOk()->assertJsonPath('data.meta.total', 0);
        $f['actor']['role']->permissions()->detach();
        app(CanonicalAuthorizationEvaluator::class)->forget();
        $this->getJson('/api/v1/assessments/overview')->assertForbidden();
    }

    public function test_foreign_tenant_assessment_and_question_are_not_found(): void
    {
        $f = $this->fixture();
        $other = $this->makeTenantUser('teacher');
        app(TenantContext::class)->set($other['tenant'], $other['membership']);
        AcademicSession::query()->create(['name' => 'Other', 'starts_at' => '2026-09-01', 'ends_at' => '2027-08-01', 'is_current' => true, 'status' => 'active']);
        $session = AcademicSession::query()->first();
        Term::query()->create(['academic_session_id' => $session->id, 'name' => 'First term', 'sequence' => 1, 'starts_at' => '2026-09-01', 'ends_at' => '2026-12-20', 'is_current' => true]);
        app(TenantContext::class)->clear();
        $this->actingAsTenantUser($other['user'], $other['tenant']);
        $this->getJson('/api/v1/assessments/'.$f['assessment']->public_id)->assertNotFound();
        $this->patchJson('/api/v1/assessment-questions/foreign-question', ['status' => 'accepted'], $this->headers())->assertNotFound();
    }

    public function test_ai_questions_are_durable_drafts_and_require_review(): void
    {
        $f = $this->fixture();
        $this->grant($f, 'assessment.question.review');
        $payload = ['classId' => $f['class']->public_id, 'subjectId' => $f['subject']->public_id, 'prompt' => 'What is two plus two?', 'questionType' => 'short-answer', 'marks' => 2, 'difficulty' => 'easy', 'aiGenerated' => true, 'status' => 'accepted'];
        $question = $this->postJson('/api/v1/assessment-questions', $payload, $this->headers())->assertCreated()->assertJsonPath('data.status', 'draft')->json('data');
        $this->assertNotEmpty($question['id']);
        $this->patchJson('/api/v1/assessment-questions/'.$question['id'], ['status' => 'accepted'], $this->headers())->assertOk()->assertJsonPath('data.status', 'accepted');
        $this->patchJson('/api/v1/assessment-questions/'.$question['id'], ['prompt' => 'Updated'], $this->headers())->assertOk()->assertJsonPath('data.status', 'draft');
    }

    public function test_print_pack_includes_variants_candidates_and_gated_answers(): void
    {
        $f = $this->fixture();
        app(TenantContext::class)->set($f['actor']['tenant'], $f['actor']['membership']);
        $f['assessment']->questions()->create([
            'prompt' => 'Solve 2 + 2',
            'question_type' => 'short-answer',
            'options' => [],
            'correct_answer' => '4',
            'rationale' => 'Basic arithmetic',
            'marks' => 10,
            'position' => 1,
            'learning_outcome' => 'Numeracy',
        ]);
        app(TenantContext::class)->clear();

        $id = $f['assessment']->public_id;
        $withoutAnswers = $this->getJson("/api/v1/assessments/{$id}/papers")
            ->assertOk()
            ->assertJsonPath('data.header.title', 'Domain test')
            ->assertJsonPath('data.candidates.0.name', 'Test Learner')
            ->assertJsonPath('data.questions.0.prompt', 'Solve 2 + 2')
            ->assertJsonPath('data.variants.0', 'candidate')
            ->json('data.questions.0');
        $this->assertArrayNotHasKey('correctAnswer', $withoutAnswers);

        $this->getJson("/api/v1/assessments/{$id}/papers?answers=1")
            ->assertOk()
            ->assertJsonPath('data.questions.0.correctAnswer', '4')
            ->assertJsonPath('data.questions.0.rationale', 'Basic arithmetic');

        app(TenantContext::class)->set($f['actor']['tenant'], $f['actor']['membership']);
        AssessmentQuestion::query()->create([
            'assessment_id' => $f['assessment']->id,
            'prompt' => 'Capital of Nigeria?',
            'question_type' => 'multiple-choice',
            'options' => ['Lagos', 'Abuja', 'Kano', 'Ibadan'],
            'correct_answer' => 'Abuja',
            'marks' => 5,
            'position' => 2,
        ]);
        $f['assessment']->update(['metadata' => array_merge($f['assessment']->metadata ?? [], ['delivery' => 'smartmark'])]);
        app(TenantContext::class)->clear();

        $omr = $this->getJson("/api/v1/assessments/{$id}/papers?answers=1")
            ->assertOk()
            ->assertJsonPath('data.omr.enabled', true)
            ->assertJsonPath('data.omr.items.0.choices.0', 'A')
            ->assertJsonPath('data.omr.answerKey.0', 'B')
            ->assertJsonPath('data.candidates.0.scanCode', 'SM|'.$id.'|ST1')
            ->json('data');
        $this->assertContains('omr-sheet', $omr['variants']);
    }

    public function test_schedule_requires_venue_invigilator_and_rejects_conflicts(): void
    {
        $f = $this->fixture();
        $this->grant($f, 'assessment.assessment.create');
        $start = now()->addDays(3)->setTime(10, 0);

        app(TenantContext::class)->set($f['actor']['tenant'], $f['actor']['membership']);
        $ready = Assessment::query()->create([
            'class_id' => $f['class']->id,
            'subject_id' => $f['subject']->id,
            'academic_session_id' => $f['session']->id,
            'term_id' => $f['term']->id,
            'created_by' => $f['actor']['user']->id,
            'title' => 'Ready paper',
            'type' => 'exam',
            'maximum_score' => 40,
            'status' => 'ready',
            'revision' => 1,
            'scheduled_at' => $start,
            'metadata' => ['participantMode' => 'class', 'contentMode' => 'score-only', 'delivery' => 'manual', 'startTime' => '10:00', 'duration' => 60],
        ]);
        Assessment::query()->create([
            'class_id' => $f['class']->id,
            'subject_id' => $f['subject']->id,
            'academic_session_id' => $f['session']->id,
            'term_id' => $f['term']->id,
            'created_by' => $f['actor']['user']->id,
            'title' => 'Blocking slot',
            'type' => 'exam',
            'maximum_score' => 40,
            'status' => 'scheduled',
            'revision' => 1,
            'scheduled_at' => $start->copy()->addMinutes(30),
            'metadata' => ['participantMode' => 'class', 'venue' => 'Hall A', 'invigilator' => 'Mrs Ade', 'startTime' => '10:30', 'duration' => 60],
        ]);
        app(TenantContext::class)->clear();

        $id = $ready->public_id;
        $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => 'schedule', 'revision' => 1], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('error.message', 'Venue is required before scheduling.');

        app(TenantContext::class)->set($f['actor']['tenant'], $f['actor']['membership']);
        $ready->update(['metadata' => array_merge($ready->metadata ?? [], ['venue' => 'Hall A', 'invigilator' => 'Mrs Ade'])]);
        app(TenantContext::class)->clear();

        $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => 'schedule', 'revision' => 1], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'SCHEDULE_CONFLICT');
    }

    public function test_moderation_checklist_and_unlock_acknowledgement(): void
    {
        $f = $this->fixture();
        $this->grant($f, 'assessment.score.moderate');
        $this->grant($f, 'assessment.score.lock');
        $this->grant($f, 'assessment.score.unlock');
        $id = $f['assessment']->public_id;

        $this->getJson("/api/v1/assessments/{$id}/moderation")
            ->assertOk()
            ->assertJsonPath('data.summary.missing', 1)
            ->assertJsonPath('data.checks.0.id', 'missing_scores')
            ->assertJsonPath('data.checks.0.status', 'fail');

        $revision = $this->getJson("/api/v1/assessments/{$id}/scores")->json('data.revision');
        $this->putJson("/api/v1/assessments/{$id}/scores", ['revision' => $revision, 'scores' => [$f['student']->public_id => 30]], $this->headers())->assertOk();

        foreach (['submit', 'moderate', 'moderate', 'lock'] as $action) {
            $revision = $this->getJson("/api/v1/assessments/{$id}")->json('data.revision');
            $this->postJson("/api/v1/assessments/{$id}/transition", ['action' => $action, 'revision' => $revision, 'acknowledgeWarnings' => true], $this->headers())->assertOk();
        }

        $locked = $this->getJson("/api/v1/assessments/{$id}/moderation")->assertOk()->json('data');
        $this->assertTrue($locked['unlockImpact']['requiresAcknowledgement']);
        $this->assertNotEmpty($locked['unlockImpact']['warnings']);

        $revision = $this->getJson("/api/v1/assessments/{$id}")->json('data.revision');
        $this->postJson("/api/v1/assessments/{$id}/transition", [
            'action' => 'reopen',
            'revision' => $revision,
            'reason' => 'Fix transcription',
            'acknowledgeImpact' => true,
        ], $this->headers())->assertOk()->assertJsonPath('data.status', 'reopened');
    }

    public function test_cbt_delivery_creates_online_assessment_with_availability_window(): void
    {
        $f = $this->fixture();
        $this->grant($f, 'assessment.assessment.create');
        $payload = [
            'title' => 'JSS1 CBT Maths',
            'classId' => $f['class']->public_id,
            'subjectId' => $f['subject']->public_id,
            'assessmentTypeId' => 'test',
            'date' => now()->addDays(2)->toDateString(),
            'maxScore' => 40,
            'participantMode' => 'class',
            'contentMode' => 'score-only',
            'delivery' => 'cbt',
            'startTime' => '10:00',
            'duration' => 45,
            'venue' => '',
            'invigilator' => '',
        ];
        // Venue/invigilator required by validation — Online/System are acceptable CBT defaults.
        $payload['venue'] = 'Online';
        $payload['invigilator'] = 'System';

        $id = $this->postJson('/api/v1/assessments', $payload, $this->headers())
            ->assertCreated()
            ->json('data.id');

        $shown = $this->getJson("/api/v1/assessments/{$id}")
            ->assertOk()
            ->assertJsonPath('data.delivery', 'cbt')
            ->assertJsonPath('data.metadata.contentMode', 'questions')
            ->assertJsonPath('data.metadata.venue', 'Online')
            ->json('data');
        $this->assertNotEmpty($shown['availableFrom']);
        $this->assertNotEmpty($shown['availableUntil']);
        $this->assertSame(
            \Carbon\Carbon::parse($shown['availableFrom'])->addMinutes(45)->toIso8601String(),
            \Carbon\Carbon::parse($shown['availableUntil'])->toIso8601String()
        );

        $this->getJson('/api/v1/assessments?delivery=cbt')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.data.0.title', 'JSS1 CBT Maths');
    }
}
