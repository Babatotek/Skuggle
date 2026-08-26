<?php

namespace App\Domain\Library\AI;

use App\Domain\Library\AI\Concerns\ParsesJsonResponse;
use App\Exceptions\ApiException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

final class GeminiProvider implements AIProvider
{
    use ParsesJsonResponse;

    public function name(): string
    {
        return 'gemini';
    }

    public function model(): string
    {
        return (string) config('skuggle.ai.gemini.model');
    }

    public function generateJson(string $system, string $prompt): array
    {
        $key = (string) config('skuggle.ai.gemini.key');
        if ($key === '') {
            throw new ApiException('AI_NOT_CONFIGURED', 'AI generation is not configured.', 503);
        }

        $response = Http::timeout((int) config('skuggle.ai.timeout'))
            ->acceptJson()
            ->post(sprintf('https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s', rawurlencode($this->model()), rawurlencode($key)), [
                'systemInstruction' => ['parts' => [['text' => $system]]],
                'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0.2],
            ]);

        if (! $response->successful()) {
            throw new ApiException('AI_PROVIDER_UNAVAILABLE', 'The AI provider could not complete this request.', 503);
        }
        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
        if (! is_string($text)) {
            throw new ApiException('AI_INVALID_RESPONSE', 'The AI provider returned no usable content.', 502);
        }

        return $this->parseJson($text);
    }

    public function transcribe(UploadedFile $audio): string
    {
        throw new ApiException('TRANSCRIPTION_UNAVAILABLE', 'Configure Groq transcription for voice annotations.', 503);
    }
}
