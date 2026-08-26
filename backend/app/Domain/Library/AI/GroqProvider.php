<?php

namespace App\Domain\Library\AI;

use App\Domain\Library\AI\Concerns\ParsesJsonResponse;
use App\Exceptions\ApiException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

final class GroqProvider implements AIProvider
{
    use ParsesJsonResponse;

    public function name(): string
    {
        return 'groq';
    }

    public function model(): string
    {
        return (string) config('skuggle.ai.groq.model');
    }

    private function client()
    {
        $key = (string) config('skuggle.ai.groq.key');
        if ($key === '') {
            throw new ApiException('AI_NOT_CONFIGURED', 'AI generation is not configured.', 503);
        }

        return Http::withToken($key)->timeout((int) config('skuggle.ai.timeout'))->acceptJson();
    }

    public function generateJson(string $system, string $prompt): array
    {
        $response = $this->client()->post('https://api.groq.com/openai/v1/chat/completions', [
            'model' => $this->model(),
            'messages' => [['role' => 'system', 'content' => $system], ['role' => 'user', 'content' => $prompt]],
            'response_format' => ['type' => 'json_object'],
            'temperature' => 0.2,
        ]);
        if (! $response->successful()) {
            throw new ApiException('AI_PROVIDER_UNAVAILABLE', 'The AI provider could not complete this request.', 503);
        }
        $text = data_get($response->json(), 'choices.0.message.content');
        if (! is_string($text)) {
            throw new ApiException('AI_INVALID_RESPONSE', 'The AI provider returned no usable content.', 502);
        }

        return $this->parseJson($text);
    }

    public function transcribe(UploadedFile $audio): string
    {
        $response = $this->client()
            ->attach('file', fopen($audio->getRealPath(), 'rb'), $audio->hashName())
            ->post('https://api.groq.com/openai/v1/audio/transcriptions', [
                'model' => config('skuggle.ai.groq.transcription_model'),
                'response_format' => 'json',
                'language' => 'en',
            ]);
        if (! $response->successful()) {
            throw new ApiException('TRANSCRIPTION_UNAVAILABLE', 'The audio could not be transcribed.', 503);
        }
        $text = $response->json('text');
        if (! is_string($text) || trim($text) === '') {
            throw new ApiException('TRANSCRIPTION_EMPTY', 'No speech could be detected in the recording.', 422);
        }

        return trim($text);
    }
}
