<?php

namespace App\Services;

use App\Models\ResultPin;
use App\Models\ResultPublication;
use Illuminate\Support\Facades\Hash;

final class ResultPinService
{
    public function issueForPublication(ResultPublication $publication, int $usageLimit = 5, ?\DateTimeInterface $expiresAt = null): string
    {
        $plain = $this->generatePlainPin();

        ResultPin::query()->create([
            'result_publication_id' => $publication->getKey(),
            'pin_hash' => Hash::make($plain),
            'usage_limit' => $usageLimit,
            'usage_count' => 0,
            'expires_at' => $expiresAt,
        ]);

        return $plain;
    }

    public function generatePlainPin(): string
    {
        $segments = [];
        for ($i = 0; $i < 3; $i++) {
            $segments[] = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        }

        return implode('-', $segments);
    }

    public function maskPlainPin(string $plain): string
    {
        $digits = preg_replace('/\D+/', '', $plain) ?? '';

        return str_repeat('*', max(0, strlen($digits) - 4)).substr($digits, -4);
    }
}
