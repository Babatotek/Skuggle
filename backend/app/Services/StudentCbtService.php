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
    private const AUTO_MARKABLE = ['multiple-choice', 'true-false'];

    private const ATTEMPTABLE = ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank', 'calculation'];

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
            ->where('metadata->delivery', 'cbt')
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
            ->where('metadata->delivery', 'cbt')
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
        $duration = max(1, (int) ($item->metadata['duration'] ?? 60));
        $from = $item->scheduled_at;
        $until = $from?->copy()->addMinutes($duration);

        return [
            'availableFrom' => $from?->toIso8601String(),
            'availableUntil' => $until?->toIso8601String(),
            'durationMinutes' => $duration,
            'open' => $from && $until && now()->greaterThanOrEqualTo($from) && now()->lessThanOrEqualTo($until),
            'upcoming' => $from && now()->lt($from),
            'closed' => $until && now()->gt($until),
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
        if (! ($window['open'] ?? false)) {
            throw new ApiException('CBT_WINDOW_CLOSED', $window['upcoming'] ? 'This CBT assessment has not started yet.' : 'The CBT availability window has closed.', 422);
        }
        if ($this->submitted($item, $student)) {
            throw new ApiException('CBT_ALREADY_SUBMITTED', 'You have already submitted this CBT assessment.', 409);
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
        abort_if($submission->exists && $submission->status === 'submitted', 409, 'You have already submitted this CBT assessment.');
        $submission->fill([
            'answers' => $answers,
            'status' => 'in_progress',
            'started_at' => $submission->started_at ?? now(),
            'revision' => ($submission->revision ?? 0) + 1,
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
                if (is_string($given) && $given !== '' && hash_equals((string) $question->correct_answer, $given)) {
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
            abort_if($submission->exists && $submission->status === 'submitted', 409, 'You have already submitted this CBT assessment.');
            $submission->fill([
                'answers' => $answers,
                'status' => 'submitted',
                'started_at' => $submission->started_at ?? now(),
                'submitted_at' => now(),
                'revision' => ($submission->revision ?? 0) + 1,
            ])->save();

            $score = AssessmentScore::query()->firstOrNew([
                'assessment_id' => $item->getKey(),
                'student_id' => $student->getKey(),
            ]);
            $before = $score->only(['score', 'status', 'metadata']);
            $score->fill([
                'score' => $needsMarking ? null : $earned,
                'status' => $needsMarking ? 'SUBMITTED' : 'ENTERED',
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
                ]),
            ])->save();
            app(AuditLogger::class)->record('assessment.cbt_submitted', $score, $before, $score->only(['score', 'status', 'metadata']));
            $item->increment('revision');

            return [
                'score' => $needsMarking ? $earned : $earned,
                'maxScore' => (float) $item->maximum_score,
                'percentage' => (int) round(($item->maximum_score > 0 ? $earned / (float) $item->maximum_score : 0) * 100),
                'submissionId' => $submission->public_id,
                'autoMarked' => ! $needsMarking,
                'needsMarking' => $needsMarking,
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
            'canAttempt' => ! $submitted && $item->status === 'active' && ($window['open'] ?? false),
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
        $questions = $item->questions->sortBy('position')->values()->map(fn ($q) => [
            'id' => $q->public_id,
            'number' => (int) $q->position,
            'prompt' => $q->prompt,
            'questionType' => $q->question_type,
            'options' => $q->options ?? [],
            'marks' => (float) $q->marks,
            'section' => $q->learning_outcome ?: null,
            'autoMarkable' => in_array($q->question_type, self::AUTO_MARKABLE, true),
        ])->all();

        return [
            'id' => $item->public_id,
            'title' => $item->title,
            'className' => trim(($item->schoolClass->name ?? '').' '.($item->schoolClass->arm ?? '')),
            'subject' => $item->subject?->name,
            'status' => $item->status,
            'maxScore' => (float) $item->maximum_score,
            'instructions' => $item->metadata['instructions'] ?? null,
            'availableFrom' => $window['availableFrom'],
            'availableUntil' => $window['availableUntil'],
            'durationMinutes' => $window['durationMinutes'],
            'submitted' => $this->submitted($item, $student),
            'canAttempt' => ! $this->submitted($item, $student) && $item->status === 'active' && ($window['open'] ?? false),
            'answers' => $draft && $draft->status !== 'submitted' ? ($draft->answers ?? []) : [],
            'attemptStatus' => $draft?->status,
            'startedAt' => $draft?->started_at?->toIso8601String(),
            'questions' => $questions,
        ];
    }

    private function assertSupportedQuestions(Assessment $item): void
    {
        $unsupported = $item->questions->first(fn ($q) => ! in_array($q->question_type, self::ATTEMPTABLE, true));
        abort_if($unsupported !== null, 422, 'This CBT paper includes unsupported question types for the student player.');
    }
}
