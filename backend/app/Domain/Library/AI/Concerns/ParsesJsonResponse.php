<?php

namespace App\Domain\Library\AI\Concerns;

use App\Exceptions\ApiException;

trait ParsesJsonResponse
{
    private function parseJson(string $value): array
    {
        $clean = trim(preg_replace('/^```(?:json)?|```$/m', '', trim($value)) ?? $value);
        $decoded = json_decode($clean, true);
        if (! is_array($decoded)) {
            throw new ApiException('AI_INVALID_RESPONSE', 'The AI provider returned an invalid structured response.', 502);
        }

        return $decoded;
    }
}
