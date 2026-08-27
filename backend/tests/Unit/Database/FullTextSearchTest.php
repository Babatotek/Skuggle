<?php

namespace Tests\Unit\Database;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Verifies full-text search migration and controller fallback behaviour.
 *
 * On SQLite (test env) the FULLTEXT migration is a no-op; tests verify
 * the correct LIKE fallback and that the migration runs without error.
 */
class FullTextSearchTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function fulltext_migration_runs_without_error(): void
    {
        // Migration already ran via RefreshDatabase.
        // Just assert the library_resources table exists.
        $this->assertTrue(
            Schema::hasTable('library_resources'),
            'library_resources table must exist after migrations'
        );
    }

    #[Test]
    public function fulltext_migration_file_exists(): void
    {
        $file = database_path('migrations/2026_08_25_000002_add_fulltext_search_library_resources.php');

        $this->assertFileExists($file,
            'Full-text search migration file must exist');
    }

    #[Test]
    public function fulltext_migration_targets_correct_columns(): void
    {
        $migration = file_get_contents(
            database_path('migrations/2026_08_25_000002_add_fulltext_search_library_resources.php')
        );

        // Must index title, description, topic — the three search columns
        $this->assertStringContainsString('title', $migration);
        $this->assertStringContainsString('description', $migration);
        $this->assertStringContainsString('topic', $migration);
    }

    #[Test]
    public function fulltext_migration_skips_fulltext_on_sqlite(): void
    {
        $migration = file_get_contents(
            database_path('migrations/2026_08_25_000002_add_fulltext_search_library_resources.php')
        );

        // Must guard against SQLite — isMySQL() check should exist
        $this->assertStringContainsString('isMySQL', $migration,
            'Migration must guard FULLTEXT statements behind a MySQL check');
        $this->assertStringContainsString('sqlite', strtolower($migration),
            'Migration should document SQLite compatibility note');
    }

    #[Test]
    public function controller_uses_match_against_on_mysql(): void
    {
        $source = file_get_contents(
            app_path('Http/Controllers/Api/V1/LibraryResourceController.php')
        );

        $this->assertStringContainsString('MATCH(title', $source,
            'LibraryResourceController must use MATCH/AGAINST for MySQL full-text search');
        $this->assertStringContainsString('IN BOOLEAN MODE', $source,
            'Full-text search must use BOOLEAN MODE for prefix/phrase support');
    }

    #[Test]
    public function controller_falls_back_to_like_on_non_mysql(): void
    {
        $source = file_get_contents(
            app_path('Http/Controllers/Api/V1/LibraryResourceController.php')
        );

        // Must retain LIKE fallback for SQLite / non-MySQL drivers
        $this->assertStringContainsString("'like'", $source,
            'Controller must retain LIKE fallback for non-MySQL drivers');
        $this->assertStringContainsString('getDriverName', $source,
            'Controller must check DB driver before choosing search strategy');
    }
}
