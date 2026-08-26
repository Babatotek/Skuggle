#!/usr/bin/env php
<?php

/**
 * CI enforcement script: withoutGlobalScopes() call-site counter.
 *
 * Every legitimate call is documented in deploy/GLOBAL_SCOPE_BYPASS_AUDIT.md.
 * If the count in the codebase exceeds REGISTERED_TOTAL the script exits 1
 * so CI fails and forces the developer to update the audit register.
 *
 * Usage:
 *   php scripts/check-global-scope-bypass.php          # from project root
 *   php scripts/check-global-scope-bypass.php --verbose
 */

const REGISTERED_TOTAL = 21;
const SCAN_ROOT        = __DIR__ . '/../app';
const AUDIT_DOC        = __DIR__ . '/../deploy/GLOBAL_SCOPE_BYPASS_AUDIT.md';

$verbose = in_array('--verbose', $argv, true);

// ------------------------------------------------------------------
// Collect all occurrences
// ------------------------------------------------------------------
$found = [];
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator(SCAN_ROOT, FilesystemIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if ($file->getExtension() !== 'php') {
        continue;
    }

    $lines = file($file->getPathname(), FILE_IGNORE_NEW_LINES);
    foreach ($lines as $lineNo => $line) {
        if (str_contains($line, 'withoutGlobalScopes')) {
            $found[] = [
                'file' => str_replace(SCAN_ROOT . '/', '', $file->getPathname()),
                'line' => $lineNo + 1,
                'code' => trim($line),
            ];
        }
    }
}

$count = count($found);

// ------------------------------------------------------------------
// Output
// ------------------------------------------------------------------
if ($verbose || $count > REGISTERED_TOTAL) {
    echo "withoutGlobalScopes() call sites found:\n";
    foreach ($found as $hit) {
        echo sprintf("  [%s:%d] %s\n", $hit['file'], $hit['line'], $hit['code']);
    }
    echo "\n";
}

echo "Found {$count} call site(s). Registered: " . REGISTERED_TOTAL . ".\n";

if ($count > REGISTERED_TOTAL) {
    $new = $count - REGISTERED_TOTAL;
    echo "\n❌  {$new} UNREGISTERED withoutGlobalScopes() call(s) detected.\n";
    echo "    Each new bypass MUST be reviewed and added to:\n";
    echo "    " . realpath(AUDIT_DOC) . "\n\n";
    echo "    Checklist:\n";
    echo "    1. Does the model use BelongsToTenant? If not, bypass is unnecessary.\n";
    echo "    2. Does an explicit WHERE tenant_id = \$id follow immediately?\n";
    echo "    3. Is the route protected by platform-admin gate?\n";
    echo "    4. Update REGISTERED_TOTAL in scripts/check-global-scope-bypass.php\n";
    echo "    5. Add an entry to deploy/GLOBAL_SCOPE_BYPASS_AUDIT.md\n\n";
    exit(1);
}

if ($count < REGISTERED_TOTAL) {
    echo "✅  Count decreased ({$count} < " . REGISTERED_TOTAL . "). Update REGISTERED_TOTAL in this script.\n";
    // Not a failure — could mean code was cleaned up
    exit(0);
}

echo "✅  All {$count} call site(s) accounted for in the audit register.\n";
exit(0);
