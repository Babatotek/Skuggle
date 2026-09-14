<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;

final class SmartmarkOcrService
{
    public function __construct(
        private readonly SmartmarkScoringService $scoring,
        private readonly SmartmarkGeometricOmrService $geometric,
    ) {}

    /**
     * @param  list<string>  $answerKey
     * @param  array<string, mixed>|null  $layout  omrLayout payload when geometric reading is available
     * @return list<array{admission_number:?string,student_name:?string,answers:list<string>,detected_score:float,confidence:float,human_review_required:bool,flag_reason:?string,confidence_band:string,page?:?int,scanCode?:?string}>
     */
    public function extract(string $bytes, string $mime, array $answerKey, int $maxScore, ?array $layout = null): array
    {
        $provider = strtolower((string) config('skuggle.ocr.provider'));
        $sheets = match ($provider) {
            'fake' => $this->fakeSheets($bytes, $answerKey),
            'geometric' => $this->geometricSheets($bytes, $mime, $layout),
            'geometric+gemini', 'gemini+geometric' => $this->geometricWithGeminiFallback($bytes, $mime, $layout),
            'gemini' => $this->geminiSheetsChunked($bytes, $mime),
            default => throw new ApiException('OCR_NOT_CONFIGURED', 'Configure OCR_PROVIDER=geometric, geometric+gemini, gemini (or fake in tests) before processing scans.', 503),
        };

        return collect($sheets)->map(function (array $sheet, int $index) use ($answerKey, $maxScore) {
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
                'page' => $sheet['page'] ?? ($index + 1),
                'scanCode' => $sheet['scanCode'] ?? null,
            ];
        })->all();
    }

    /**
     * @param  array<string, mixed>|null  $layout
     * @return list<array<string, mixed>>
     */
    private function geometricSheets(string $bytes, string $mime, ?array $layout): array
    {
        $layout ??= ['items' => [], 'geometry' => app(SmartmarkOmrGeometry::class)->build([])];
        if (! isset($layout['geometry']) || ! is_array($layout['geometry'])) {
            $layout['geometry'] = app(SmartmarkOmrGeometry::class)->build((array) ($layout['items'] ?? []));
        }

        return $this->geometric->extract($bytes, $mime, $layout);
    }

    /**
     * Prefer grid-aligned bubble reading; fall back to Gemini for PDF or registration failure.
     *
     * @param  array<string, mixed>|null  $layout
     * @return list<array<string, mixed>>
     */
    private function geometricWithGeminiFallback(string $bytes, string $mime, ?array $layout): array
    {
        if (is_array($layout) && ! empty($layout['items']) && ! str_contains(strtolower($mime), 'pdf')) {
            try {
                $sheets = $this->geometric->extract($bytes, $mime, $layout);
                $usable = collect($sheets)->contains(function (array $sheet) {
                    $answers = array_values((array) ($sheet['answers'] ?? []));

                    return $answers !== [] && ! collect($answers)->every(fn ($a) => $a === '?');
                });
                if ($usable) {
                    return $sheets;
                }
            } catch (ApiException) {
                // Fall through to Gemini.
            }
        }

        return $this->geminiSheetsChunked($bytes, $mime);
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
            'page' => 1,
        ]];
    }

    /** @return list<array<string, mixed>> */
    private function geminiSheetsChunked(string $bytes, string $mime): array
    {
        // Large PDFs are processed in sequential Gemini passes with page-range prompts
        // so shared-hosting workers stay within request timeouts.
        $size = strlen($bytes);
        if (str_contains($mime, 'pdf') && $size > 1_500_000) {
            $chunks = [];
            $passes = min(4, max(2, (int) ceil($size / 1_500_000)));
            for ($pass = 1; $pass <= $passes; $pass++) {
                $part = $this->geminiSheets($bytes, $mime, "Focus on sheets for OCR pass {$pass} of {$passes}. Return only sheets for this pass with a unique page number.");
                foreach ($part as $sheet) {
                    $sheet['page'] = $sheet['page'] ?? (($pass - 1) * 50 + count($chunks) + 1);
                    $chunks[] = $sheet;
                }
            }

            return $chunks !== [] ? $chunks : $this->geminiSheets($bytes, $mime);
        }

        return $this->geminiSheets($bytes, $mime);
    }

    /** @return list<array<string, mixed>> */
    private function geminiSheets(string $bytes, string $mime, ?string $extra = null): array
    {
        $key = (string) config('skuggle.ai.gemini.key');
        if ($key === '') {
            throw new ApiException('OCR_NOT_CONFIGURED', 'Gemini OCR credentials are missing.', 503);
        }
        $prompt = 'Read every OMR answer sheet in this image or PDF. Prefer the large Admission field and any SM|{assessmentId}|{admission} scan code. Return strict JSON only: {"sheets":[{"admissionNumber":"","studentName":"","scanCode":"","page":1,"answers":["A"],"confidence":0-100,"humanReviewRequired":true,"flagReason":""}]}. Use ? for ambiguous or double-shaded marks. Never invent an unreadable admission number.';
        if ($extra) {
            $prompt .= ' '.$extra;
        }
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
