<?php

namespace App\Support;

use App\Models\Tenant;

/**
 * Derives a short school code from the tenant display name for staff/admission numbers.
 * Login/workspace codes (tenants.code) stay independent so renaming a school updates prefixes.
 */
final class SchoolCode
{
    /** @var list<string> */
    private const STOP_WORDS = ['the', 'of', 'and', 'for', 'a', 'an', 'at', 'in', 'to'];

    public static function forTenant(Tenant $tenant): string
    {
        $configured = trim((string) data_get($tenant->settings, 'registration.school_code', ''));
        if ($configured !== '') {
            return strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $configured) ?: 'SKG', 0, 8));
        }

        return self::fromName((string) $tenant->name);
    }

    public static function fromName(string $name): string
    {
        $words = preg_split('/\s+/', trim($name)) ?: [];
        $letters = [];
        foreach ($words as $word) {
            $clean = preg_replace('/[^A-Za-z0-9]/', '', $word) ?? '';
            if ($clean === '' || in_array(mb_strtolower($clean), self::STOP_WORDS, true)) {
                continue;
            }
            $letters[] = mb_strtoupper(mb_substr($clean, 0, 1));
        }

        $code = implode('', $letters);
        if (mb_strlen($code) < 2) {
            $fallback = preg_replace('/[^A-Za-z0-9]/', '', $name) ?: 'SKG';
            $code = mb_strtoupper(mb_substr($fallback, 0, 3));
        }

        return mb_substr($code, 0, 8);
    }
}
