<?php

namespace App\Services;

use App\Domain\Assessments\SmartmarkConfidenceBand;

final class SmartmarkScoringService
{
    /**
     * @param  array<array-key, string>  $answers
     * @param  array<array-key, string>  $answerKey
     * @return array{detected_score:float,confidence:float,band:SmartmarkConfidenceBand,human_review_required:bool,flag_reason:?string,ambiguous_count:int,correct:int}
     */
    public function evaluate(array $answers, array $answerKey, int $maxScore, float $ocrConfidence, ?string $ocrFlagReason = null, bool $matched = true): array
    {
        $key = array_values(array_map(fn ($a) => strtoupper(trim((string) $a)), $answerKey));
        $responses = array_values(array_map(fn ($a) => strtoupper(trim((string) $a)), $answers));
        $correct = 0;
        $ambiguous = 0;
        foreach ($key as $i => $expected) {
            $given = $responses[$i] ?? '';
            if ($given === '' || $given === '?' || $given === '*') {
                $ambiguous++;

                continue;
            }
            if ($given === $expected) {
                $correct++;
            }
        }
        $score = count($key) > 0 ? round(($correct / count($key)) * $maxScore, 2) : 0.0;
        $confidence = max(0.0, min(100.0, $ocrConfidence));
        if ($ambiguous > 0) {
            $confidence = min($confidence, 45.0);
        }

        $band = $this->band($confidence, $ambiguous > 0, $matched);
        $reasons = array_values(array_filter([
            $matched ? null : 'Student could not be matched to the assessment roster.',
            $ambiguous > 0 ? "{$ambiguous} ambiguous or blank response(s)." : null,
            $ocrFlagReason ?: null,
            $band === SmartmarkConfidenceBand::Medium ? 'Medium OCR confidence requires verification.' : null,
            $band === SmartmarkConfidenceBand::Low ? 'Low OCR confidence requires verification.' : null,
        ]));

        return [
            'detected_score' => $score,
            'confidence' => $confidence,
            'band' => $band,
            'human_review_required' => $band->requiresHumanReview(),
            'flag_reason' => $reasons === [] ? null : implode(' ', $reasons),
            'ambiguous_count' => $ambiguous,
            'correct' => $correct,
        ];
    }

    public function band(float $confidence, bool $unreadableMarks, bool $matched): SmartmarkConfidenceBand
    {
        if (! $matched) {
            return SmartmarkConfidenceBand::Unmatched;
        }
        if ($unreadableMarks || $confidence < (float) config('skuggle.ocr.low_threshold', 50)) {
            return SmartmarkConfidenceBand::Unreadable;
        }
        $high = (float) config('skuggle.ocr.review_threshold', 92);
        $medium = (float) config('skuggle.ocr.medium_threshold', 75);
        if ($confidence >= $high) {
            return SmartmarkConfidenceBand::High;
        }
        if ($confidence >= $medium) {
            return SmartmarkConfidenceBand::Medium;
        }

        return SmartmarkConfidenceBand::Low;
    }
}
