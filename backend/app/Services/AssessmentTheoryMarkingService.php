<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Assessment;
use App\Models\AssessmentScore;
use App\Models\AssessmentSubmission;
use App\Models\Student;
use Illuminate\Support\Facades\Http;

final class AssessmentTheoryMarkingService
{
    /**
     * @return array{suggestedScore:float,feedback:string,confidence:float,rubricBreakdown:list<array{criterion:string,score:float,max:float}>}
     */
    public function suggest(Assessment $assessment, Student $student): array
    {
        $submission = AssessmentSubmission::query()
            ->where('assessment_id', $assessment->getKey())
            ->where('student_id', $student->getKey())
            ->where('status', 'submitted')
            ->first();
        abort_unless($submission, 422, 'No submitted attempt found for theory suggestion.');
        $assessment->loadMissing('questions');
        $theory = $assessment->questions->filter(fn ($q) => in_array($q->question_type, ['short-answer', 'essay', 'fill-blank', 'calculation'], true))->values();
        abort_if($theory->isEmpty(), 422, 'This assessment has no theory questions to suggest marks for.');

        $provider = (string) config('skuggle.ocr.provider');
        if ($provider === 'fake' || (string) config('skuggle.ai.gemini.key') === '') {
            return $this->fakeSuggestion($assessment, $theory, $submission->answers ?? []);
        }

        return $this->geminiSuggestion($assessment, $theory, $submission->answers ?? []);
    }

    /**
     * @param  Collection|iterable  $theory
     * @param  array<string, mixed>  $answers
     */
    private function fakeSuggestion(Assessment $assessment, $theory, array $answers): array
    {
        $breakdown = [];
        $total = 0.0;
        $max = 0.0;
        foreach ($theory as $question) {
            $max += (float) $question->marks;
            $given = trim((string) ($answers[$question->public_id] ?? ''));
            $score = $given === '' ? 0.0 : round(((float) $question->marks) * min(1, max(0.35, strlen($given) / 120)), 2);
            $total += $score;
            $breakdown[] = [
                'criterion' => 'Q'.$question->position.' response completeness',
                'score' => $score,
                'max' => (float) $question->marks,
            ];
        }

        return [
            'suggestedScore' => round(min($total, (float) $assessment->maximum_score), 2),
            'feedback' => 'Provisional AI suggestion based on response length/completeness. Teacher verification is required before locking.',
            'confidence' => 0.55,
            'rubricBreakdown' => $breakdown,
        ];
    }

    /** @param iterable $theory @param array<string, mixed> $answers */
    private function geminiSuggestion(Assessment $assessment, $theory, array $answers): array
    {
        $key = (string) config('skuggle.ai.gemini.key');
        $payload = [
            'maximumScore' => (float) $assessment->maximum_score,
            'questions' => collect($theory)->map(fn ($q) => [
                'id' => $q->public_id,
                'prompt' => $q->prompt,
                'marks' => (float) $q->marks,
                'guide' => (string) $q->correct_answer,
                'answer' => (string) ($answers[$q->public_id] ?? ''),
            ])->values()->all(),
        ];
        $prompt = 'Suggest marks for these theory answers. Return JSON only: {"suggestedScore":0,"feedback":"","confidence":0-1,"rubricBreakdown":[{"criterion":"","score":0,"max":0}]}. Never exceed maximumScore. Prefer conservative partial credit.';
        $response = Http::timeout(60)->retry(1, 500)->withHeaders(['x-goog-api-key' => $key])->post(
            'https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode((string) config('skuggle.ai.gemini.model')).':generateContent',
            [
                'contents' => [['parts' => [['text' => $prompt."\n".json_encode($payload)]]]],
                'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0.2],
            ]
        );
        if (! $response->successful()) {
            throw new ApiException('THEORY_MARKING_FAILED', 'The AI marking provider could not score this script.', 502);
        }
        $decoded = json_decode((string) data_get($response->json(), 'candidates.0.content.parts.0.text', ''), true);
        if (! is_array($decoded)) {
            throw new ApiException('THEORY_MARKING_INVALID', 'The AI marking provider returned an invalid result.', 502);
        }

        return [
            'suggestedScore' => round(min((float) ($decoded['suggestedScore'] ?? 0), (float) $assessment->maximum_score), 2),
            'feedback' => (string) ($decoded['feedback'] ?? ''),
            'confidence' => max(0, min(1, (float) ($decoded['confidence'] ?? 0.5))),
            'rubricBreakdown' => array_values((array) ($decoded['rubricBreakdown'] ?? [])),
        ];
    }

    public function applySuggestion(Assessment $assessment, Student $student, float $score, int $actorId, array $suggestion): AssessmentScore
    {
        abort_if($score < 0 || $score > (float) $assessment->maximum_score, 422, 'Suggested score is outside the assessment maximum.');
        $row = AssessmentScore::query()->firstOrNew([
            'assessment_id' => $assessment->getKey(),
            'student_id' => $student->getKey(),
        ]);
        $before = $row->only(['score', 'status', 'metadata']);
        $row->fill([
            'score' => $score,
            'status' => 'ENTERED',
            'graded_by' => $actorId,
            'graded_at' => now(),
            'revision' => ($row->revision ?? 0) + 1,
            'metadata' => array_merge($row->metadata ?? [], [
                'source' => 'theory_ai',
                'aiSuggestion' => $suggestion,
                'humanVerified' => true,
            ]),
        ])->save();
        app(AuditLogger::class)->record('assessment.theory_suggestion_applied', $row, $before, $row->only(['score', 'status', 'metadata']));
        $assessment->increment('revision');

        return $row;
    }
}
