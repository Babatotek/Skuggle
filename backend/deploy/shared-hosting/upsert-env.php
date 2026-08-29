<?php

/**
 * Upsert key=value pairs into a Laravel .env file without dumping secrets to stdout.
 * Usage: php upsert-env.php /path/to/.env KEY=value KEY2=value2 ...
 */
if ($argc < 3) {
    fwrite(STDERR, "Usage: php upsert-env.php /.env KEY=value [...]\n");
    exit(1);
}

$file = $argv[1];
if (! is_file($file) || ! is_writable($file)) {
    fwrite(STDERR, "ERROR: .env missing or not writable: {$file}\n");
    exit(1);
}

$updates = [];
for ($i = 2; $i < $argc; $i++) {
    $part = $argv[$i];
    $pos = strpos($part, '=');
    if ($pos === false) {
        continue;
    }
    $key = substr($part, 0, $pos);
    $value = substr($part, $pos + 1);
    if ($key === '' || ! preg_match('/^[A-Z][A-Z0-9_]*$/', $key)) {
        fwrite(STDERR, "ERROR: invalid env key\n");
        exit(1);
    }
    $updates[$key] = $value;
}

if ($updates === []) {
    exit(0);
}

$format = static function (string $key, string $value): string {
    if ($value === '' || preg_match('/[\s#"\'\\\\$]/', $value)) {
        return $key.'="'.str_replace(['\\', '"', "\n"], ['\\\\', '\\"', '\\n'], $value).'"';
    }

    return $key.'='.$value;
};

$lines = file($file, FILE_IGNORE_NEW_LINES);
if ($lines === false) {
    fwrite(STDERR, "ERROR: unable to read .env\n");
    exit(1);
}

$seen = [];
foreach ($lines as $index => $line) {
    if (! preg_match('/^([A-Z][A-Z0-9_]*)=/', $line, $match)) {
        continue;
    }
    $key = $match[1];
    if (! array_key_exists($key, $updates)) {
        continue;
    }
    $lines[$index] = $format($key, $updates[$key]);
    $seen[$key] = true;
}

foreach ($updates as $key => $value) {
    if (! isset($seen[$key])) {
        $lines[] = $format($key, $value);
    }
}

if (file_put_contents($file, implode("\n", $lines)."\n") === false) {
    fwrite(STDERR, "ERROR: unable to write .env\n");
    exit(1);
}

fwrite(STDOUT, 'Updated '.count($updates)." mail/app env key(s)\n");
