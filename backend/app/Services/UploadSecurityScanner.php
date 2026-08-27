<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

/**
 * UploadSecurityScanner
 *
 * Multi-layer file upload security:
 *  1. Extension allowlist — rejects disallowed extensions immediately
 *  2. MIME type validation — checks reported MIME against allowed list
 *  3. Magic-byte verification — reads file header to confirm real type
 *  4. ClamAV scan — binary scan for known malware signatures
 *
 * Behaviour matrix:
 *  | ClamAV enabled | ENV        | Result on disabled scan |
 *  |----------------|------------|-------------------------|
 *  | false          | production | 503 (blocks uploads)    |
 *  | false          | non-prod   | skips ClamAV only       |
 *  | true           | any        | full scan               |
 */
final class UploadSecurityScanner
{
    /**
     * Allowed MIME types → allowed extensions (must pass both checks).
     * Keep this list tight — add types explicitly, never use wildcards.
     */
    private const ALLOWED = [
        'application/pdf' => ['pdf'],
        'application/msword' => ['doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['docx'],
        'application/vnd.ms-excel' => ['xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => ['xlsx'],
        'application/vnd.ms-powerpoint' => ['ppt'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' => ['pptx'],
        'text/plain' => ['txt'],
        'text/csv' => ['csv'],
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/gif' => ['gif'],
        'image/webp' => ['webp'],
        'audio/mpeg' => ['mp3'],
        'audio/ogg' => ['ogg'],
        'audio/wav' => ['wav'],
        'video/mp4' => ['mp4'],
        'video/webm' => ['webm'],
    ];

    /**
     * Magic byte signatures (first N bytes) for quick real-type verification.
     * Format: [ mime => [ hex_prefix, ... ] ]
     */
    private const MAGIC_BYTES = [
        'application/pdf' => ['255044462d'],           // %PDF-
        'image/jpeg' => ['ffd8ff'],               // JPEG SOI
        'image/png' => ['89504e47'],             // \x89PNG
        'image/gif' => ['474946383761', '474946383961'], // GIF87a / GIF89a
        'image/webp' => ['52494646'],             // RIFF (then check WEBP at offset 8)
        'audio/mpeg' => ['fffb', 'fff3', 'fff2', '4944330'], // MP3 sync / ID3
        'video/mp4' => ['00000018667479', '00000020667479', '66747970'], // ftyp variants
    ];

    /**
     * Dangerous extensions that must never be accepted regardless of MIME.
     */
    private const DANGEROUS_EXTENSIONS = [
        'exe', 'bat', 'cmd', 'sh', 'ps1', 'msi', 'dll', 'so', 'dylib',
        'vbs', 'js', 'ts', 'jsx', 'tsx', 'php', 'phtml', 'php3', 'php4',
        'php5', 'php7', 'phar', 'py', 'rb', 'pl', 'cgi', 'htaccess',
        'jar', 'war', 'ear', 'class', 'java', 'jsp', 'asp', 'aspx',
        'html', 'htm', 'svg', 'xml', 'xhtml', 'swf',
    ];

    public function scan(UploadedFile $file): string
    {
        $this->checkExtension($file);
        $this->checkMimeType($file);
        $this->checkMagicBytes($file);

        return $this->runClamAv($file);
    }

    // -------------------------------------------------------------------------
    // Layer 1 — Extension allowlist
    // -------------------------------------------------------------------------

    private function checkExtension(UploadedFile $file): void
    {
        $ext = strtolower($file->getClientOriginalExtension());

        // Catch double extensions like "evil.pdf.exe"
        $originalName = strtolower((string) $file->getClientOriginalName());
        foreach (self::DANGEROUS_EXTENSIONS as $dangerous) {
            if (str_ends_with($originalName, '.'.$dangerous)) {
                Log::warning('upload.dangerous_extension', [
                    'extension' => $dangerous,
                    'filename' => $file->getClientOriginalName(),
                ]);
                throw new ApiException(
                    'UNSAFE_UPLOAD',
                    'This file type is not allowed.',
                    422
                );
            }
        }

        $allowedExtensions = array_merge(...array_values(self::ALLOWED));
        if (! in_array($ext, $allowedExtensions, true)) {
            Log::warning('upload.disallowed_extension', [
                'extension' => $ext,
                'filename' => $file->getClientOriginalName(),
            ]);
            throw new ApiException(
                'UNSAFE_UPLOAD',
                'This file type is not permitted. Allowed types: '
                    .implode(', ', array_unique($allowedExtensions)).'.',
                422
            );
        }
    }

    // -------------------------------------------------------------------------
    // Layer 2 — MIME type validation
    // -------------------------------------------------------------------------

    private function checkMimeType(UploadedFile $file): void
    {
        $mime = $file->getMimeType() ?? $file->getClientMimeType();

        if (! array_key_exists($mime, self::ALLOWED)) {
            Log::warning('upload.disallowed_mime', [
                'mime' => $mime,
                'filename' => $file->getClientOriginalName(),
            ]);
            throw new ApiException(
                'UNSAFE_UPLOAD',
                'The file\'s content type is not permitted.',
                422
            );
        }

        // Confirm the extension matches the MIME
        $ext = strtolower($file->getClientOriginalExtension());
        if (! in_array($ext, self::ALLOWED[$mime], true)) {
            Log::warning('upload.mime_extension_mismatch', [
                'mime' => $mime,
                'extension' => $ext,
                'filename' => $file->getClientOriginalName(),
            ]);
            throw new ApiException(
                'UNSAFE_UPLOAD',
                'File extension does not match its content type.',
                422
            );
        }
    }

    // -------------------------------------------------------------------------
    // Layer 3 — Magic-byte check
    // -------------------------------------------------------------------------

    private function checkMagicBytes(UploadedFile $file): void
    {
        $mime = $file->getMimeType() ?? $file->getClientMimeType();

        if (! array_key_exists($mime, self::MAGIC_BYTES)) {
            // No magic-byte rule for this type — skip check
            return;
        }

        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            return; // Can't open for reading — let ClamAV handle it
        }

        $header = bin2hex(fread($handle, 16));
        fclose($handle);

        $matched = false;
        foreach (self::MAGIC_BYTES[$mime] as $magic) {
            if (str_starts_with($header, $magic)) {
                $matched = true;
                break;
            }
        }

        if (! $matched) {
            Log::warning('upload.magic_byte_mismatch', [
                'mime' => $mime,
                'header' => substr($header, 0, 20),
                'filename' => $file->getClientOriginalName(),
            ]);
            throw new ApiException(
                'UNSAFE_UPLOAD',
                'File content does not match the declared file type.',
                422
            );
        }
    }

    // -------------------------------------------------------------------------
    // Layer 4 — ClamAV binary scan
    // -------------------------------------------------------------------------

    private function runClamAv(UploadedFile $file): string
    {
        if (! config('skuggle.security.clamav_enabled')) {
            if (app()->environment('production')
                && config('skuggle.security.clamav_required_in_production', true)
            ) {
                Log::error('upload.clamav_unavailable_in_production');
                throw new ApiException(
                    'MALWARE_SCANNER_UNAVAILABLE',
                    'Document uploads are temporarily unavailable.',
                    503
                );
            }

            return 'not_configured';
        }

        $binary = (string) config('skuggle.security.clamav_binary', 'clamscan');
        $process = new Process([$binary, '--no-summary', $file->getRealPath()]);
        $process->setTimeout(30);
        $process->run();

        // ClamAV exit codes: 0 = clean, 1 = virus found, 2 = error
        if ($process->getExitCode() === 1) {
            Log::warning('upload.virus_detected', [
                'filename' => $file->getClientOriginalName(),
                'output' => $process->getOutput(),
            ]);
            throw new ApiException(
                'UNSAFE_UPLOAD',
                'The uploaded document did not pass the security scan.',
                422
            );
        }

        if ($process->getExitCode() !== 0) {
            Log::error('upload.clamav_error', [
                'exit_code' => $process->getExitCode(),
                'stderr' => $process->getErrorOutput(),
            ]);
            throw new ApiException(
                'MALWARE_SCANNER_UNAVAILABLE',
                'Document uploads are temporarily unavailable.',
                503
            );
        }

        return 'clean';
    }

    /**
     * Expose allowed MIME list for use in validation rules.
     */
    public static function allowedMimes(): array
    {
        return array_keys(self::ALLOWED);
    }

    /**
     * Expose allowed extensions for use in validation rules.
     */
    public static function allowedExtensions(): array
    {
        return array_unique(array_merge(...array_values(self::ALLOWED)));
    }
}
