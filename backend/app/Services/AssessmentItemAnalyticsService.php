<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\AssessmentSubmission;

final class AssessmentItemAnalyticsService
{
    /**
     * @return array{
     *   assessmentId:string,
     *   attemptCount:int,
     *   items:list<array{questionId:string,number:int,prompt:string,questionType:string,attempts:int,answered:int,correct:int,facility:float|null,omitRate:float|null}>
     * }
     */
    public function analyse(Assessment $assessment): array
    {
        $assessment->loadMissing('questions');
        $submissions = AssessmentSubmission::query()
            ->where('assessment_id', $assessment->getKey())
            ->where('status', 'submitted')
            ->get();
        $attemptCount = $submissions->count();
        $items = $assessment->questions->sortBy('position')->values()->map(function ($question) use ($submissions, $attemptCount) {
            $answered = 0;
            $correct = 0;
            foreach ($submissions as $submission) {
                $given = $submission->answers[$question->public_id] ?? null;
                if (! is_string($given) || trim($given) === '') {
                    continue;
                }
                $answered++;
                if (in_array($question->question_type, ['multiple-choice', 'true-false'], true)
                    && hash_equals((string) $question->correct_answer, $given)) {
                    $correct++;
                }
            }
            $facility = $answered > 0 && in_array($question->question_type, ['multiple-choice', 'true-false'], true)
                ? round($correct / $answered, 3)
                : null;

            return [
                'questionId' => $question->public_id,
                'number' => (int) $question->position,
                'prompt' => $question->prompt,
                'questionType' => $question->question_type,
                'attempts' => $attemptCount,
                'answered' => $answered,
                'correct' => $correct,
                'facility' => $facility,
                'omitRate' => $attemptCount > 0 ? round(($attemptCount - $answered) / $attemptCount, 3) : null,
            ];
        })->all();

        return [
            'assessmentId' => $assessment->public_id,
            'attemptCount' => $attemptCount,
            'items' => $items,
        ];
    }
}
