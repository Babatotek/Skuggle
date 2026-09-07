<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;

final class SmartmarkOcrService
{
    public function __construct(private readonly SmartmarkScoringService $scoring) {}

    /**
     * @param  list<string>  $answerKey
     * @return list<array{admission_number:?string,student_name:?string,answers:list<string>,detected_score:float,confidence:float,human_review_required:bool,flag_reason:?string,confidence_band:string}>
     */
    public function extract(string $bytes, string $mime, array $answerKey, int $maxScore): array
    {
        $provider = (string) config('skuggle.ocr.provider');
        $sheets = match ($provider) {
            'fake' => $this->fakeSheets($bytes, $answerKey),
            'gemini' => $this->geminiSheets($bytes, $mime),
            default => throw new ApiException('OCR_NOT_CONFIGURED', 'Configure OCR_PROVIDER=gemini (or fake in tests) and credentials before processing scans.', 503),
        };

        return collect($sheets)->map(function (array $sheet) use ($answerKey, $maxScore) {
            $answers = array_values((array) ($sheet['answers'] ?? []));
            while (count($answers) < count($answerKey)) {
                $answers[] = '?';
            }
            $evaluation = $this->scoring->evaluate(
                $answers,
                $answerKey,
                $maxScore,
                (float) ($sheet['confidence'] ?? 0),
                isset($sheet['flagReason']) ? (string) $sheet['flagReason'] : null,
                true,
            );

            return [
                'admission_number' => $sheet['admissionNumber'] ?? null,
                'student_name' => $sheet['studentName'] ?? null,
                'answers' => $answers,
                'detected_score' => $evaluation['detected_score'],
                'confidence' => $evaluation['confidence'],
                'human_review_required' => $evaluation['human_review_required'],
                'flag_reason' => $evaluation['flag_reason'],
                'confidence_band' => $evaluation['band']->value,
            ];
        })->all();
    }

    /**
     * @param  list<string>  $answerKey
     * @return list<array<string, mixed>>
     */
    private function fakeSheets(string $bytes, array $answerKey): array
    {
        $decoded = json_decode($bytes, true);
        if (! is_array($decoded) || ! is_array($decoded['sheets'] ?? null)) {
            if (preg_match('/\{\s*"sheets"\s*:/', $bytes, $matches, PREG_OFFSET_CAPTURE)) {
                $decoded = json_decode(substr($bytes, $matches[0][1]), true);
            }
        }
        if (is_array($decoded) && is_array($decoded['sheets'] ?? null)) {
            return $decoded['sheets'];
        }

        return [[
            'admissionNumber' => 'ST-SM-1',
            'studentName' => 'Test Learner',
            'answers' => array_map(fn ($answer) => strtoupper((string) $answer), $answerKey),
            'confidence' => 98,
            'humanReviewRequired' => false,
            'flagReason' => '',
        ]];
    }

    /** @return list<array<string, mixed>> */
    private function geminiSheets(string $bytes, string $mime): array
    {
        $key = (string) config('skuggle.ai.gemini.key');
        if ($key === '') {
            throw new ApiException('OCR_NOT_CONFIGURED', 'Gemini OCR credentials are missing.', 503);
        }
        $prompt = 'Read every OMR answer sheet in this image or PDF. Prefer the large Admission field and any SM|{assessmentId}|{admission} scan code. Return strict JSON only: {"sheets":[{"admissionNumber":"","studentName":"","answers":["A"],"confidence":0-100,"humanReviewRequired":true,"flagReason":""}]}. Use ? for ambiguous or double-shaded marks. Never invent an unreadable admission number.';
        $response = Http::timeout((int) config('skuggle.ocr.timeout', 90))->retry(2, 500)->withHeaders(['x-goog-api-key' => $key])->post('https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode((string) config('skuggle.ai.gemini.model')).':generateContent', [
            'contents' => [['parts' => [['inline_data' => ['mime_type' => $mime, 'data' => base64_encode($bytes)]], ['text' => $prompt]]]],
            'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0],
        ]);
        if (! $response->successful()) {
            throw new ApiException('OCR_PROVIDER_FAILED', 'The OCR provider could not process this scan.', 502);
        }
        $text = (string) data_get($response->json(), 'candidates.0.content.parts.0.text', '');
        $decoded = json_decode($text, true);
        if (! is_array($decoded) || ! is_array($decoded['sheets'] ?? null)) {
            throw new ApiException('OCR_INVALID_RESPONSE', 'The OCR provider returned an invalid result.', 502);
        }

        return $decoded['sheets'];
    }
}
