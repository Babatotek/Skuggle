<?php

namespace Tests\Feature\Assessments;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Assessment;
use App\Models\AssessmentScore;
use App\Models\Campus;
use App\Models\Employee;
use App\Models\Enrollment;
use App\Models\Permission;
use App\Models\SchoolClass;
use App\Models\SmartmarkBatch;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\Term;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class SmartmarkPipelineTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('skuggle.library.disk', 'local');
        Storage::fake('local');
    }

    /** @return array{actor: array, assessment: Assessment, student: Student} */
    private function fixture(): array
    {
        $actor = $this->makeTenantUser('teacher');
        app(TenantContext::class)->set($actor['tenant'], $actor['membership']);
        app(PermissionRegistrySynchronizer::class)->sync();
        $actor['role']->permissions()->syncWithoutDetaching(
            Permission::query()->whereIn('name', ['assessment.smartmark.process', 'assessment.smartmark.review'])->pluck('id')
        );
        $actor['membership']->unsetRelation('role');
        app(CanonicalAuthorizationEvaluator::class)->forget();

        $session = AcademicSession::query()->create(['name' => '2026/27', 'starts_at' => '2026-09-01', 'ends_at' => '2027-08-01', 'is_current' => true, 'status' => 'active']);
        $term = Term::query()->create(['academic_session_id' => $session->id, 'name' => 'First term', 'sequence' => 1, 'starts_at' => '2026-09-01', 'ends_at' => '2026-12-20', 'is_current' => true]);
        $campus = Campus::query()->create(['name' => 'Main', 'code' => 'MAIN', 'status' => 'active']);
        $class = SchoolClass::query()->create(['campus_id' => $campus->id, 'name' => 'JSS 1', 'arm' => 'A', 'status' => 'active']);
        $subject = Subject::query()->create(['name' => 'Mathematics', 'code' => 'MATH', 'status' => 'active']);
        DB::table('class_subject')->insert(['tenant_id' => $actor['tenant']->id, 'class_id' => $class->id, 'subject_id' => $subject->id]);
        Employee::query()->create(['user_id' => $actor['user']->id, 'employee_number' => 'T-SM', 'name' => 'SmartMark Teacher', 'employment_type' => 'full_time', 'status' => 'active']);
        TeacherAssignment::query()->create(['user_id' => $actor['user']->id, 'class_id' => $class->id, 'subject_id' => $subject->id, 'academic_session_id' => $session->id]);
        $student = $this->makeStudentForTenant($actor['tenant'], [
            'first_name' => 'Test',
            'last_name' => 'Learner',
            'admission_number' => 'ST-SM-1',
        ]);
        app(TenantContext::class)->set($actor['tenant'], $actor['membership']);
        Enrollment::query()->create(['student_id' => $student->id, 'class_id' => $class->id, 'academic_session_id' => $session->id, 'term_id' => $term->id, 'status' => 'active']);
        $assessment = Assessment::query()->create([
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'academic_session_id' => $session->id,
            'term_id' => $term->id,
            'created_by' => $actor['user']->id,
            'title' => 'SmartMark CA',
            'type' => 'continuous-assessment',
            'maximum_score' => 10,
            'status' => 'marking',
            'revision' => 1,
            'scheduled_at' => now()->subDay(),
            'metadata' => [
                'participantMode' => 'class',
                'contentMode' => 'score-only',
                'delivery' => 'smartmark',
                'startTime' => '09:00',
                'duration' => 40,
                'venue' => 'Hall A',
                'invigilator' => 'EO',
            ],
        ]);
        app(TenantContext::class)->clear();
        app(CanonicalAuthorizationEvaluator::class)->forget();
        $this->actingAsTenantUser($actor['user'], $actor['tenant']);

        return compact('actor', 'assessment', 'student');
    }

    private function headers(): array
    {
        return ['Idempotency-Key' => (string) Str::uuid()];
    }

    private function scanFile(array $sheets): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

        return UploadedFile::fake()->createWithContent('scan.png', $png.json_encode(['sheets' => $sheets]));
    }

    public function test_high_confidence_matched_sheet_auto_proposes_and_commits_to_scores(): void
    {
        $fx = $this->fixture();
        $response = $this->post('/api/v1/smartmark/batches', [
            'file' => $this->scanFile([[
                'admissionNumber' => 'ST-SM-1',
                'studentName' => 'Test Learner',
                'answers' => ['A', 'B', 'C', 'D', 'A'],
                'confidence' => 97,
                'flagReason' => '',
            ]]),
            'assessmentId' => $fx['assessment']->public_id,
            'answerKey' => ['A', 'B', 'C', 'D', 'A'],
            'maxScore' => 10,
        ], $this->headers());
        $response->assertStatus(202);
        $batchId = $response->json('data.id');
        app(TenantContext::class)->set($fx['actor']['tenant'], $fx['actor']['membership']);
        $batch = SmartmarkBatch::query()->where('public_id', $batchId)->firstOrFail();
        $this->assertSame('review', $batch->state);
        $sheet = $batch->sheets()->firstOrFail();
        $this->assertFalse((bool) $sheet->human_review_required);
        $this->assertNotNull($sheet->reviewed_at);
        $this->assertSame(10.0, (float) $sheet->detected_score);

        $this->postJson("/api/v1/smartmark/batches/{$batchId}/commit", [], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.state', 'committed');
        app(TenantContext::class)->set($fx['actor']['tenant'], $fx['actor']['membership']);
        $this->assertSame(1, AssessmentScore::query()->where('assessment_id', $fx['assessment']->id)->count());
        $score = AssessmentScore::query()->first();
        $this->assertSame(10.0, (float) $score->score);
        $this->assertSame('smartmark', $score->metadata['source'] ?? null);
    }

    public function test_unmatched_sheet_requires_roster_assignment_before_commit(): void
    {
        $fx = $this->fixture();
        $response = $this->post('/api/v1/smartmark/batches', [
            'file' => $this->scanFile([[
                'admissionNumber' => 'UNKNOWN-99',
                'studentName' => 'Ghost Candidate',
                'answers' => ['A', 'A', 'A', 'A', 'A'],
                'confidence' => 99,
                'flagReason' => '',
            ]]),
            'assessmentId' => $fx['assessment']->public_id,
            'answerKey' => ['A', 'B', 'C', 'D', 'A'],
            'maxScore' => 10,
        ], $this->headers());
        $response->assertStatus(202);
        $batchId = $response->json('data.id');
        $sheetId = $response->json('data.sheets.0.id');
        $this->assertTrue($response->json('data.sheets.0.flagged'));
        $this->assertSame('UNMATCHED', $response->json('data.sheets.0.confidenceBand'));

        $this->postJson("/api/v1/smartmark/batches/{$batchId}/commit", [], $this->headers())->assertStatus(422);

        $this->patchJson("/api/v1/smartmark/sheets/{$sheetId}", [
            'studentId' => $fx['student']->public_id,
            'detectedScore' => 2,
            'approved' => true,
        ], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.flagged', false);

        $this->postJson("/api/v1/smartmark/batches/{$batchId}/commit", [], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.state', 'committed');
    }

    public function test_locked_assessment_rejects_smartmark_upload(): void
    {
        $fx = $this->fixture();
        $fx['assessment']->update(['status' => 'locked']);
        $this->post('/api/v1/smartmark/batches', [
            'file' => $this->scanFile([[
                'admissionNumber' => 'ST-SM-1',
                'studentName' => 'Test Learner',
                'answers' => ['A', 'B', 'C', 'D', 'A'],
                'confidence' => 99,
            ]]),
            'assessmentId' => $fx['assessment']->public_id,
            'answerKey' => ['A', 'B', 'C', 'D', 'A'],
            'maxScore' => 10,
        ], $this->headers())->assertForbidden();
    }
}
