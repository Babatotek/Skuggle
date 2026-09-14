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
     *   scoreDistribution:array<string,int>,
     *   items:list<array<string,mixed>>
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
        $scores = $assessment->scores()->whereNotNull('score')->pluck('score')->map(fn ($s) => (float) $s)->all();
        $distribution = ['0-24' => 0, '25-49' => 0, '50-74' => 0, '75-100' => 0];
        $max = max(1, (float) $assessment->maximum_score);
        foreach ($scores as $score) {
            $pct = ($score / $max) * 100;
            $bucket = $pct < 25 ? '0-24' : ($pct < 50 ? '25-49' : ($pct < 75 ? '50-74' : '75-100'));
            $distribution[$bucket]++;
        }
        $totals = [];
        $submissionTotals = $submissions->map(function ($submission) use ($assessment) {
            $score = 0;
            foreach ($assessment->questions as $question) {
                $given = $submission->answers[$question->public_id] ?? null;
                if (! is_string($given) || trim($given) === '') {
                    continue;
                }
                if (in_array($question->question_type, ['multiple-choice', 'true-false'], true)
                    && hash_equals((string) $question->correct_answer, $given)) {
                    $score += (float) $question->marks;
                }
            }

            return $score;
        })->all();
        foreach ($assessment->questions->sortBy('position')->values() as $question) {
            $answered = 0;
            $correct = 0;
            $times = [];
            $distractors = [];
            $vector = [];
            foreach ($submissions as $submission) {
                $given = $submission->answers[$question->public_id] ?? null;
                $seconds = (int) ($submission->time_spent_seconds ?? 0);
                if ($seconds > 0) {
                    $times[] = $seconds / max(1, $assessment->questions->count());
                }
                if (! is_string($given) || trim($given) === '') {
                    $vector[] = 0;

                    continue;
                }
                $answered++;
                $label = $given;
                $distractors[$label] = ($distractors[$label] ?? 0) + 1;
                $isCorrect = in_array($question->question_type, ['multiple-choice', 'true-false'], true)
                    && hash_equals((string) $question->correct_answer, $given);
                if ($isCorrect) {
                    $correct++;
                    $vector[] = 1;
                } else {
                    $vector[] = 0;
                }
            }
            $facility = $answered > 0 && in_array($question->question_type, ['multiple-choice', 'true-false', 'multiple-response', 'matching'], true)
                ? round($correct / $answered, 3)
                : null;
            $totals[] = [
                'questionId' => $question->public_id,
                'number' => (int) $question->position,
                'prompt' => $question->prompt,
                'questionType' => $question->question_type,
                'attempts' => $attemptCount,
                'answered' => $answered,
                'correct' => $correct,
                'facility' => $facility,
                'omitRate' => $attemptCount > 0 ? round(($attemptCount - $answered) / $attemptCount, 3) : null,
                'skippedRate' => $attemptCount > 0 ? round(($attemptCount - $answered) / $attemptCount, 3) : null,
                'averageTime' => $times === [] ? null : (int) round(array_sum($times) / count($times)),
                'discrimination' => $this->discrimination($vector, $submissionTotals),
                'distractors' => $distractors,
            ];
        }

        return [
            'assessmentId' => $assessment->public_id,
            'attemptCount' => $attemptCount,
            'scoreDistribution' => $distribution,
            'items' => $totals,
        ];
    }

    /** @param list<int> $itemHits @param list<float|int> $totals */
    private function discrimination(array $itemHits, array $totals): ?float
    {
        $n = count($itemHits);
        if ($n < 4) {
            return null;
        }
        $pairs = [];
        foreach ($itemHits as $i => $hit) {
            $pairs[] = ['hit' => $hit, 'total' => $totals[$i] ?? 0];
        }
        usort($pairs, fn ($a, $b) => $b['total'] <=> $a['total']);
        $cut = max(1, (int) floor($n * 0.27));
        $high = array_slice($pairs, 0, $cut);
        $low = array_slice($pairs, -$cut);
        $highRate = array_sum(array_column($high, 'hit')) / count($high);
        $lowRate = array_sum(array_column($low, 'hit')) / count($low);

        return round($highRate - $lowRate, 3);
    }
}
