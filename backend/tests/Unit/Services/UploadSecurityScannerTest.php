<?php

namespace Tests\Unit\Services;

use App\Exceptions\ApiException;
use App\Services\UploadSecurityScanner;
use Illuminate\Http\UploadedFile;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UploadSecurityScannerTest extends TestCase
{
    private UploadSecurityScanner $scanner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->scanner = new UploadSecurityScanner;

        // Disable ClamAV for unit tests — integration covered separately
        config(['skuggle.security.clamav_enabled' => false]);
        config(['skuggle.security.clamav_required_in_production' => false]);
    }

    // -------------------------------------------------------------------------
    // Allowed MIME / extension helpers
    // -------------------------------------------------------------------------

    #[Test]
    public function allowed_mimes_returns_non_empty_array(): void
    {
        $mimes = UploadSecurityScanner::allowedMimes();

        $this->assertIsArray($mimes);
        $this->assertNotEmpty($mimes);
        $this->assertContains('application/pdf', $mimes);
        $this->assertContains('image/jpeg', $mimes);
    }

    #[Test]
    public function allowed_extensions_returns_non_empty_array(): void
    {
        $exts = UploadSecurityScanner::allowedExtensions();

        $this->assertIsArray($exts);
        $this->assertNotEmpty($exts);
        $this->assertContains('pdf', $exts);
        $this->assertContains('jpg', $exts);
    }

    #[Test]
    public function allowed_extensions_contains_no_dangerous_types(): void
    {
        $dangerous = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'php', 'phtml', 'js', 'html', 'svg'];
        $allowed   = UploadSecurityScanner::allowedExtensions();

        foreach ($dangerous as $ext) {
            $this->assertNotContains($ext, $allowed,
                "Dangerous extension '{$ext}' must not appear in allowed list");
        }
    }

    // -------------------------------------------------------------------------
    // Extension allowlist
    // -------------------------------------------------------------------------

    #[Test]
    #[DataProvider('dangerousExtensionProvider')]
    public function rejects_dangerous_extension(string $filename): void
    {
        $file = UploadedFile::fake()->createWithContent($filename, '%PDF-1.4 fake content');

        $this->expectException(ApiException::class);

        $this->scanner->scan($file);
    }

    public static function dangerousExtensionProvider(): array
    {
        return [
            'exe file'           => ['malware.exe'],
            'shell script'       => ['evil.sh'],
            'php file'           => ['shell.php'],
            'double extension'   => ['document.pdf.exe'],
            'powershell script'  => ['attack.ps1'],
            'batch file'         => ['virus.bat'],
            'javascript'         => ['payload.js'],
            'html file'          => ['xss.html'],
            'svg file'           => ['xss.svg'],
        ];
    }

    #[Test]
    public function rejects_disallowed_but_not_dangerous_extension(): void
    {
        // .zip is not dangerous but also not in the allowed list
        $file = UploadedFile::fake()->create('archive.zip', 100, 'application/zip');

        $this->expectException(ApiException::class);

        $this->scanner->scan($file);
    }

    // -------------------------------------------------------------------------
    // MIME type validation
    // -------------------------------------------------------------------------

    #[Test]
    public function rejects_when_extension_does_not_match_mime(): void
    {
        // Create a file that claims to be a PDF by MIME but has .docx extension
        // Use fake() to control mime type
        $file = $this->createFakeFileWithMime('document.docx', 'application/pdf');

        $this->expectException(ApiException::class);

        $this->scanner->scan($file);
    }

    // -------------------------------------------------------------------------
    // Magic-byte verification
    // -------------------------------------------------------------------------

    #[Test]
    public function rejects_file_with_mismatched_magic_bytes(): void
    {
        // Create a file with .jpg extension and image/jpeg MIME but wrong content
        $file = $this->createFakeFileWithMime('photo.jpg', 'image/jpeg', 'This is not a JPEG file at all!!!');

        $this->expectException(ApiException::class);

        $this->scanner->scan($file);
    }

    #[Test]
    public function accepts_valid_jpeg_with_correct_magic_bytes(): void
    {
        // JPEG magic bytes: FF D8 FF
        $jpegContent = "\xFF\xD8\xFF\xE0" . str_repeat("\x00", 100);
        $file = $this->createFakeFileWithMime('photo.jpg', 'image/jpeg', $jpegContent);

        // Should not throw
        $result = $this->scanner->scan($file);

        $this->assertSame('not_configured', $result);
    }

    #[Test]
    public function accepts_valid_png_with_correct_magic_bytes(): void
    {
        // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
        // PHP finfo reads the real file content to determine MIME, so we must
        // write a real (minimal) PNG header so finfo detects it as image/png.
        $pngContent = "\x89\x50\x4E\x47\x0D\x0A\x1A\x0A" // PNG signature
                    . "\x00\x00\x00\x0D"                  // IHDR chunk length
                    . "\x49\x48\x44\x52"                  // "IHDR"
                    . "\x00\x00\x00\x01"                  // width: 1
                    . "\x00\x00\x00\x01"                  // height: 1
                    . "\x08\x02"                           // 8-bit depth, RGB
                    . "\x00\x00\x00"                      // compression, filter, interlace
                    . "\x90\x77\x53\xDE";                 // CRC

        $file = $this->createFakeFileWithMime('image.png', 'image/png', $pngContent);

        $result = $this->scanner->scan($file);

        $this->assertSame('not_configured', $result);
    }

    #[Test]
    public function accepts_valid_pdf_with_correct_magic_bytes(): void
    {
        // PDF magic bytes: %PDF-
        $pdfContent = '%PDF-1.4' . str_repeat("\n", 100);
        $file = $this->createFakeFileWithMime('document.pdf', 'application/pdf', $pdfContent);

        $result = $this->scanner->scan($file);

        $this->assertSame('not_configured', $result);
    }

    #[Test]
    public function skips_magic_byte_check_for_types_without_signatures(): void
    {
        // text/plain has no magic byte rule — should pass through to ClamAV stage
        $file = $this->createFakeFileWithMime('notes.txt', 'text/plain', 'Hello world');

        // Should not throw (no magic byte rule, ClamAV disabled)
        $result = $this->scanner->scan($file);

        $this->assertSame('not_configured', $result);
    }

    // -------------------------------------------------------------------------
    // ClamAV disabled behaviour
    // -------------------------------------------------------------------------

    #[Test]
    public function returns_not_configured_when_clamav_disabled_in_non_production(): void
    {
        config(['app.env' => 'local']);

        $pdfContent = '%PDF-1.4' . str_repeat("\n", 100);
        $file = $this->createFakeFileWithMime('document.pdf', 'application/pdf', $pdfContent);

        $result = $this->scanner->scan($file);

        $this->assertSame('not_configured', $result);
    }

    #[Test]
    public function throws_503_when_clamav_disabled_in_production_and_required(): void
    {
        // Use the APP_ENV env var directly — app()->environment() reads this
        $original = app()->environment();
        app()->detectEnvironment(fn () => 'production');

        config(['skuggle.security.clamav_enabled' => false]);
        config(['skuggle.security.clamav_required_in_production' => true]);

        $pdfContent = '%PDF-1.4' . str_repeat("\n", 100);
        $file = $this->createFakeFileWithMime('document.pdf', 'application/pdf', $pdfContent);

        try {
            $this->scanner->scan($file);
            $this->fail('Expected ApiException to be thrown');
        } catch (ApiException $e) {
            $this->assertSame(503, $e->status);
            $this->assertSame('MALWARE_SCANNER_UNAVAILABLE', $e->errorCode);
        } finally {
            app()->detectEnvironment(fn () => $original);
        }
    }

    #[Test]
    public function does_not_block_when_clamav_disabled_but_not_required_in_production(): void
    {
        config(['app.env' => 'production']);
        config(['skuggle.security.clamav_enabled' => false]);
        config(['skuggle.security.clamav_required_in_production' => false]);

        $pdfContent = '%PDF-1.4' . str_repeat("\n", 100);
        $file = $this->createFakeFileWithMime('document.pdf', 'application/pdf', $pdfContent);

        $result = $this->scanner->scan($file);

        $this->assertSame('not_configured', $result);
    }

    // -------------------------------------------------------------------------
    // Error codes
    // -------------------------------------------------------------------------

    #[Test]
    public function exception_has_correct_error_code_for_unsafe_upload(): void
    {
        $file = UploadedFile::fake()->create('malware.exe', 100);

        try {
            $this->scanner->scan($file);
            $this->fail('Expected ApiException');
        } catch (ApiException $e) {
            $this->assertSame('UNSAFE_UPLOAD', $e->errorCode);
            $this->assertSame(422, $e->status);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Create a fake UploadedFile with controlled MIME type and content.
     */
    private function createFakeFileWithMime(
        string $filename,
        string $mimeType,
        string $content = 'fake content'
    ): UploadedFile {
        $tmpPath = tempnam(sys_get_temp_dir(), 'upload_test_');
        file_put_contents($tmpPath, $content);

        return new UploadedFile(
            path: $tmpPath,
            originalName: $filename,
            mimeType: $mimeType,
            error: UPLOAD_ERR_OK,
            test: true
        );
    }
}
