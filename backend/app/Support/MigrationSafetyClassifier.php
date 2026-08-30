<?php

namespace App\Support;

/**
 * Classifies a Laravel migration's up() method so production deploys can
 * follow expand → deploy → contract instead of dropping compatibility in
 * the same release that a rollback would still need.
 *
 * SAFE: additive schema (create table, add nullable/indexed columns)
 * CAUTION: indexes/FKs dropped, ->change() type alterations
 * DESTRUCTIVE: drop/rename table or column in up() — blocked unless explicitly allowed
 */
final class MigrationSafetyClassifier
{
    public const SAFE = 'SAFE';

    public const CAUTION = 'CAUTION';

    public const DESTRUCTIVE = 'DESTRUCTIVE';

    /**
     * @var list<array{pattern: string, level: string, label: string}>
     */
    private const RULES = [
        ['pattern' => '/\bSchema::dropIfExists\s*\(/', 'level' => self::DESTRUCTIVE, 'label' => 'Schema::dropIfExists'],
        ['pattern' => '/\bSchema::drop\s*\(/', 'level' => self::DESTRUCTIVE, 'label' => 'Schema::drop'],
        ['pattern' => '/\bSchema::rename\s*\(/', 'level' => self::DESTRUCTIVE, 'label' => 'Schema::rename'],
        ['pattern' => '/->dropColumn\s*\(/', 'level' => self::DESTRUCTIVE, 'label' => 'dropColumn'],
        ['pattern' => '/->renameColumn\s*\(/', 'level' => self::DESTRUCTIVE, 'label' => 'renameColumn'],
        ['pattern' => '/->dropMorphs\s*\(/', 'level' => self::DESTRUCTIVE, 'label' => 'dropMorphs'],
        ['pattern' => '/->dropSoftDeletes\s*\(/', 'level' => self::DESTRUCTIVE, 'label' => 'dropSoftDeletes'],
        ['pattern' => '/->dropTimestamps\s*\(/', 'level' => self::DESTRUCTIVE, 'label' => 'dropTimestamps'],
        ['pattern' => '/->change\s*\(/', 'level' => self::CAUTION, 'label' => 'change'],
        ['pattern' => '/->dropForeign\s*\(/', 'level' => self::CAUTION, 'label' => 'dropForeign'],
        ['pattern' => '/->dropUnique\s*\(/', 'level' => self::CAUTION, 'label' => 'dropUnique'],
        ['pattern' => '/->dropPrimary\s*\(/', 'level' => self::CAUTION, 'label' => 'dropPrimary'],
        ['pattern' => '/->dropIndex\s*\(/', 'level' => self::CAUTION, 'label' => 'dropIndex'],
    ];

    /**
     * @return array{level: string, hits: list<string>, annotated: ?string, name: string, path: string}
     */
    public function classifyFile(string $path): array
    {
        $source = (string) file_get_contents($path);
        $up = $this->extractUpMethod($source);
        $hits = [];
        $level = self::SAFE;

        foreach (self::RULES as $rule) {
            if ($up !== '' && preg_match($rule['pattern'], $up) === 1) {
                $hits[] = $rule['label'];
                $level = $this->worse($level, $rule['level']);
            }
        }

        $annotated = $this->annotation($source);
        if ($annotated === self::DESTRUCTIVE) {
            $level = self::DESTRUCTIVE;
        } elseif ($annotated === self::CAUTION && $level === self::SAFE) {
            $level = self::CAUTION;
        }

        return [
            'level' => $level,
            'hits' => array_values(array_unique($hits)),
            'annotated' => $annotated,
            'name' => pathinfo($path, PATHINFO_FILENAME),
            'path' => $path,
        ];
    }

    /**
     * @return list<array{level: string, hits: list<string>, annotated: ?string, name: string, path: string}>
     */
    public function classifyDirectory(string $directory): array
    {
        $files = glob(rtrim($directory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'*.php') ?: [];
        sort($files);

        return array_map(fn (string $path) => $this->classifyFile($path), $files);
    }

    public function extractUpMethod(string $source): string
    {
        if (! preg_match('/public\s+function\s+up\s*\(\s*\)\s*(?::\s*void)?\s*\{/', $source, $match, PREG_OFFSET_CAPTURE)) {
            return '';
        }

        $start = (int) $match[0][1] + strlen($match[0][0]);
        $depth = 1;
        $length = strlen($source);
        $inString = null;
        $escaped = false;

        for ($i = $start; $i < $length; $i++) {
            $char = $source[$i];
            if ($inString !== null) {
                if ($escaped) {
                    $escaped = false;

                    continue;
                }
                if ($char === '\\') {
                    $escaped = true;

                    continue;
                }
                if ($char === $inString) {
                    $inString = null;
                }

                continue;
            }
            if ($char === '\'' || $char === '"') {
                $inString = $char;

                continue;
            }
            if ($char === '{') {
                $depth++;

                continue;
            }
            if ($char === '}') {
                $depth--;
                if ($depth === 0) {
                    return substr($source, $start, $i - $start);
                }
            }
        }

        return substr($source, $start);
    }

    private function annotation(string $source): ?string
    {
        if (preg_match('/@migration-safety\s+(destructive|caution|safe)\b/i', $source, $match) !== 1) {
            return null;
        }

        return strtoupper($match[1]);
    }

    private function worse(string $current, string $candidate): string
    {
        $rank = [self::SAFE => 0, self::CAUTION => 1, self::DESTRUCTIVE => 2];

        return ($rank[$candidate] ?? 0) > ($rank[$current] ?? 0) ? $candidate : $current;
    }
}
