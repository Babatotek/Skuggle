<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentRubricScore;
use App\Models\AssessmentScoreAdjustment;
use App\Models\AssessmentSection;
use App\Models\AssessmentTemplate;
use App\Models\AssessmentType;
use App\Models\SmartmarkBatch;
use App\Models\SmartmarkDetection;
use App\Models\SmartmarkSheet;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class AssessmentCompleteService
{
    public function persistCanonical(Assessment $item, array $data): void
    {
        $duration = (int) ($data['duration'] ?? $item->duration_minutes ?? 60);
        $date = $data['date'] ?? ($item->scheduled_at?->toDateString());
        $start = $data['startTime'] ?? ($item->metadata['startTime'] ?? '09:00');
        $starts = $date ? $date.' '.$start : null;
        $item->fill([
            'weight' => $data['weighting'] ?? $item->weight,
            'description' => $data['description'] ?? $item->description,
            'instructions' => $data['instructions'] ?? $item->instructions,
            'delivery' => $data['delivery'] ?? $item->delivery,
            'code' => $data['code'] ?? $item->code,
            'participant_mode' => $data['participantMode'] ?? $item->participant_mode,
            'content_mode' => $data['contentMode'] ?? $item->content_mode,
            'pass_threshold' => $data['passThreshold'] ?? $item->pass_threshold,
            'late_policy' => $data['latePolicy'] ?? $item->late_policy,
            'random_questions' => (bool) ($data['randomQuestions'] ?? $item->random_questions),
            'random_options' => (bool) ($data['randomOptions'] ?? $item->random_options),
            'attempt_limit' => (int) ($data['attemptLimit'] ?? $item->attempt_limit ?? 1),
            'resume_policy' => $data['resumePolicy'] ?? $item->resume_policy,
            'feedback_policy' => $data['feedbackPolicy'] ?? $item->feedback_policy,
            'navigation_restricted' => (bool) ($data['navigationRestricted'] ?? $item->navigation_restricted),
            'duration_minutes' => $duration,
            'starts_at' => $starts,
            'ends_at' => $starts ? Carbon::parse($starts)->addMinutes(max(1, $duration)) : null,
            'responsible_teacher_id' => $item->responsible_teacher_id ?? $item->created_by,
        ]);
    }

    public function recordAdjustment(Assessment $item, int $studentId, ?float $previous, ?float $next, ?string $fromStatus, ?string $toStatus, int $actorId, ?int $scoreId = null, ?string $reason = null): void
    {
        if ($previous === $next && $fromStatus === $toStatus) {
            return;
        }
        AssessmentScoreAdjustment::query()->create([
            'assessment_id' => $item->getKey(),
            'student_id' => $studentId,
            'score_id' => $scoreId,
            'previous_score' => $previous,
            'new_score' => $next,
            'previous_status' => $fromStatus,
            'new_status' => $toStatus,
            'reason' => $reason,
            'correlation_id' => (string) Str::uuid(),
            'actor_id' => $actorId,
        ]);
    }

    /** @param list<array{criterion?:string,score?:float|int,max?:float|int}> $breakdown */
    public function recordRubric(Assessment $item, int $studentId, array $breakdown, ?int $questionId = null): void
    {
        foreach ($breakdown as $row) {
            $criterion = trim((string) ($row['criterion'] ?? $row['label'] ?? ''));
            if ($criterion === '') {
                continue;
            }
            AssessmentRubricScore::query()->updateOrCreate(
                [
                    'assessment_id' => $item->getKey(),
                    'student_id' => $studentId,
                    'question_id' => $questionId,
                    'criterion' => $criterion,
                ],
                [
                    'score' => (float) ($row['score'] ?? 0),
                    'maximum' => (float) ($row['max'] ?? $row['maxMarks'] ?? 0),
                    'comment' => isset($row['comment']) ? (string) $row['comment'] : null,
                ]
            );
        }
    }

    /** @param list<string> $answers @param list<string> $answerKey */
    public function writeDetections(SmartmarkSheet $sheet, array $answers, array $answerKey, float $sheetConfidence): void
    {
        $sheet->detections()->delete();
        foreach (array_values($answerKey) as $index => $expected) {
            $detected = strtoupper((string) ($answers[$index] ?? '?'));
            $expected = strtoupper((string) $expected);
            $ambiguous = in_array($detected, ['', '?', '*'], true);
            SmartmarkDetection::query()->create([
                'sheet_id' => $sheet->getKey(),
                'position' => $index + 1,
                'expected' => $expected,
                'detected' => $detected,
                'confidence' => $ambiguous ? min($sheetConfidence, 45) : $sheetConfidence,
                'marks' => $detected === $expected && ! $ambiguous ? 1 : 0,
                'teacher_decision' => null,
            ]);
        }
    }

    public function duplicate(Assessment $item, int $actorId): Assessment
    {
        return DB::transaction(function () use ($item, $actorId) {
            $copy = $item->replicate(['public_id', 'status', 'revision', 'locked_at', 'locked_by', 'published_at']);
            $copy->title = $item->title.' (copy)';
            $copy->status = 'draft';
            $copy->revision = 1;
            $copy->created_by = $actorId;
            $copy->locked_at = null;
            $copy->locked_by = null;
            $copy->save();
            $sectionMap = [];
            foreach ($item->sections()->orderBy('position')->get() as $section) {
                $newSection = $section->replicate(['public_id']);
                $newSection->assessment_id = $copy->getKey();
                $newSection->save();
                $sectionMap[$section->getKey()] = $newSection->getKey();
            }
            foreach ($item->questions()->orderBy('position')->get() as $question) {
                $row = $question->replicate(['public_id']);
                $row->assessment_id = $copy->getKey();
                $row->section_id = $question->section_id ? ($sectionMap[$question->section_id] ?? null) : null;
                $row->save();
            }
            app(AuditLogger::class)->record('assessment.duplicated', $copy, [], ['source' => $item->public_id]);

            return $copy;
        });
    }

    public function saveTemplate(Assessment $item, int $actorId, ?string $title = null): AssessmentTemplate
    {
        $item->loadMissing(['questions', 'sections']);
        $template = AssessmentTemplate::query()->create([
            'created_by' => $actorId,
            'title' => $title ?: $item->title.' template',
            'type' => $item->type,
            'payload' => [
                'type' => $item->type,
                'maxScore' => (float) $item->maximum_score,
                'weighting' => $item->weight,
                'delivery' => $item->delivery ?? $item->meta('delivery'),
                'contentMode' => $item->content_mode ?? $item->meta('contentMode'),
                'instructions' => $item->instructions ?? $item->meta('instructions'),
                'cbt' => [
                    'randomQuestions' => (bool) $item->random_questions,
                    'randomOptions' => (bool) $item->random_options,
                    'attemptLimit' => (int) ($item->attempt_limit ?: 1),
                    'resumePolicy' => $item->resume_policy,
                    'feedbackPolicy' => $item->feedback_policy,
                    'latePolicy' => $item->late_policy,
                    'navigationRestricted' => (bool) $item->navigation_restricted,
                ],
                'sections' => $item->sections->map(fn ($s) => [
                    'title' => $s->title,
                    'position' => $s->position,
                    'optionalCount' => $s->optional_count,
                    'maximumMarks' => $s->maximum_marks,
                    'instructions' => $s->instructions,
                ])->values()->all(),
                'questions' => $item->questions->map(fn ($q) => [
                    'prompt' => $q->prompt,
                    'questionType' => $q->question_type,
                    'options' => $q->options,
                    'correctAnswer' => $q->correct_answer,
                    'rationale' => $q->rationale,
                    'rubric' => $q->rubric,
                    'marks' => (float) $q->marks,
                    'position' => $q->position,
                    'section' => $q->learning_outcome,
                    'learningObjective' => $q->learning_objective,
                ])->values()->all(),
            ],
        ]);
        app(AuditLogger::class)->record('assessment.template_saved', $item, [], ['templateId' => $template->public_id]);

        return $template;
    }

    public function applyTemplate(Assessment $item, AssessmentTemplate $template): Assessment
    {
        $payload = $template->payload ?? [];

        return DB::transaction(function () use ($item, $template, $payload) {
            $item->update([
                'template_id' => $template->getKey(),
                'content_mode' => $payload['contentMode'] ?? $item->content_mode,
                'instructions' => $payload['instructions'] ?? $item->instructions,
                'random_questions' => (bool) data_get($payload, 'cbt.randomQuestions', $item->random_questions),
                'random_options' => (bool) data_get($payload, 'cbt.randomOptions', $item->random_options),
                'attempt_limit' => (int) data_get($payload, 'cbt.attemptLimit', $item->attempt_limit ?: 1),
                'resume_policy' => data_get($payload, 'cbt.resumePolicy', $item->resume_policy),
                'feedback_policy' => data_get($payload, 'cbt.feedbackPolicy', $item->feedback_policy),
                'late_policy' => data_get($payload, 'cbt.latePolicy', $item->late_policy),
                'navigation_restricted' => (bool) data_get($payload, 'cbt.navigationRestricted', $item->navigation_restricted),
            ]);
            $item->sections()->delete();
            $item->questions()->delete();
            foreach ((array) ($payload['sections'] ?? []) as $section) {
                AssessmentSection::query()->create([
                    'assessment_id' => $item->getKey(),
                    'title' => $section['title'] ?? 'Section',
                    'position' => (int) ($section['position'] ?? 1),
                    'optional_count' => $section['optionalCount'] ?? null,
                    'maximum_marks' => $section['maximumMarks'] ?? null,
                    'instructions' => $section['instructions'] ?? null,
                ]);
            }
            foreach ((array) ($payload['questions'] ?? []) as $index => $question) {
                AssessmentQuestion::query()->create([
                    'assessment_id' => $item->getKey(),
                    'prompt' => $question['prompt'] ?? '',
                    'question_type' => $question['questionType'] ?? 'multiple-choice',
                    'options' => $question['options'] ?? [],
                    'correct_answer' => $question['correctAnswer'] ?? '',
                    'rationale' => $question['rationale'] ?? '',
                    'rubric' => $question['rubric'] ?? null,
                    'marks' => $question['marks'] ?? 1,
                    'position' => $question['position'] ?? ($index + 1),
                    'learning_outcome' => $question['section'] ?? '',
                    'learning_objective' => $question['learningObjective'] ?? null,
                ]);
            }
            $item->increment('revision');

            return $item->fresh();
        });
    }

    /** @param list<array{title:string,position?:int,optionalCount?:int|null,maximumMarks?:float|int|null,instructions?:?string}> $sections */
    public function syncSections(Assessment $item, array $sections): Collection
    {
        $keep = [];
        foreach ($sections as $index => $row) {
            $section = AssessmentSection::query()->updateOrCreate(
                ['assessment_id' => $item->getKey(), 'title' => $row['title'], 'position' => (int) ($row['position'] ?? $index + 1)],
                [
                    'optional_count' => $row['optionalCount'] ?? $row['optional_count'] ?? null,
                    'maximum_marks' => $row['maximumMarks'] ?? $row['maximum_marks'] ?? null,
                    'instructions' => $row['instructions'] ?? null,
                ]
            );
            $keep[] = $section->getKey();
        }
        $item->sections()->whereNotIn('id', $keep)->delete();

        return $item->sections()->orderBy('position')->get();
    }

    public function presentType(AssessmentType $type): array
    {
        return [
            'id' => $type->code,
            'publicId' => $type->public_id,
            'name' => $type->name,
            'defaultMaximumScore' => (float) $type->default_maximum_score,
            'defaultWeight' => (float) $type->default_weight,
            'allowedDelivery' => $type->allowed_delivery ?? [],
            'moderationRequired' => (bool) $type->moderation_required,
            'resitAllowed' => (bool) $type->resit_allowed,
            'resultContribution' => (bool) $type->result_contribution,
            'active' => (bool) $type->is_active,
        ];
    }

    public function exceptionCsv(SmartmarkBatch $batch): string
    {
        $batch->loadMissing(['sheets.detections', 'assessment']);
        $lines = ['Batch,Assessment,Student,Admission,Band,Question,Expected,Detected,Confidence,Decision'];
        foreach ($batch->sheets as $sheet) {
            $detections = $sheet->detections->isEmpty()
                ? collect(array_values($sheet->answers ?? []))->map(fn ($detected, $i) => (object) [
                    'position' => $i + 1,
                    'expected' => $batch->answer_key[$i] ?? '',
                    'detected' => $detected,
                    'confidence' => $sheet->confidence,
                    'teacher_decision' => null,
                ])
                : $sheet->detections;
            foreach ($detections as $detection) {
                $lines[] = sprintf(
                    '"%s","%s","%s","%s",%s,%s,%s,%s,%s,%s',
                    $batch->public_id,
                    str_replace('"', '""', (string) $batch->assessment?->title),
                    str_replace('"', '""', (string) $sheet->student_name),
                    str_replace('"', '""', (string) $sheet->admission_number),
                    $sheet->flag_reason ? 'EXCEPTION' : 'OK',
                    $detection->position,
                    $detection->expected,
                    $detection->detected,
                    $detection->confidence,
                    $detection->teacher_decision ?? ''
                );
            }
        }

        return implode("\n", $lines);
    }

    public function storeQuestionImage(string $bytes, string $extension): string
    {
        $disk = (string) config('skuggle.library.disk');
        $key = 'assessment-media/'.app(TenantContext::class)->tenantId().'/'.Str::ulid().'.'.$extension;
        Storage::disk($disk)->put($key, $bytes, ['visibility' => 'private']);

        return $key;
    }

    public function fingerprint(array $answers): string
    {
        ksort($answers);

        return hash('sha256', json_encode($answers, JSON_THROW_ON_ERROR));
    }
}
