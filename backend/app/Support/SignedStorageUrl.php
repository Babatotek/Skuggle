<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

final class SignedStorageUrl
{
    public static function temporary(string $disk, string $path, int $minutes = 30): string
    {
        $filesystem = Storage::disk($disk);

        if (method_exists($filesystem, 'temporaryUrl')) {
            try {
                return $filesystem->temporaryUrl($path, now()->addMinutes($minutes));
            } catch (\Throwable) {
                // Local disks do not support temporary URLs.
            }
        }

        if (app()->environment('production')) {
            throw new \RuntimeException('The configured private object-storage disk cannot create temporary signed URLs.');
        }

        return $filesystem->url($path);
    }
}
