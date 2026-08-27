<?php

namespace Tests\Unit\Security;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Enforces the withoutGlobalScopes() call-site count.
 *
 * Every legitimate bypass is documented in:
 *   deploy/GLOBAL_SCOPE_BYPASS_AUDIT.md
 *
 * If a new unregistered call is added the test fails, prompting the developer
 * to review, justify, and register it before the PR can merge.
 */
class GlobalScopeBypassTest extends TestCase
{
    /**
     * Update this constant when a new REVIEWED bypass is added.
     * Must match REGISTERED_TOTAL in scripts/check-global-scope-bypass.php.
     */
    private const REGISTERED_TOTAL = 25;

    #[Test]
    public function withoutGlobalScopes_call_count_matches_audit_register(): void
    {
        $appDir = base_path('app');
        $count  = 0;
        $found  = [];

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($appDir, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }

            $lines = file($file->getPathname(), FILE_IGNORE_NEW_LINES);
            foreach ($lines as $lineNo => $line) {
                if (str_contains($line, 'withoutGlobalScopes')) {
                    $count++;
                    $found[] = sprintf(
                        '%s:%d  →  %s',
                        str_replace($appDir . DIRECTORY_SEPARATOR, '', $file->getPathname()),
                        $lineNo + 1,
                        trim($line)
                    );
                }
            }
        }

        $this->assertSame(
            self::REGISTERED_TOTAL,
            $count,
            $count > self::REGISTERED_TOTAL
                ? sprintf(
                    "%d UNREGISTERED withoutGlobalScopes() call(s) found (expected %d).\n\n"
                    . "Each bypass must be:\n"
                    . "  1. Reviewed for tenant data leakage\n"
                    . "  2. Added to deploy/GLOBAL_SCOPE_BYPASS_AUDIT.md\n"
                    . "  3. REGISTERED_TOTAL incremented in this test AND in scripts/check-global-scope-bypass.php\n\n"
                    . "All found locations:\n%s",
                    $count - self::REGISTERED_TOTAL,
                    self::REGISTERED_TOTAL,
                    implode("\n", $found)
                )
                : sprintf(
                    'Call count dropped from %d to %d. '
                    . 'Update REGISTERED_TOTAL in %s and scripts/check-global-scope-bypass.php.',
                    self::REGISTERED_TOTAL,
                    $count,
                    __FILE__
                )
        );
    }

    #[Test]
    public function audit_register_document_exists_and_is_not_empty(): void
    {
        $path = base_path('deploy/GLOBAL_SCOPE_BYPASS_AUDIT.md');

        $this->assertFileExists($path,
            'deploy/GLOBAL_SCOPE_BYPASS_AUDIT.md must exist — it is the review record for all scope bypasses');

        $content = file_get_contents($path);
        $this->assertGreaterThan(500, strlen($content),
            'Audit register appears too short — ensure it is populated');

        $this->assertStringContainsString('withoutGlobalScopes', $content,
            'Audit register must reference withoutGlobalScopes');

        $this->assertStringContainsString('25', $content,
            'Audit register must document the registered total (25)');
    }

    #[Test]
    public function enforcement_script_exists(): void
    {
        $this->assertFileExists(
            base_path('scripts/check-global-scope-bypass.php'),
            'CI enforcement script must exist at scripts/check-global-scope-bypass.php'
        );
    }

    #[Test]
    public function platform_controller_routes_require_platform_permission(): void
    {
        // Load the routes to inspect — don't boot HTTP kernel, just parse route file
        $routeContent = file_get_contents(base_path('routes/api.php'));

        // PlatformController routes must be inside a permission-protected group
        $this->assertStringContainsString('PlatformController', $routeContent,
            'PlatformController routes should be registered');

        // The bypass calls in PlatformController must be behind a permission gate.
        // Verify the routes/api.php mentions a platform permission or admin gate.
        $hasPlatformGate = str_contains($routeContent, 'platform')
            && (str_contains($routeContent, 'permission') || str_contains($routeContent, 'gate'));

        $this->assertTrue($hasPlatformGate,
            'PlatformController routes must be protected by a platform permission/gate middleware. '
            . 'The withoutGlobalScopes() calls inside expose cross-tenant data.');
    }
}
