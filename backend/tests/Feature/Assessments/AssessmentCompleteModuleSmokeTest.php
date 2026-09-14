<?php

namespace Tests\Feature\Assessments;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentScore;
use App\Models\Campus;
use App\Models\Employee;
use App\Models\Enrollment;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\SmartmarkBatch;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\TenantMembership;
use App\Models\Term;
use App\Models\User;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

/**
 * Tenant smoke: create assessment → CBT attempt → SmartMark review/commit → lock.
 */
final class AssessmentCompleteModuleSmokeTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('skuggle.library.disk', 'local');
        Storage::fake('local');
    }

    public function test_create_cbt_smartmark_and_lock_smoke_path(): void
    {
        $staff = $this->makeTenantUser('teacher');
        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        app(PermissionRegistrySynchronizer::class)->sync();
        $staff['role']->permissions()->syncWithoutDetaching(
            Permission::query()->whereIn('name', [
                'assessment.assessment.create',
                'assessment.assessment.view',
                'assessment.score.enter',
                'assessment.score.moderate',
                'assessment.score.lock',
                'assessment.smartmark.process',
                'assessment.smartmark.review',
                'scores.approve',
            ])->pluck('id')
        );
        $staff['membership']->unsetRelation('role');
        app(CanonicalAuthorizationEvaluator::class)->forget();

        $session = AcademicSession::query()->create(['name' => '2026/27', 'starts_at' => '2026-09-01', 'ends_at' => '2027-08-01', 'is_current' => true, 'status' => 'active']);
        $term = Term::query()->create(['academic_session_id' => $session->id, 'name' => 'First term', 'sequence' => 1, 'starts_at' => '2026-09-01', 'ends_at' => '2026-12-20', 'is_current' => true]);
        $campus = Campus::query()->create(['name' => 'Main', 'code' => 'MAIN', 'status' => 'active']);
        $class = SchoolClass::query()->create(['campus_id' => $campus->id, 'name' => 'JSS 1', 'arm' => 'A', 'status' => 'active']);
        $subject = Subject::query()->create(['name' => 'Mathematics', 'code' => 'MATH', 'status' => 'active']);
        DB::table('class_subject')->insert(['tenant_id' => $staff['tenant']->id, 'class_id' => $class->id, 'subject_id' => $subject->id]);
        Employee::query()->create(['user_id' => $staff['user']->id, 'employee_number' => 'T-SMOKE', 'name' => 'Smoke Teacher', 'employment_type' => 'full_time', 'status' => 'active']);
        TeacherAssignment::query()->create(['user_id' => $staff['user']->id, 'class_id' => $class->id, 'subject_id' => $subject->id, 'academic_session_id' => $session->id]);

        $studentUser = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $studentRole = Role::query()->where('name', 'student')->firstOrFail();
        $studentRole->permissions()->syncWithoutDetaching([
            Permission::query()->where('name', 'assessment.cbt.attempt')->value('id'),
            Permission::query()->where('name', 'assessments.view')->value('id'),
        ]);
        TenantMembership::query()->create([
            'tenant_id' => $staff['tenant']->id,
            'user_id' => $studentUser->id,
            'role_id' => $studentRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        $student = $this->makeStudentForTenant($staff['tenant'], [
            'user_id' => $studentUser->id,
            'first_name' => 'Smoke',
            'last_name' => 'Learner',
            'admission_number' => 'ST-SMOKE-1',
        ]);
        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        Enrollment::query()->create(['student_id' => $student->id, 'class_id' => $class->id, 'academic_session_id' => $session->id, 'term_id' => $term->id, 'status' => 'active']);
        app(TenantContext::class)->clear();
        app(CanonicalAuthorizationEvaluator::class)->forget();

        $headers = ['Idempotency-Key' => (string) Str::uuid()];
        $this->actingAsTenantUser($staff['user'], $staff['tenant']);

        // 1) Create CBT assessment via API
        $create = $this->postJson('/api/v1/assessments', [
            'title' => 'Smoke CBT',
            'classId' => $class->public_id,
            'subjectId' => $subject->public_id,
            'assessmentTypeId' => 'test',
            'date' => now()->toDateString(),
            'maxScore' => 10,
            'instructions' => 'Smoke',
            'description' => 'Smoke path',
            'weighting' => 10,
            'code' => 'SMK-CBT',
            'participantMode' => 'class',
            'studentIds' => [],
            'contentMode' => 'questions',
            'delivery' => 'cbt',
            'startTime' => now()->subMinutes(5)->format('H:i'),
            'duration' => 60,
            'venue' => 'Online',
            'invigilator' => 'System',
            'passThreshold' => 4,
            'latePolicy' => 'allow',
            'randomQuestions' => false,
            'randomOptions' => false,
            'attemptLimit' => 1,
            'resumePolicy' => 'allow',
            'feedbackPolicy' => 'score',
            'navigationRestricted' => false,
        ], $headers)->assertCreated();
        $cbtId = $create->json('data.id');

        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        $cbt = Assessment::query()->where('public_id', $cbtId)->firstOrFail();
        $question = AssessmentQuestion::query()->create([
            'assessment_id' => $cbt->id,
            'prompt' => '2 + 2 = ?',
            'question_type' => 'multiple-choice',
            'options' => ['3', '4', '5'],
            'correct_answer' => '4',
            'marks' => 10,
            'position' => 1,
            'status' => 'accepted',
        ]);
        $cbt->update([
            'status' => 'active',
            'revision' => $cbt->revision + 1,
            'scheduled_at' => now()->subMinutes(5),
            'delivery' => 'cbt',
            'content_mode' => 'questions',
            'participant_mode' => 'class',
            'duration_minutes' => 60,
            'starts_at' => now()->subMinutes(5),
            'ends_at' => now()->addMinutes(55),
        ]);
        app(TenantContext::class)->clear();

        // 2) Student CBT attempt → auto-marked score
        $this->actingAsTenantUser($studentUser, $staff['tenant']);
        $this->getJson('/api/v1/student/cbt/assessments')->assertOk()->assertJsonPath('data.data.0.id', $cbtId);
        $qid = $this->getJson("/api/v1/student/cbt/assessments/{$cbtId}")->json('data.questions.0.id');
        $this->postJson("/api/v1/student/cbt/assessments/{$cbtId}/attempts", [
            'answers' => [$qid => '4'],
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.score', 10);
        $this->assertDatabaseHas('assessment_scores', [
            'assessment_id' => $cbt->id,
            'student_id' => $student->id,
            'status' => 'AUTO_MARKED',
        ]);

        // 3) SmartMark upload → auto-propose → commit (separate delivery assessment)
        $this->actingAsTenantUser($staff['user'], $staff['tenant']);
        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        $smart = Assessment::query()->create([
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'academic_session_id' => $session->id,
            'term_id' => $term->id,
            'created_by' => $staff['user']->id,
            'title' => 'Smoke SmartMark',
            'type' => 'test',
            'maximum_score' => 10,
            'status' => 'marking',
            'revision' => 1,
            'scheduled_at' => now()->subDay(),
            'delivery' => 'smartmark',
            'content_mode' => 'questions',
            'participant_mode' => 'class',
            'metadata' => [
                'participantMode' => 'class',
                'contentMode' => 'questions',
                'delivery' => 'smartmark',
                'startTime' => '09:00',
                'duration' => 40,
                'venue' => 'Hall A',
                'invigilator' => 'EO',
            ],
        ]);
        app(TenantContext::class)->clear();

        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        $scan = UploadedFile::fake()->createWithContent('scan.png', $png.json_encode(['sheets' => [[
            'admissionNumber' => 'ST-SMOKE-1',
            'studentName' => 'Smoke Learner',
            'answers' => ['A', 'B', 'C', 'D', 'A'],
            'confidence' => 97,
            'flagReason' => '',
        ]]]));
        $batchResponse = $this->post('/api/v1/smartmark/batches', [
            'file' => $scan,
            'assessmentId' => $smart->public_id,
            'answerKey' => ['A', 'B', 'C', 'D', 'A'],
            'maxScore' => 10,
        ], ['Idempotency-Key' => (string) Str::uuid()])->assertStatus(202);
        $batchId = $batchResponse->json('data.id');

        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        $batch = SmartmarkBatch::query()->where('public_id', $batchId)->firstOrFail();
        $this->assertSame('review', $batch->state);
        app(TenantContext::class)->clear();

        $this->postJson("/api/v1/smartmark/batches/{$batchId}/commit", [], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.state', 'committed');
        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        $this->assertSame(1, AssessmentScore::query()->where('assessment_id', $smart->id)->count());
        app(TenantContext::class)->clear();

        // 4) Lock CBT assessment (moderation skipped via tenant settings)
        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        $cbt->refresh()->update([
            'status' => 'completed',
            'revision' => $cbt->revision + 1,
        ]);
        $tenant = $staff['tenant']->fresh();
        $settings = $tenant->settings ?? [];
        $settings['assessment'] = array_merge($settings['assessment'] ?? [], [
            'moderationRequired' => false,
            'multiStageModeration' => false,
        ]);
        $tenant->update(['settings' => $settings]);
        app(TenantContext::class)->clear();

        $revision = $this->getJson("/api/v1/assessments/{$cbtId}")->json('data.revision');
        $this->postJson("/api/v1/assessments/{$cbtId}/transition", [
            'action' => 'lock',
            'revision' => $revision,
            'acknowledgeWarnings' => true,
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.status', 'locked');

        app(TenantContext::class)->set($staff['tenant'], $staff['membership']);
        $locked = Assessment::query()->where('public_id', $cbtId)->firstOrFail();
        $this->assertSame('locked', $locked->status);
        $this->assertNotNull($locked->locked_at);
        $this->assertSame($staff['user']->id, (int) $locked->locked_by);
    }
}
