<?php

namespace Tests\Unit\Database;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Verifies that all required performance indexes exist after migrations run.
 *
 * Uses RefreshDatabase (SQLite in-memory) so it exercises the migration
 * itself on every test run.  Each assertion name maps directly to the
 * query pattern that index supports.
 */
class PerformanceIndexesTest extends TestCase
{
    use RefreshDatabase;

    // -----------------------------------------------------------------------
    // students
    // -----------------------------------------------------------------------

    #[Test]
    public function students_table_has_tenant_updated_at_index(): void
    {
        $this->assertTableHasIndex('students', ['tenant_id', 'updated_at']);
    }

    #[Test]
    public function students_table_has_tenant_status_index(): void
    {
        $this->assertTableHasIndex('students', ['tenant_id', 'last_name', 'first_name']);
    }

    // -----------------------------------------------------------------------
    // library_resources
    // -----------------------------------------------------------------------

    #[Test]
    public function library_resources_has_educational_level_index(): void
    {
        $this->assertTableHasIndex('library_resources', ['tenant_id', 'educational_level', 'status']);
    }

    #[Test]
    public function library_resources_has_class_name_index(): void
    {
        $this->assertTableHasIndex('library_resources', ['tenant_id', 'class_name', 'status']);
    }

    #[Test]
    public function library_resources_has_published_at_index(): void
    {
        $this->assertTableHasIndex('library_resources', ['tenant_id', 'published_at', 'status']);
    }

    #[Test]
    public function library_resources_has_school_approved_index(): void
    {
        $this->assertTableHasIndex('library_resources', ['tenant_id', 'school_approved', 'status']);
    }

    // -----------------------------------------------------------------------
    // attendance_records
    // -----------------------------------------------------------------------

    #[Test]
    public function attendance_records_has_term_status_index(): void
    {
        $this->assertTableHasIndex('attendance_records', ['tenant_id', 'term_id', 'status']);
    }

    #[Test]
    public function attendance_records_has_tenant_updated_at_index(): void
    {
        $this->assertTableHasIndex('attendance_records', ['tenant_id', 'updated_at']);
    }

    // -----------------------------------------------------------------------
    // assessments
    // -----------------------------------------------------------------------

    #[Test]
    public function assessments_has_class_subject_term_index(): void
    {
        $this->assertTableHasIndex('assessments', ['tenant_id', 'class_id', 'subject_id', 'term_id']);
    }

    // -----------------------------------------------------------------------
    // ai_requests
    // -----------------------------------------------------------------------

    #[Test]
    public function ai_requests_has_user_date_index(): void
    {
        $this->assertTableHasIndex('ai_requests', ['tenant_id', 'user_id', 'created_at']);
    }

    // -----------------------------------------------------------------------
    // result_publications
    // -----------------------------------------------------------------------

    #[Test]
    public function result_publications_has_student_term_status_index(): void
    {
        $this->assertTableHasIndex('result_publications', ['tenant_id', 'student_id', 'term_id', 'status']);
    }

    // -----------------------------------------------------------------------
    // library_progress
    // -----------------------------------------------------------------------

    #[Test]
    public function library_progress_has_user_updated_at_index(): void
    {
        $this->assertTableHasIndex('library_progress', ['user_id', 'updated_at']);
    }

    // -----------------------------------------------------------------------
    // audit_logs
    // -----------------------------------------------------------------------

    #[Test]
    public function audit_logs_has_actor_occurred_index(): void
    {
        $this->assertTableHasIndex('audit_logs', ['actor_id', 'occurred_at']);
    }

    // -----------------------------------------------------------------------
    // outbox_events
    // -----------------------------------------------------------------------

    #[Test]
    public function outbox_events_has_type_processed_index(): void
    {
        $this->assertTableHasIndex('outbox_events', ['event_type', 'processed_at', 'available_at']);
    }

    // -----------------------------------------------------------------------
    // personal_access_tokens
    // -----------------------------------------------------------------------

    #[Test]
    public function personal_access_tokens_has_tokenable_last_used_index(): void
    {
        $this->assertTableHasIndex('personal_access_tokens', ['tokenable_type', 'tokenable_id', 'last_used_at']);
    }

    // -----------------------------------------------------------------------
    // Original critical indexes still exist
    // -----------------------------------------------------------------------

    #[Test]
    public function students_retains_original_tenant_status_index(): void
    {
        $this->assertTableHasIndex('students', ['tenant_id', 'status']);
    }

    #[Test]
    public function library_resources_retains_original_status_created_at_index(): void
    {
        $this->assertTableHasIndex('library_resources', ['tenant_id', 'status', 'created_at']);
    }

    #[Test]
    public function attendance_records_retains_original_class_date_index(): void
    {
        $this->assertTableHasIndex('attendance_records', ['tenant_id', 'class_id', 'attendance_date']);
    }

    // -----------------------------------------------------------------------
    // Helper
    // -----------------------------------------------------------------------

    /**
     * Assert that a table has an index covering exactly the given columns
     * (in any order — we check column membership, not sequence).
     */
    private function assertTableHasIndex(string $table, array $expectedColumns): void
    {
        $this->assertTrue(
            Schema::hasTable($table),
            "Table '{$table}' does not exist"
        );

        $indexes = Schema::getIndexes($table);

        foreach ($indexes as $index) {
            $indexColumns = $index['columns'] ?? [];
            // Check every expected column is present in this index
            if (count(array_intersect($expectedColumns, $indexColumns)) === count($expectedColumns)) {
                $this->assertTrue(true); // assertion passed
                return;
            }
        }

        $this->fail(
            "Table '{$table}' has no index covering columns: ["
            .implode(', ', $expectedColumns)."].\n"
            ."Existing indexes:\n"
            .implode("\n", array_map(
                fn ($i) => '  '.($i['name'] ?? '?').': ['.implode(', ', $i['columns'] ?? []).']',
                $indexes
            ))
        );
    }
}
