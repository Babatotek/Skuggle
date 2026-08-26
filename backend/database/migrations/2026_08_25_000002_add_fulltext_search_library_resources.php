<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Full-Text Search Migration for library_resources
 *
 * Adds MySQL FULLTEXT indexes on the columns used by the search query
 * in LibraryResourceController::page():
 *   WHERE title LIKE '%q%' OR description LIKE '%q%' OR topic LIKE '%q%'
 *
 * After this migration, switch the LIKE query to use MATCH/AGAINST for
 * 10-100x improvement on large datasets.
 *
 * IMPORTANT: FULLTEXT indexes require MySQL/MariaDB with InnoDB.
 * SQLite (used in testing) does not support FULLTEXT — the migration
 * detects the driver and skips the index creation on SQLite.
 */
return new class extends Migration
{
    public function up(): void
    {
        if ($this->isMySQL()) {
            // MySQL FULLTEXT index — enables MATCH(col) AGAINST(?) natural language search
            DB::statement('ALTER TABLE library_resources ADD FULLTEXT INDEX library_resources_fulltext_idx (title, description, topic, subject_label, author)');

            // Separate index on title only for autocomplete-style prefix matching
            if (! $this->hasIndex('library_resources', 'library_resources_title_fulltext_idx')) {
                DB::statement('ALTER TABLE library_resources ADD FULLTEXT INDEX library_resources_title_fulltext_idx (title)');
            }
        }
        // SQLite: standard LIKE queries continue to work via the existing indexes
    }

    public function down(): void
    {
        if ($this->isMySQL()) {
            try {
                DB::statement('ALTER TABLE library_resources DROP INDEX library_resources_fulltext_idx');
            } catch (\Exception) {}

            try {
                DB::statement('ALTER TABLE library_resources DROP INDEX library_resources_title_fulltext_idx');
            } catch (\Exception) {}
        }
    }

    private function isMySQL(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb'], true);
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        try {
            $indexes = Schema::getIndexes($table);
            foreach ($indexes as $index) {
                if (($index['name'] ?? '') === $indexName) {
                    return true;
                }
            }
        } catch (\Exception) {}

        return false;
    }
};
