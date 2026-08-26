<?php

namespace App\Services;

use App\Models\PlatformBackupSnapshot;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class DatabaseBackupService
{
    /**
     * Create a logical database dump and register a platform backup snapshot.
     *
     * @return array{snapshot: PlatformBackupSnapshot, path: string, bytes: int}
     */
    public function create(?User $requestedBy = null, string $trigger = 'manual'): array
    {
        $disk = Storage::disk('local');
        $relativeDir = 'backups/'.now()->format('Y/m');
        $disk->makeDirectory($relativeDir);

        $filename = 'skuggle-'.now()->format('Ymd-His').'-'.Str::lower(Str::random(6)).'.sql.gz';
        $relativePath = $relativeDir.'/'.$filename;
        $absolutePath = $disk->path($relativePath);

        $started = now();
        $bytes = 0;
        $message = 'Database dump completed.';

        try {
            $bytes = $this->writeDump($absolutePath);
        } catch (Throwable $e) {
            $snapshot = PlatformBackupSnapshot::query()->create([
                'label' => 'Failed snapshot '.$started->format('Y-m-d H:i'),
                'status' => 'failed',
                'trigger' => $trigger,
                'size_bytes' => null,
                'storage_path' => $relativePath,
                'checksum' => null,
                'requested_by' => $requestedBy?->getKey(),
                'started_at' => $started,
                'completed_at' => now(),
                'message' => $e->getMessage(),
                'metadata' => ['driver' => config('database.default')],
            ]);

            throw $e;
        }

        $checksum = is_file($absolutePath) ? hash_file('sha256', $absolutePath) : hash('sha256', $relativePath);

        $snapshot = PlatformBackupSnapshot::query()->create([
            'label' => 'Database snapshot '.$started->format('Y-m-d H:i'),
            'status' => 'completed',
            'trigger' => $trigger,
            'size_bytes' => $bytes,
            'storage_path' => $relativePath,
            'checksum' => $checksum,
            'requested_by' => $requestedBy?->getKey(),
            'started_at' => $started,
            'completed_at' => now(),
            'message' => $message,
            'metadata' => [
                'driver' => config('database.default'),
                'estimated' => false,
            ],
        ]);

        return [
            'snapshot' => $snapshot,
            'path' => $relativePath,
            'bytes' => $bytes,
        ];
    }

    private function writeDump(string $absolutePath): int
    {
        $driver = (string) config('database.default');

        if ($driver === 'sqlite') {
            return $this->writeSqliteCopy($absolutePath);
        }

        if ($driver !== 'mysql' && $driver !== 'mariadb') {
            throw new RuntimeException("Automated dumps are not supported for driver [{$driver}].");
        }

        $connection = config("database.connections.{$driver}");
        $tmpSql = $absolutePath.'.tmp.sql';

        $result = Process::timeout(900)
            ->env(['MYSQL_PWD' => (string) ($connection['password'] ?? '')])
            ->run([
                'mysqldump',
                '--host='.(string) ($connection['host'] ?? '127.0.0.1'),
                '--port='.(string) ($connection['port'] ?? 3306),
                '--user='.(string) ($connection['username'] ?? ''),
                '--single-transaction',
                '--quick',
                '--routines',
                '--triggers',
                '--default-character-set=utf8mb4',
                (string) ($connection['database'] ?? ''),
            ]);

        if ($result->failed()) {
            throw new RuntimeException('mysqldump failed: '.trim($result->errorOutput() ?: $result->output()));
        }

        file_put_contents($tmpSql, $result->output());
        $gz = gzopen($absolutePath, 'wb9');
        if ($gz === false) {
            @unlink($tmpSql);
            throw new RuntimeException('Unable to open gzip target for database dump.');
        }

        $handle = fopen($tmpSql, 'rb');
        if ($handle === false) {
            gzclose($gz);
            @unlink($tmpSql);
            throw new RuntimeException('Unable to read temporary SQL dump.');
        }

        while (! feof($handle)) {
            $chunk = fread($handle, 1024 * 1024);
            if ($chunk === false) {
                break;
            }
            gzwrite($gz, $chunk);
        }

        fclose($handle);
        gzclose($gz);
        @unlink($tmpSql);

        clearstatcache(true, $absolutePath);

        return (int) (filesize($absolutePath) ?: 0);
    }

    private function writeSqliteCopy(string $absolutePath): int
    {
        $database = (string) config('database.connections.sqlite.database');

        // In-memory SQLite (tests) has no file — export schema+data as SQL text.
        if ($database === ':memory:' || $database === '' || ! is_file($database)) {
            $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
            $sql = "-- Skuggle sqlite logical dump\n";
            foreach ($tables as $table) {
                $name = $table->name;
                $create = DB::selectOne("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?", [$name]);
                if ($create?->sql) {
                    $sql .= $create->sql.";\n";
                }
                $rows = DB::table($name)->get();
                foreach ($rows as $row) {
                    $payload = (array) $row;
                    $columns = implode(', ', array_map(fn ($col) => '"'.$col.'"', array_keys($payload)));
                    $values = implode(', ', array_map(function ($value) {
                        if ($value === null) {
                            return 'NULL';
                        }
                        if (is_numeric($value)) {
                            return (string) $value;
                        }

                        return "'".str_replace("'", "''", (string) $value)."'";
                    }, array_values($payload)));
                    $sql .= "INSERT INTO \"{$name}\" ({$columns}) VALUES ({$values});\n";
                }
            }

            $gz = gzopen($absolutePath, 'wb9');
            if ($gz === false) {
                throw new RuntimeException('Unable to open gzip target for SQLite dump.');
            }
            gzwrite($gz, $sql);
            gzclose($gz);
            clearstatcache(true, $absolutePath);

            return (int) (filesize($absolutePath) ?: 0);
        }

        $gz = gzopen($absolutePath, 'wb9');
        if ($gz === false) {
            throw new RuntimeException('Unable to open gzip target for SQLite dump.');
        }

        $handle = fopen($database, 'rb');
        if ($handle === false) {
            gzclose($gz);
            throw new RuntimeException('Unable to read SQLite database file.');
        }

        while (! feof($handle)) {
            $chunk = fread($handle, 1024 * 1024);
            if ($chunk === false) {
                break;
            }
            gzwrite($gz, $chunk);
        }

        fclose($handle);
        gzclose($gz);
        clearstatcache(true, $absolutePath);

        return (int) (filesize($absolutePath) ?: 0);
    }

    public function latestCompletedAt(): ?string
    {
        return PlatformBackupSnapshot::query()
            ->where('status', 'completed')
            ->latest('completed_at')
            ->value('completed_at')
            ?->toIso8601String();
    }

    public function estimateBytes(): int
    {
        try {
            $driver = DB::connection()->getDriverName();
            if ($driver === 'mysql') {
                $database = (string) DB::connection()->getDatabaseName();
                $row = DB::selectOne(
                    'select coalesce(sum(data_length + index_length), 0) as bytes from information_schema.tables where table_schema = ?',
                    [$database],
                );

                return (int) ($row->bytes ?? 0);
            }
        } catch (Throwable) {
        }

        return 0;
    }
}
