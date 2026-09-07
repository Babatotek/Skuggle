<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Exceptions\ApiException;
use App\Models\Assessment;
use App\Models\AssessmentScore;
use App\Models\AuditLog;
use App\Models\Enrollment;
use App\Models\ResultPublication;
use App\Models\SmartmarkBatch;
use App\Support\QrCodeSvg;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class AssessmentWorkflow
{
    public const EDITABLE = ['draft', 'ready', 'scheduled', 'active', 'completed', 'marking', 'reopened', 'submitted'];

    public const TYPES = ['continuous-assessment', 'quiz', 'test', 'mid-term-test', 'exam', 'assignment', 'project', 'practical', 'oral', 'presentation'];

    public const QUESTION_TYPES = ['multiple-choice', 'true-false', 'multiple-response', 'fill-blank', 'short-answer', 'essay', 'calculation', 'matching'];

    public const PAPER_VARIANTS = ['candidate', 'examiner', 'scheme', 'answer-sheet', 'omr-sheet', 'register'];

    public function roster(Assessment $item)
    {
        return Enrollment::query()->where('class_id', $item->class_id)->where('academic_session_id', $item->academic_session_id)
            ->where('status', 'active')->with('student')->get()->pluck('student')->filter()
            ->when(($item->metadata['participantMode'] ?? 'class') === 'selected', fn ($students) => $students->whereIn('public_id', $item->metadata['studentIds'] ?? []))
            ->unique('id')->values();
    }

    public function revision(Assessment $item): string
    {
        // Every writer locks and increments the assessment row. Score revisions also
        // include writes from compatible consumers using the existing score model.
        $scores = AssessmentScore::query()->where('assessment_id', $item->getKey())->orderBy('id')->get(['id', 'revision', 'updated_at']);

        return hash('sha256', $item->revision.'|'.$scores->toJson());
    }

    /**
     * @param  Collection<int, Assessment>  $candidates
     * @return list<array{type:string,message:string,assessmentId:string,title:string}>
     */
    public function scheduleConflicts(Assessment $item, Collection $candidates): array
    {
        $meta = $item->metadata ?? [];
        $duration = max(1, (int) ($meta['duration'] ?? 60));
        $start = $item->scheduled_at;
        if (! $start) {
            return [['type' => 'schedule', 'message' => 'Choose a date and start time before scheduling.', 'assessmentId' => $item->public_id, 'title' => $item->title]];
        }
        $end = $start->copy()->addMinutes($duration);
        $conflicts = [];
        foreach ($candidates as $other) {
            if (! $other->scheduled_at) {
                continue;
            }
            $otherEnd = $other->scheduled_at->copy()->addMinutes(max(1, (int) ($other->metadata['duration'] ?? 60)));
            if ($otherEnd->lte($start) || $other->scheduled_at->gte($end)) {
                continue;
            }
            if ((int) $other->class_id === (int) $item->class_id) {
                $conflicts[] = ['type' => 'class', 'message' => 'Same class overlaps '.$other->title.'.', 'assessmentId' => $other->public_id, 'title' => $other->title];
            }
            $delivery = (string) ($meta['delivery'] ?? 'manual');
            $otherDelivery = (string) ($other->metadata['delivery'] ?? 'manual');
            $venue = trim((string) ($meta['venue'] ?? ''));
            $otherVenue = trim((string) ($other->metadata['venue'] ?? ''));
            // Online CBT venues are shared capacity; do not treat "Online" as a physical room conflict.
            if ($delivery !== 'cbt' && $otherDelivery !== 'cbt' && $venue !== '' && strcasecmp($venue, 'Online') !== 0 && strcasecmp($venue, $otherVenue) === 0) {
                $conflicts[] = ['type' => 'venue', 'message' => 'Venue "'.$venue.'" overlaps '.$other->title.'.', 'assessmentId' => $other->public_id, 'title' => $other->title];
            }
            $invigilator = trim((string) ($meta['invigilator'] ?? ''));
            $otherInvigilator = trim((string) ($other->metadata['invigilator'] ?? ''));
            if ($delivery !== 'cbt' && $otherDelivery !== 'cbt' && $invigilator !== '' && strcasecmp($invigilator, 'System') !== 0 && strcasecmp($invigilator, $otherInvigilator) === 0) {
                $conflicts[] = ['type' => 'invigilator', 'message' => 'Invigilator "'.$invigilator.'" overlaps '.$other->title.'.', 'assessmentId' => $other->public_id, 'title' => $other->title];
            }
        }

        return $conflicts;
    }

    /**
     * @return array{header:array<string,mixed>,questions:list<array<string,mixed>>,candidates:list<array<string,mixed>>,variants:list<string>}
     */
    public function printPack(Assessment $item, bool $includeAnswers): array
    {
        $item->loadMissing(['schoolClass', 'subject', 'academicSession', 'term', 'questions']);
        $meta = $item->metadata ?? [];
        $delivery = (string) ($meta['delivery'] ?? 'manual');
        $questions = $item->questions->sortBy('position')->values()->map(function ($q) use ($includeAnswers) {
            $row = [
                'number' => (int) $q->position,
                'section' => $q->learning_outcome ?: null,
                'prompt' => $q->prompt,
                'questionType' => $q->question_type,
                'options' => $q->options ?? [],
                'marks' => (float) $q->marks,
            ];
            if ($includeAnswers) {
                $row['correctAnswer'] = $q->correct_answer;
                $row['rationale'] = $q->rationale;
            }

            return $row;
        })->all();

        $candidates = $this->roster($item)->values()->map(fn ($student, int $index) => [
            'number' => $index + 1,
            'id' => $student->public_id,
            'name' => trim($student->first_name.' '.$student->last_name),
            'admissionNumber' => $student->admission_number,
            'scanCode' => 'SM|'.$item->public_id.'|'.($student->admission_number ?: $student->public_id),
            'qrSvg' => QrCodeSvg::dataUri('SM|'.$item->public_id.'|'.($student->admission_number ?: $student->public_id), 96),
        ])->all();

        $omr = $this->omrLayout($item, $includeAnswers);

        return [
            'header' => [
                'assessmentId' => $item->public_id,
                'code' => $meta['code'] ?? null,
                'title' => $item->title,
                'className' => trim(($item->schoolClass->name ?? '').' '.($item->schoolClass->arm ?? '')),
                'subject' => $item->subject?->name,
                'session' => $item->academicSession?->name,
                'term' => $item->term?->name,
                'date' => $item->scheduled_at?->toDateString(),
                'startTime' => $meta['startTime'] ?? ($item->scheduled_at?->format('H:i')),
                'duration' => (int) ($meta['duration'] ?? 60),
                'venue' => $meta['venue'] ?? null,
                'invigilator' => $meta['invigilator'] ?? null,
                'instructions' => $meta['instructions'] ?? null,
                'maximumScore' => (float) $item->maximum_score,
                'delivery' => $delivery,
                'identifier' => 'SKUGGLE-'.$item->public_id,
                'qrSvg' => QrCodeSvg::dataUri('SKUGGLE-'.$item->public_id, 96),
            ],
            'questions' => $questions,
            'candidates' => $candidates,
            'omr' => $omr,
            'variants' => $delivery === 'smartmark'
                ? self::PAPER_VARIANTS
                : array_values(array_filter(self::PAPER_VARIANTS, fn (string $variant) => $variant !== 'omr-sheet' || $omr['itemCount'] > 0)),
        ];
    }

    /**
     * @return array{
     *   enabled: bool,
     *   itemCount: int,
     *   instructions: string,
     *   items: list<array{number:int,choices:list<string>,questionType:string,prompt:string,marks:float}>,
     *   answerKey: list<string>|null
     * }
     */
    public function omrLayout(Assessment $item, bool $includeAnswers = false): array
    {
        $item->loadMissing('questions');
        $items = [];
        $answerKey = [];
        foreach ($item->questions->sortBy('position')->values() as $question) {
            $type = (string) $question->question_type;
            $choices = match ($type) {
                'multiple-choice' => $this->choiceLetters(max(2, min(5, count((array) ($question->options ?? [])) ?: 4))),
                'true-false' => ['T', 'F'],
                default => [],
            };
            if ($choices === []) {
                continue;
            }
            $items[] = [
                'number' => (int) $question->position,
                'choices' => $choices,
                'questionType' => $type,
                'prompt' => (string) $question->prompt,
                'marks' => (float) $question->marks,
            ];
            if ($includeAnswers) {
                $answerKey[] = $this->omrAnswerLetter($question, $choices);
            }
        }

        return [
            'enabled' => $items !== [],
            'itemCount' => count($items),
            'instructions' => 'Use a dark pen or HB pencil. Shade one bubble fully per question. Do not tick or cross. Write the admission number clearly in BLOCK letters. Ambiguous or double marks are flagged for teacher review.',
            'items' => $items,
            'answerKey' => $includeAnswers ? $answerKey : null,
        ];
    }

    /** @return list<string> */
    private function choiceLetters(int $count): array
    {
        return array_map(fn (int $i) => chr(65 + $i), range(0, $count - 1));
    }

    /** @param list<string> $choices */
    private function omrAnswerLetter(object $question, array $choices): string
    {
        $answer = strtoupper(trim((string) $question->correct_answer));
        if ($question->question_type === 'true-false') {
            if (in_array($answer, ['T', 'TRUE', '1', 'YES'], true)) {
                return 'T';
            }
            if (in_array($answer, ['F', 'FALSE', '0', 'NO'], true)) {
                return 'F';
            }
        }
        if (in_array($answer, $choices, true)) {
            return $answer;
        }
        $options = array_values((array) ($question->options ?? []));
        $index = array_search($question->correct_answer, $options, true);
        if ($index === false) {
            $index = array_search($answer, array_map(fn ($option) => strtoupper(trim((string) $option)), $options), true);
        }
        if ($index !== false && isset($choices[(int) $index])) {
            return $choices[(int) $index];
        }

        return '?';
    }

    /**
     * @return array{
     *   summary: array<string, mixed>,
     *   checks: list<array{id:string,label:string,severity:string,status:string,count:int,message:string}>,
     *   unlockImpact: array<string, mixed>,
     *   canModerate: bool,
     *   canLock: bool
     * }
     */
    public function moderationReview(Assessment $item): array
    {
        $roster = $this->roster($item);
        $scores = $item->scores()->get()->keyBy('student_id');
        $max = (float) $item->maximum_score;
        $missing = 0;
        $overMax = 0;
        $absentWithScore = 0;
        $entered = [];
        $absent = 0;
        $exempt = 0;

        foreach ($roster as $student) {
            $score = $scores->get($student->getKey());
            $state = $score->status ?? 'NOT_ENTERED';
            $value = $score?->score;
            if (in_array($state, ['ABSENT'], true)) {
                $absent++;
                if ($value !== null) {
                    $absentWithScore++;
                }

                continue;
            }
            if (in_array($state, ['EXEMPT'], true)) {
                $exempt++;
                if ($value !== null) {
                    $absentWithScore++;
                }

                continue;
            }
            if ($value === null) {
                $missing++;

                continue;
            }
            $numeric = (float) $value;
            if ($numeric < 0 || $numeric > $max) {
                $overMax++;
            }
            $entered[] = $numeric;
        }

        $openSmartmark = SmartmarkBatch::query()
            ->where('assessment_id', $item->getKey())
            ->whereNotIn('state', ['committed'])
            ->count();

        $mean = $entered === [] ? null : array_sum($entered) / count($entered);
        $distributionWarn = false;
        $distributionMessage = 'Score distribution looks within expected bounds.';
        if (count($entered) >= 5 && $mean !== null) {
            $ratio = $max > 0 ? $mean / $max : 0;
            $unique = count(array_unique(array_map(fn ($v) => round($v, 2), $entered)));
            if ($ratio >= 0.9) {
                $distributionWarn = true;
                $distributionMessage = 'Average score is unusually high (≥ 90% of maximum).';
            } elseif ($ratio <= 0.2) {
                $distributionWarn = true;
                $distributionMessage = 'Average score is unusually low (≤ 20% of maximum).';
            } elseif ($unique === 1) {
                $distributionWarn = true;
                $distributionMessage = 'All entered scores are identical.';
            }
        }

        $submittedAt = $item->metadata['submittedAt'] ?? null;
        $adjustmentsAfterSubmit = 0;
        if ($submittedAt) {
            $adjustmentsAfterSubmit = AuditLog::query()
                ->where('action', 'assessment.score_adjusted')
                ->where('resource_type', AssessmentScore::class)
                ->whereIn('resource_id', $scores->pluck('public_id')->filter()->all())
                ->where('occurred_at', '>=', $submittedAt)
                ->count();
        }

        $checks = [
            $this->check('missing_scores', 'Missing scores', $missing, $missing > 0 ? 'block' : 'pass', $missing > 0 ? "{$missing} roster student(s) still need a score, absent or exempt mark." : 'Every roster student has a resolved entry.'),
            $this->check('over_maximum', 'Marks greater than maximum', $overMax, $overMax > 0 ? 'block' : 'pass', $overMax > 0 ? "{$overMax} score(s) exceed the maximum of {$max}." : 'No scores exceed the maximum.'),
            $this->check('absent_with_score', 'Absent/exempt with scores', $absentWithScore, $absentWithScore > 0 ? 'block' : 'pass', $absentWithScore > 0 ? "{$absentWithScore} absent/exempt student(s) still have a numeric score." : 'Absent and exempt entries have no numeric score.'),
            $this->check('smartmark_open', 'Unmatched SmartMark evidence', $openSmartmark, $openSmartmark > 0 ? 'block' : 'pass', $openSmartmark > 0 ? "{$openSmartmark} SmartMark batch(es) still need review/commit." : 'No outstanding SmartMark batches.'),
            $this->check('distribution', 'Unusual score distribution', $distributionWarn ? 1 : 0, $distributionWarn ? 'warn' : 'pass', $distributionMessage),
            $this->check('adjustments_after_review', 'Score adjustments after submission', $adjustmentsAfterSubmit, $adjustmentsAfterSubmit > 0 ? 'warn' : 'pass', $adjustmentsAfterSubmit > 0 ? "{$adjustmentsAfterSubmit} score adjustment(s) recorded after moderation submission." : 'No post-submission score adjustments detected.'),
        ];

        $blocking = collect($checks)->contains(fn ($c) => $c['severity'] === 'block' && $c['status'] === 'fail');

        return [
            'summary' => [
                'roster' => $roster->count(),
                'entered' => count($entered),
                'absent' => $absent,
                'exempt' => $exempt,
                'missing' => $missing,
                'mean' => $mean === null ? null : round($mean, 2),
                'minimum' => $entered === [] ? null : min($entered),
                'maximumEntered' => $entered === [] ? null : max($entered),
                'maximumScore' => $max,
                'status' => $item->status,
                'moderationRequired' => (bool) ((app(TenantContext::class)->tenant()->settings['assessment']['moderationRequired'] ?? true)),
                'moderationStage' => $item->metadata['moderationStage'] ?? ($item->status === 'moderation' ? 'subject_head' : ($item->status === 'under_review' ? 'examination_officer' : null)),
                'multiStageModeration' => (bool) ((app(TenantContext::class)->tenant()->settings['assessment']['multiStageModeration'] ?? true)),
            ],
            'checks' => $checks,
            'unlockImpact' => $this->unlockImpact($item),
            'canModerate' => ! $blocking && in_array($item->status, ['moderation', 'under_review'], true),
            'canSubjectHeadApprove' => ! $blocking && $item->status === 'moderation',
            'canEoApprove' => ! $blocking && $item->status === 'under_review',
            'canLock' => ! $blocking && in_array($item->status, ['validated', 'approved', 'completed', 'marking', 'reopened'], true),
        ];
    }

    /**
     * @return array{performanceExposed:bool,publishedResults:int,lockVersion:int,lockedAt:?string,requiresAcknowledgement:bool,warnings:list<string>}
     */
    public function unlockImpact(Assessment $item): array
    {
        $meta = $item->metadata ?? [];
        $lockVersion = (int) ($meta['lockVersion'] ?? 0);
        $lockedAt = $meta['lockedAt'] ?? ($item->status === 'locked' ? now()->toIso8601String() : null);
        $publishedResults = 0;
        $rosterIds = $this->roster($item)->pluck('id');
        if ($rosterIds->isNotEmpty()) {
            $publishedResults = ResultPublication::query()
                ->where('academic_session_id', $item->academic_session_id)
                ->where('term_id', $item->term_id)
                ->whereIn('student_id', $rosterIds)
                ->whereIn('status', ['published', 'locked'])
                ->count();
        }
        $performanceExposed = $lockVersion > 0 || $item->status === 'locked';
        $warnings = [];
        if ($performanceExposed) {
            $warnings[] = 'Performance analytics already consume locked scores for this assessment. Unlocking will remove them from Performance until scores are locked again.';
        }
        if ($publishedResults > 0) {
            $warnings[] = "{$publishedResults} published/locked result sheet(s) cover students on this roster for the same session and term. Downstream results may need regeneration after corrections.";
        }
        if ($warnings === []) {
            $warnings[] = 'No published results detected for this roster/session/term. Unlocking still requires an audited reason.';
        }

        return [
            'performanceExposed' => $performanceExposed,
            'publishedResults' => $publishedResults,
            'lockVersion' => $lockVersion,
            'lockedAt' => $lockedAt,
            'requiresAcknowledgement' => $performanceExposed || $publishedResults > 0,
            'warnings' => $warnings,
        ];
    }

    /**
     * @return list<array{id:string,label:string,severity:string,status:string,count:int,message:string}>
     */
    public function blockingModerationFailures(Assessment $item): array
    {
        return array_values(array_filter(
            $this->moderationReview($item)['checks'],
            fn (array $check) => $check['severity'] === 'block' && $check['status'] === 'fail'
        ));
    }

    /**
     * @return array{id:string,label:string,severity:string,status:string,count:int,message:string}
     */
    private function check(string $id, string $label, int $count, string $severity, string $message): array
    {
        $status = $severity === 'pass' ? 'pass' : ($severity === 'warn' ? 'warn' : 'fail');

        return [
            'id' => $id,
            'label' => $label,
            'severity' => $severity === 'pass' ? 'pass' : $severity,
            'status' => $status,
            'count' => $count,
            'message' => $message,
        ];
    }

    public function save(Assessment $item, array $data, int $actor): string
    {
        return DB::transaction(function () use ($item, $data, $actor): string {
            $item = Assessment::query()->whereKey($item->getKey())->lockForUpdate()->firstOrFail();
            abort_unless(app(AssessmentAccess::class)->resource($item) && app(AssessmentAccess::class)->allows('assessment.score.enter'), 403);
            abort_unless(in_array($item->status, self::EDITABLE, true), 409, 'This assessment is read-only. Reopen it before changing scores.');
            if (! hash_equals($this->revision($item), $data['revision'])) {
                throw new ApiException('REVISION_CONFLICT', 'Scores changed. Reload and review your unsaved entries before saving.', 409);
            }
            $roster = $this->roster($item)->keyBy('public_id');
            foreach ($data['scores'] as $publicId => $value) {
                $student = $roster->get($publicId);
                abort_unless($student, 422, 'A student is outside this assessment roster.');
                $state = $data['states'][$publicId] ?? ($value === null ? 'NOT_ENTERED' : 'ENTERED');
                abort_if($value !== null && ($value < 0 || $value > $item->maximum_score), 422, 'Score exceeds the assessment maximum.');
                abort_if(in_array($state, ['ABSENT', 'EXEMPT', 'NOT_ENTERED'], true) && $value !== null, 422, 'Missing, absent and exempt entries cannot have a score.');
                abort_if($state === 'ENTERED' && $value === null, 422, 'Entered scores require a numeric value.');
                $score = AssessmentScore::query()->firstOrNew(['assessment_id' => $item->getKey(), 'student_id' => $student->getKey()]);
                $before = $score->only(['score', 'status', 'metadata']);
                $score->fill(['score' => $value, 'status' => $state, 'graded_by' => $actor, 'graded_at' => now(), 'revision' => ($score->revision ?? 0) + 1,
                    'metadata' => array_merge($score->metadata ?? [], ['comment' => $data['comments'][$publicId] ?? $score->metadata['comment'] ?? ''])])->save();
                app(AuditLogger::class)->record('assessment.score_adjusted', $score, $before, $score->only(['score', 'status', 'metadata']));
            }
            $item->increment('revision');

            return $this->revision($item->fresh());
        });
    }
}
