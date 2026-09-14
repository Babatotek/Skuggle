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
use App\Models\SchoolClass;
use App\Models\SmartmarkBatch;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\Term;
use App\Services\AssessmentWorkflow;
use App\Services\PermissionRegistrySynchronizer;
use App\Services\SmartmarkGeometricOmrService;
use App\Services\SmartmarkOmrGeometry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class SmartmarkGeometricOmrTest extends TestCase
{
    use CreatesTenantUsers, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('skuggle.library.disk', 'local');
        config()->set('skuggle.ocr.provider', 'geometric');
        Storage::fake('local');
    }

    public function test_geometry_encodes_and_decodes_scan_strip(): void
    {
        $geometry = app(SmartmarkOmrGeometry::class);
        $payload = 'SM|01HABCDEFGHJKMNPQRSTVWXYZ|ST-SM-1';
        $bits = $geometry->encodeScanStrip($payload);
        $this->assertSame($payload, $geometry->decodeScanStrip($bits));
    }

    public function test_geometric_reader_recovers_answers_from_synthesized_sheet(): void
    {
        $fx = $this->fixture();
        app(TenantContext::class)->set($fx['actor']['tenant'], $fx['actor']['membership']);
        $layout = app(AssessmentWorkflow::class)->omrLayout($fx['assessment'], true);
        $this->assertTrue($layout['enabled']);
        $this->assertSame(SmartmarkOmrGeometry::VERSION, $layout['geometry']['version']);
        $this->assertNotEmpty($layout['geometry']['bubbles']);

        $scanCode = 'SM|'.$fx['assessment']->public_id.'|ST-SM-1';
        $png = app(SmartmarkGeometricOmrService::class)->synthesize($layout, $scanCode, ['B', 'A', 'C'], 2);
        $sheets = app(SmartmarkGeometricOmrService::class)->extract($png, 'image/png', $layout);

        $this->assertCount(1, $sheets);
        $this->assertSame('ST-SM-1', $sheets[0]['admissionNumber']);
        $this->assertSame($scanCode, $sheets[0]['scanCode']);
        $this->assertSame(['B', 'A', 'C'], $sheets[0]['answers']);
        $this->assertSame('geometric', $sheets[0]['omrMethod']);
        $this->assertGreaterThanOrEqual(70, (float) $sheets[0]['confidence']);
        app(TenantContext::class)->clear();
    }

    public function test_geometric_pipeline_upload_commit_locks_scores(): void
    {
        $fx = $this->fixture();
        app(TenantContext::class)->set($fx['actor']['tenant'], $fx['actor']['membership']);
        $layout = app(AssessmentWorkflow::class)->omrLayout($fx['assessment'], true);
        $this->assertSame(['B', 'A', 'C'], $layout['answerKey']);
        $scanCode = 'SM|'.$fx['assessment']->public_id.'|ST-SM-1';
        $png = app(SmartmarkGeometricOmrService::class)->synthesize($layout, $scanCode, ['B', 'A', 'C'], 2);
        $file = UploadedFile::fake()->createWithContent('geometric-omr.png', $png);

        $response = $this->post('/api/v1/smartmark/batches', [
            'file' => $file,
            'assessmentId' => $fx['assessment']->public_id,
            'answerKey' => ['B', 'A', 'C'],
            'maxScore' => 10,
        ], ['Idempotency-Key' => (string) Str::uuid()]);
        $response->assertStatus(202);
        $batchId = $response->json('data.id');

        app(TenantContext::class)->set($fx['actor']['tenant'], $fx['actor']['membership']);
        $batch = SmartmarkBatch::query()->where('public_id', $batchId)->firstOrFail();
        $this->assertSame('review', $batch->state);
        $sheet = $batch->sheets()->firstOrFail();
        $this->assertSame(['B', 'A', 'C'], $sheet->answers);
        $this->assertSame('ST-SM-1', $sheet->admission_number);
        $this->assertFalse((bool) $sheet->human_review_required);

        $this->postJson("/api/v1/smartmark/batches/{$batchId}/commit", [], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.state', 'committed');

        app(TenantContext::class)->set($fx['actor']['tenant'], $fx['actor']['membership']);
        $this->assertSame(1, AssessmentScore::query()->where('assessment_id', $fx['assessment']->id)->count());
        $score = AssessmentScore::query()->first();
        $this->assertSame(10.0, (float) $score->score);
        $this->assertSame('smartmark', $score->metadata['source'] ?? null);
    }

    /** @return array{actor: array, assessment: Assessment} */
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
        Employee::query()->create(['user_id' => $actor['user']->id, 'employee_number' => 'T-GEO', 'name' => 'Geo Teacher', 'employment_type' => 'full_time', 'status' => 'active']);
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
            'title' => 'Geometric OMR CA',
            'type' => 'continuous-assessment',
            'maximum_score' => 10,
            'status' => 'marking',
            'revision' => 1,
            'scheduled_at' => now()->subDay(),
            'delivery' => 'smartmark',
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
        foreach ([['2+2?', '4', ['3', '4', '5'], 'A'], ['Capital of France?', 'Paris', ['Paris', 'Lyon', 'Nice'], 'B'], ['3*3?', '9', ['6', '8', '9'], 'C']] as $i => [$prompt, $answer, $options, $_letter]) {
            AssessmentQuestion::query()->create([
                'assessment_id' => $assessment->id,
                'prompt' => $prompt,
                'question_type' => 'multiple-choice',
                'options' => $options,
                'correct_answer' => $answer,
                'marks' => $i === 2 ? 4 : 3,
                'position' => $i + 1,
            ]);
        }
        app(TenantContext::class)->clear();
        app(CanonicalAuthorizationEvaluator::class)->forget();
        $this->actingAsTenantUser($actor['user'], $actor['tenant']);

        return compact('actor', 'assessment');
    }
}
