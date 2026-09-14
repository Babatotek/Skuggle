<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Assessment;
use App\Models\AssessmentScore;
use App\Models\AssessmentSubmission;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class StudentCbtService
{
    private const AUTO_MARKABLE = ['multiple-choice', 'true-false', 'multiple-response', 'matching'];

    private const ATTEMPTABLE = ['multiple-choice', 'true-false', 'multiple-response', 'fill-blank', 'short-answer', 'essay', 'calculation', 'matching'];

    public function __construct(private AssessmentWorkflow $workflow) {}

    public function studentFor(User $user): Student
    {
        $student = Student::query()->where('user_id', $user->getKey())->where('status', 'active')->first();
        if (! $student) {
            throw new ApiException('STUDENT_PROFILE_REQUIRED', 'A linked student profile is required to take CBT assessments.', 403);
        }

        return $student;
    }

    /** @return Collection<int, Assessment> */
    public function eligible(Student $student): Collection
    {
        return Assessment::query()
            ->with(['schoolClass', 'subject'])
            ->withCount(['scores as marked_count' => fn ($q) => $q->where(function ($q) {
                $q->whereNotNull('score')->orWhereIn('status', ['ABSENT', 'EXEMPT']);
            })])
            ->where(function ($q) {
                $q->where('metadata->delivery', 'cbt')->orWhere('delivery', 'cbt');
            })
            ->whereIn('status', ['scheduled', 'active', 'completed', 'marking', 'moderation', 'validated', 'locked'])
            ->orderByDesc('scheduled_at')
            ->get()
            ->filter(fn (Assessment $item) => $this->onRoster($item, $student))
            ->values();
    }

    public function resolve(string $publicId, Student $student, bool $forAttempt = false): Assessment
    {
        $item = Assessment::query()
            ->with(['schoolClass', 'subject', 'questions'])
            ->where('public_id', $publicId)
            ->where(function ($q) {
                $q->where('metadata->delivery', 'cbt')->orWhere('delivery', 'cbt');
            })
            ->firstOrFail();
        abort_unless($this->onRoster($item, $student), 404);
        if ($forAttempt) {
            $this->assertCanAttempt($item, $student);
        }

        return $item;
    }

    public function onRoster(Assessment $item, Student $student): bool
    {
        return $this->workflow->roster($item)->contains(fn ($member) => (int) $member->getKey() === (int) $student->getKey());
    }

    public function window(Assessment $item): array
    {
        $duration = max(1, (int) ($item->duration_minutes ?: ($item->metadata['duration'] ?? 60)));
        $from = $item->starts_at ?: $item->scheduled_at;
        $until = $item->ends_at ?: ($from?->copy()->addMinutes($duration));

        return [
            'availableFrom' => $from?->toIso8601String(),
            'availableUntil' => $until?->toIso8601String(),
            'durationMinutes' => $duration,
            'open' => $from && $until && now()->greaterThanOrEqualTo($from) && now()->lessThanOrEqualTo($until),
            'upcoming' => $from && now()->lt($from),
            'closed' => $until && now()->gt($until),
            'latePolicy' => $item->late_policy ?: ($item->metadata['latePolicy'] ?? 'reject'),
        ];
    }

    public function draft(Assessment $item, Student $student): ?AssessmentSubmission
    {
        return AssessmentSubmission::query()
            ->where('assessment_id', $item->getKey())
            ->where('student_id', $student->getKey())
            ->first();
    }

    public function assertCanAttempt(Assessment $item, Student $student): void
    {
        abort_unless(in_array($item->status, ['active'], true), 422, 'This CBT assessment is not open for attempts yet.');
        $window = $this->window($item);
        $lateOk = ($window['latePolicy'] ?? 'reject') === 'allow';
        if (! ($window['open'] ?? false) && ! ($lateOk && ($window['closed'] ?? false))) {
            throw new ApiException('CBT_WINDOW_CLOSED', $window['upcoming'] ? 'This CBT assessment has not started yet.' : 'The CBT availability window has closed.', 422);
        }
        $draft = $this->draft($item, $student);
        $limit = max(1, (int) ($item->attempt_limit ?: ($item->metadata['attemptLimit'] ?? 1)));
        $resume = $item->resume_policy ?: ($item->metadata['resumePolicy'] ?? 'allow');
        if ($draft && $draft->status === 'submitted' && (int) $draft->attempt_number >= $limit) {
            throw new ApiException('CBT_ALREADY_SUBMITTED', 'You have already submitted this CBT assessment.', 409);
        }
        if ($draft && $draft->status === 'in_progress' && $resume === 'deny') {
            throw new ApiException('CBT_RESUME_DENIED', 'Resume is not allowed for this assessment.', 409);
        }
    }

    public function submitted(Assessment $item, Student $student): bool
    {
        return AssessmentSubmission::query()
            ->where('assessment_id', $item->getKey())
            ->where('student_id', $student->getKey())
            ->where('status', 'submitted')
            ->exists();
    }

    /**
     * @param  array<string, string>  $answers
     * @return array{answers:array<string,string>,startedAt:?string,revision:int,status:string}
     */
    public function saveDraft(Assessment $item, Student $student, array $answers): array
    {
        $this->assertCanAttempt($item, $student);
        $this->assertSupportedQuestions($item);
        $submission = AssessmentSubmission::query()->firstOrNew([
            'assessment_id' => $item->getKey(),
            'student_id' => $student->getKey(),
        ]);
        $limit = max(1, (int) ($item->attempt_limit ?: 1));
        if ($submission->exists && $submission->status === 'submitted') {
            abort_unless((int) $submission->attempt_number < $limit, 409, 'You have already submitted this CBT assessment.');
            $submission->attempt_number = (int) $submission->attempt_number + 1;
        }
        $shuffle = $submission->shuffle_map;
        if (! is_array($shuffle) || $shuffle === []) {
            $shuffle = $this->buildShuffleMap($item, $student);
        }
        $submission->fill([
            'answers' => $answers,
            'status' => 'in_progress',
            'started_at' => $submission->started_at ?? now(),
            'revision' => ($submission->revision ?? 0) + 1,
            'shuffle_map' => $shuffle,
        ])->save();

        return [
            'answers' => $submission->answers ?? [],
            'startedAt' => $submission->started_at?->toIso8601String(),
            'revision' => (int) $submission->revision,
            'status' => $submission->status,
        ];
    }

    /**
     * @param  array<string, string>  $answers
     * @return array{score:float,maxScore:float,percentage:int,submissionId:string,autoMarked:bool,needsMarking:bool}
     */
    public function submit(Assessment $item, Student $student, array $answers, int $actorId): array
    {
        $this->assertCanAttempt($item, $student);
        $this->assertSupportedQuestions($item);
        $questions = $item->questions->sortBy('position')->values();
        abort_if($questions->isEmpty(), 422, 'This CBT assessment has no questions.');

        $earned = 0.0;
        $autoMax = 0.0;
        $needsMarking = false;
        foreach ($questions as $question) {
            $marks = (float) $question->marks;
            $given = $answers[$question->public_id] ?? null;
            if (in_array($question->question_type, self::AUTO_MARKABLE, true)) {
                $autoMax += $marks;
                if ($this->answersMatch($question, $given)) {
                    $earned += $marks;
                }
            } else {
                $needsMarking = true;
            }
        }
        $earned = round(min($earned, (float) $item->maximum_score), 2);

        return DB::transaction(function () use ($item, $student, $answers, $actorId, $earned, $autoMax, $needsMarking) {
            $submission = AssessmentSubmission::query()->firstOrNew([
                'assessment_id' => $item->getKey(),
                'student_id' => $student->getKey(),
            ]);
            $limit = max(1, (int) ($item->attempt_limit ?: 1));
            if ($submission->exists && $submission->status === 'submitted') {
                abort_unless((int) $submission->attempt_number < $limit, 409, 'You have already submitted this CBT assessment.');
                $submission->attempt_number = (int) $submission->attempt_number + 1;
            }
            $fingerprint = app(AssessmentCompleteService::class)->fingerprint($answers);
            $duplicate = AssessmentSubmission::query()
                ->where('assessment_id', $item->getKey())
                ->where('status', 'submitted')
                ->where('answer_fingerprint', $fingerprint)
                ->where('student_id', '!=', $student->getKey())
                ->exists();
            $started = $submission->started_at ?? now();
            $submission->fill([
                'answers' => $answers,
                'status' => 'submitted',
                'started_at' => $started,
                'submitted_at' => now(),
                'revision' => ($submission->revision ?? 0) + 1,
                'answer_fingerprint' => $fingerprint,
                'time_spent_seconds' => max(0, $started->diffInSeconds(now())),
            ])->save();

            $score = AssessmentScore::query()->firstOrNew([
                'assessment_id' => $item->getKey(),
                'student_id' => $student->getKey(),
            ]);
            $before = $score->only(['score', 'status', 'metadata']);
            $score->fill([
                'score' => $needsMarking ? null : $earned,
                'status' => $needsMarking ? 'REVIEW_REQUIRED' : 'AUTO_MARKED',
                'graded_by' => $needsMarking ? null : $actorId,
                'graded_at' => $needsMarking ? null : now(),
                'submitted_at' => now(),
                'revision' => ($score->revision ?? 0) + 1,
                'metadata' => array_merge($score->metadata ?? [], [
                    'source' => 'cbt',
                    'autoScore' => $earned,
                    'maxAutoScore' => $autoMax,
                    'needsMarking' => $needsMarking,
                    'submissionId' => $submission->public_id,
                    'duplicateResponse' => $duplicate,
                ]),
            ])->save();
            app(AuditLogger::class)->record('assessment.cbt_submitted', $score, $before, $score->only(['score', 'status', 'metadata']));
            $item->increment('revision');
            app(AssessmentNotifier::class)->cbtSubmitted($item);
            $feedback = $item->feedback_policy ?: ($item->metadata['feedbackPolicy'] ?? 'score');
            $hideScore = $feedback === 'none';

            return [
                'score' => $hideScore ? 0 : ($needsMarking ? $earned : $earned),
                'maxScore' => (float) $item->maximum_score,
                'percentage' => $hideScore ? 0 : (int) round(($item->maximum_score > 0 ? $earned / (float) $item->maximum_score : 0) * 100),
                'submissionId' => $submission->public_id,
                'autoMarked' => ! $needsMarking,
                'needsMarking' => $needsMarking,
                'feedbackPolicy' => $feedback,
                'scoreVisible' => ! $hideScore,
                'duplicateResponse' => $duplicate,
            ];
        });
    }

    public function presentListItem(Assessment $item, Student $student): array
    {
        $window = $this->window($item);
        $submitted = $this->submitted($item, $student);
        $draft = $this->draft($item, $student);

        return [
            'id' => $item->public_id,
            'title' => $item->title,
            'className' => trim(($item->schoolClass->name ?? '').' '.($item->schoolClass->arm ?? '')),
            'subject' => $item->subject?->name,
            'status' => $item->status,
            'maxScore' => (float) $item->maximum_score,
            'questionCount' => $item->questions()->count(),
            'submitted' => $submitted,
            'inProgress' => ! $submitted && $draft && $draft->status === 'in_progress',
            'canAttempt' => $this->playerCanAttempt($item, $student, $window, $draft),
            'availableFrom' => $window['availableFrom'],
            'availableUntil' => $window['availableUntil'],
            'durationMinutes' => $window['durationMinutes'],
            'windowState' => $window['open'] ? 'open' : ($window['upcoming'] ? 'upcoming' : ($window['closed'] ? 'closed' : 'unscheduled')),
        ];
    }

    public function presentPlayer(Assessment $item, Student $student): array
    {
        $window = $this->window($item);
        $draft = $this->draft($item, $student);
        $shuffle = is_array($draft?->shuffle_map) ? $draft->shuffle_map : $this->buildShuffleMap($item, $student);
        $order = $shuffle['questions'] ?? $item->questions->sortBy('position')->pluck('public_id')->all();
        $byId = $item->questions->keyBy('public_id');
        $questions = [];
        foreach (array_values($order) as $index => $qid) {
            $q = $byId->get($qid);
            if (! $q) {
                continue;
            }
            $options = $q->options ?? [];
            if (($q->question_type === 'matching') && isset($options['left'], $options['right'])) {
                $presented = $options;
                if ($item->random_options || ($item->metadata['randomOptions'] ?? false)) {
                    $right = $options['right'];
                    $seed = crc32($student->public_id.$q->public_id);
                    mt_srand($seed);
                    shuffle($right);
                    mt_srand();
                    $presented = array_merge($options, ['right' => array_values($right)]);
                }
                $options = $presented;
            } elseif (is_array($options) && array_is_list($options) && ($item->random_options || ($item->metadata['randomOptions'] ?? false))) {
                $options = $shuffle['options'][$qid] ?? $options;
            }
            $questions[] = [
                'id' => $q->public_id,
                'number' => $index + 1,
                'prompt' => $q->prompt,
                'questionType' => $q->question_type,
                'options' => $options,
                'marks' => (float) $q->marks,
                'section' => $q->learning_outcome ?: null,
                'imageUrl' => $q->image_key ? '/api/v1/assessment-questions/'.$q->public_id.'/media' : null,
                'autoMarkable' => in_array($q->question_type, self::AUTO_MARKABLE, true),
            ];
        }

        return [
            'id' => $item->public_id,
            'title' => $item->title,
            'className' => trim(($item->schoolClass->name ?? '').' '.($item->schoolClass->arm ?? '')),
            'subject' => $item->subject?->name,
            'status' => $item->status,
            'maxScore' => (float) $item->maximum_score,
            'instructions' => $item->instructions ?? ($item->metadata['instructions'] ?? null),
            'availableFrom' => $window['availableFrom'],
            'availableUntil' => $window['availableUntil'],
            'durationMinutes' => $window['durationMinutes'],
            'submitted' => $this->submitted($item, $student) && (int) ($draft?->attempt_number ?? 1) >= max(1, (int) ($item->attempt_limit ?: 1)),
            'canAttempt' => $this->playerCanAttempt($item, $student, $window, $draft),
            'answers' => $draft && $draft->status !== 'submitted' ? ($draft->answers ?? []) : [],
            'attemptStatus' => $draft?->status,
            'startedAt' => $draft?->started_at?->toIso8601String(),
            'questions' => $questions,
            'navigationRestricted' => (bool) ($item->navigation_restricted ?: ($item->metadata['navigationRestricted'] ?? false)),
            'feedbackPolicy' => $item->feedback_policy ?: ($item->metadata['feedbackPolicy'] ?? 'score'),
            'attemptLimit' => max(1, (int) ($item->attempt_limit ?: 1)),
            'attemptNumber' => (int) ($draft?->attempt_number ?? 1),
        ];
    }

    private function playerCanAttempt(Assessment $item, Student $student, array $window, ?AssessmentSubmission $draft): bool
    {
        if ($item->status !== 'active') {
            return false;
        }
        $limit = max(1, (int) ($item->attempt_limit ?: 1));
        if ($draft && $draft->status === 'submitted' && (int) $draft->attempt_number >= $limit) {
            return false;
        }
        $lateOk = ($window['latePolicy'] ?? 'reject') === 'allow';

        return ($window['open'] ?? false) || ($lateOk && ($window['closed'] ?? false));
    }

    /** @return array{questions:list<string>,options:array<string,list<string>>} */
    private function buildShuffleMap(Assessment $item, Student $student): array
    {
        $ids = $item->questions->sortBy('position')->pluck('public_id')->values()->all();
        if ($item->random_questions || ($item->metadata['randomQuestions'] ?? false)) {
            mt_srand(crc32($item->public_id.$student->public_id));
            shuffle($ids);
            mt_srand();
        }
        $options = [];
        if ($item->random_options || ($item->metadata['randomOptions'] ?? false)) {
            foreach ($item->questions as $question) {
                $opts = $question->options ?? [];
                if (is_array($opts) && array_is_list($opts)) {
                    mt_srand(crc32($student->public_id.$question->public_id));
                    shuffle($opts);
                    mt_srand();
                    $options[$question->public_id] = array_values($opts);
                }
            }
        }

        return ['questions' => array_values($ids), 'options' => $options];
    }

    private function answersMatch($question, mixed $given): bool
    {
        if (! is_string($given) || trim($given) === '') {
            return false;
        }
        $expected = (string) $question->correct_answer;
        $type = (string) $question->question_type;
        if ($type === 'multiple-response') {
            $want = $this->normalizeList($expected);
            $got = $this->normalizeList($given);

            return $want !== [] && $want === $got;
        }
        if ($type === 'matching') {
            return $this->normalizeList($expected) === $this->normalizeList($given);
        }

        return hash_equals(trim($expected), trim($given));
    }

    /** @return list<string> */
    private function normalizeList(string $value): array
    {
        $decoded = json_decode($value, true);
        if (is_array($decoded)) {
            $items = array_map(fn ($row) => is_array($row) ? strtolower(trim(implode('=', $row))) : strtolower(trim((string) $row)), $decoded);
        } else {
            $items = array_map(fn ($row) => strtolower(trim($row)), preg_split('/[\n,]+/', $value) ?: []);
        }
        $items = array_values(array_filter($items));
        sort($items);

        return $items;
    }

    private function assertSupportedQuestions(Assessment $item): void
    {
        $unsupported = $item->questions->first(fn ($q) => ! in_array($q->question_type, self::ATTEMPTABLE, true));
        abort_if($unsupported !== null, 422, 'This CBT paper includes unsupported question types for the student player.');
    }
}
