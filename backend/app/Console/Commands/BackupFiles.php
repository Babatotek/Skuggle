<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use ZipArchive;

class BackupFiles extends Command
{
    protected $signature = 'backup:files';

    protected $description = 'Archive storage/app (excluding backups/cache) into storage/app/backups/files';

    public function handle(): int
    {
        if (! class_exists(ZipArchive::class)) {
            $this->error('PHP zip extension is required for backup:files.');

            return self::FAILURE;
        }

        $source = storage_path('app');
        $targetDir = storage_path('app/backups/files/'.now()->format('Y/m'));
        File::ensureDirectoryExists($targetDir);

        $zipPath = $targetDir.'/storage-'.now()->format('Ymd-His').'-'.Str::lower(Str::random(4)).'.zip';
        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            $this->error('Unable to create zip archive.');

            return self::FAILURE;
        }

        $exclude = ['backups', 'public', 'private/livewire-tmp'];
        $count = 0;

        foreach (File::allFiles($source) as $file) {
            $relative = str_replace('\\', '/', $file->getRelativePathname());
            foreach ($exclude as $prefix) {
                if (str_starts_with($relative, rtrim($prefix, '/').'/') || $relative === rtrim($prefix, '/')) {
                    continue 2;
                }
            }
            $zip->addFile($file->getPathname(), $relative);
            $count++;
        }

        $zip->close();
        $this->info("Archived {$count} files to {$zipPath}");

        return self::SUCCESS;
    }
}
