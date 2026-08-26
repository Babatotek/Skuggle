<?php

namespace App\Domain\Library\AI;

use App\Exceptions\ApiException;
use Illuminate\Http\UploadedFile;

final class NullAIProvider implements AIProvider
{
    public function name(): string
    {
        return 'none';
    }

    public function model(): string
    {
        return 'none';
    }

    public function generateJson(string $system, string $prompt): array
    {
        throw new ApiException('AI_NOT_CONFIGURED', 'AI generation is not configured for this environment.', 503);
    }

    public function transcribe(UploadedFile $audio): string
    {
        throw new ApiException('TRANSCRIPTION_UNAVAILABLE', 'Voice transcription is not configured for this environment.', 503);
    }
}
