<?php

namespace App\Support;

/**
 * Browser-facing public disk URLs must be same-origin relative paths so the
 * Vite/Express frontend can proxy /storage to Laravel (APP_URL port may differ).
 */
final class PublicStorageUrl
{
    public static function fromKey(string $key): string
    {
        $key = ltrim(str_replace('\\', '/', $key), '/');
        if (str_starts_with($key, 'storage/')) {
            return '/'.$key;
        }

        return '/storage/'.$key;
    }

    public static function relative(?string $urlOrPath): ?string
    {
        if ($urlOrPath === null) {
            return null;
        }

        $value = trim($urlOrPath);
        if ($value === '') {
            return null;
        }

        if (str_starts_with($value, '/storage/')) {
            return $value;
        }

        if (preg_match('#https?://[^/]+(/storage/.+)$#i', $value, $matches) === 1) {
            return $matches[1];
        }

        if (! str_contains($value, '://') && ! str_starts_with($value, '/')) {
            return self::fromKey($value);
        }

        return $value;
    }

    public static function absolute(?string $urlOrPath): ?string
    {
        $normalized = self::relative($urlOrPath);
        if ($normalized === null) {
            return null;
        }

        if (str_starts_with($normalized, 'http://') || str_starts_with($normalized, 'https://')) {
            return $normalized;
        }

        $base = rtrim((string) config('app.url'), '/');

        return $base.$normalized;
    }
}
