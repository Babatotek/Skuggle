<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Index Migration
 *
 * Adds covering and composite indexes identified during production-readiness
 * audit as missing from the original schema.  Each index is annotated with
 * the query pattern it supports.
 *
 * All additions are additive — no existing indexes are removed.
 * All operations are wrapped in existence checks so re-running is safe.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ----------------------------------------------------------------
        // students
        // ----------------------------------------------------------------
        Schema::table('students', function (Blueprint $table): void {
            // SyncController: WHERE updated_at > $since ORDER BY updated_at LIMIT 500
            if (! $this->hasIndex('students', 'students_tenant_updated_at_idx')) {
                $table->index(['tenant_id', 'updated_at'], 'students_tenant_updated_at_idx');
            }
            // EnforceTenantQuota: COUNT(*) WHERE tenant_id = ? AND status = 'active'
            if (! $this->hasIndex('students', 'students_tenant_status_idx')) {
                $table->index(['tenant_id', 'status', 'deleted_at'], 'students_tenant_status_idx');
            }
        });

        // ----------------------------------------------------------------
        // library_resources — filtering indexes
        // (Full-text index added separately in P2.1 migration — requires
        //  MyISAM or InnoDB FULLTEXT support, not available in SQLite tests)
        // ----------------------------------------------------------------
        Schema::table('library_resources', function (Blueprint $table): void {
            // Browsing: WHERE tenant_id = ? AND educational_level = ?
            if (! $this->hasIndex('library_resources', 'library_res_level_idx')) {
                $table->index(['tenant_id', 'educational_level', 'status'], 'library_res_level_idx');
            }
            // Browsing: WHERE tenant_id = ? AND class_name = ?
            if (! $this->hasIndex('library_resources', 'library_res_class_idx')) {
                $table->index(['tenant_id', 'class_name', 'status'], 'library_res_class_idx');
            }
            // Homepage: ORDER BY published_at DESC per tenant
            if (! $this->hasIndex('library_resources', 'library_res_published_idx')) {
                $table->index(['tenant_id', 'published_at', 'status'], 'library_res_published_idx');
            }
            // School-approved recommendations
            if (! $this->hasIndex('library_resources', 'library_res_approved_idx')) {
                $table->index(['tenant_id', 'school_approved', 'status'], 'library_res_approved_idx');
            }
        });

        // ----------------------------------------------------------------
        // attendance_records
        // ----------------------------------------------------------------
        Schema::table('attendance_records', function (Blueprint $table): void {
            // Term attendance summary reports
            if (! $this->hasIndex('attendance_records', 'attendance_term_status_idx')) {
                $table->index(['tenant_id', 'term_id', 'status'], 'attendance_term_status_idx');
            }
            // SyncController delta sync
            if (! $this->hasIndex('attendance_records', 'attendance_tenant_updated_idx')) {
                $table->index(['tenant_id', 'updated_at'], 'attendance_tenant_updated_idx');
            }
        });

        // ----------------------------------------------------------------
        // assessments
        // ----------------------------------------------------------------
        Schema::table('assessments', function (Blueprint $table): void {
            // Results page: WHERE class_id = ? AND subject_id = ? AND term_id = ?
            if (! $this->hasIndex('assessments', 'assessments_class_subject_term_idx')) {
                $table->index(['tenant_id', 'class_id', 'subject_id', 'term_id'], 'assessments_class_subject_term_idx');
            }
            // SyncController delta sync
            if (! $this->hasIndex('assessments', 'assessments_tenant_updated_idx')) {
                $table->index(['tenant_id', 'updated_at'], 'assessments_tenant_updated_idx');
            }
        });

        // ----------------------------------------------------------------
        // assessment_scores
        // ----------------------------------------------------------------
        Schema::table('assessment_scores', function (Blueprint $table): void {
            // SyncController: WHERE updated_at > $since per tenant
            if (! $this->hasIndex('assessment_scores', 'scores_tenant_updated_idx')) {
                $table->index(['tenant_id', 'updated_at'], 'scores_tenant_updated_idx');
            }
        });

        // ----------------------------------------------------------------
        // ai_requests
        // ----------------------------------------------------------------
        Schema::table('ai_requests', function (Blueprint $table): void {
            // EnforceTenantQuota: COUNT(*) WHERE tenant_id=? AND user_id=? AND DATE(created_at)=today
            if (! $this->hasIndex('ai_requests', 'ai_requests_user_date_idx')) {
                $table->index(['tenant_id', 'user_id', 'created_at'], 'ai_requests_user_date_idx');
            }
        });

        // ----------------------------------------------------------------
        // result_publications
        // ----------------------------------------------------------------
        Schema::table('result_publications', function (Blueprint $table): void {
            // PublicResultController: WHERE tenant=? AND student=? AND term=? AND status='published'
            if (! $this->hasIndex('result_publications', 'result_pub_student_term_status_idx')) {
                $table->index(['tenant_id', 'student_id', 'term_id', 'status'], 'result_pub_student_term_status_idx');
            }
        });

        // ----------------------------------------------------------------
        // library_progress
        // ----------------------------------------------------------------
        Schema::table('library_progress', function (Blueprint $table): void {
            // Home page: most recent progress for a user (cross-resource)
            if (! $this->hasIndex('library_progress', 'library_progress_user_updated_idx')) {
                $table->index(['user_id', 'updated_at'], 'library_progress_user_updated_idx');
            }
        });

        // ----------------------------------------------------------------
        // audit_logs
        // ----------------------------------------------------------------
        Schema::table('audit_logs', function (Blueprint $table): void {
            // Admin: activity feed per user
            if (! $this->hasIndex('audit_logs', 'audit_actor_occurred_idx')) {
                $table->index(['actor_id', 'occurred_at'], 'audit_actor_occurred_idx');
            }
        });

        // ----------------------------------------------------------------
        // outbox_events
        // ----------------------------------------------------------------
        Schema::table('outbox_events', function (Blueprint $table): void {
            // Reliable delivery: unprocessed events by type
            if (! $this->hasIndex('outbox_events', 'outbox_type_processed_idx')) {
                $table->index(['event_type', 'processed_at', 'available_at'], 'outbox_type_processed_idx');
            }
        });

        // ----------------------------------------------------------------
        // personal_access_tokens
        // ----------------------------------------------------------------
        Schema::table('personal_access_tokens', function (Blueprint $table): void {
            // Session cleanup: oldest tokens per user
            if (! $this->hasIndex('personal_access_tokens', 'pat_tokenable_last_used_idx')) {
                $table->index(['tokenable_type', 'tokenable_id', 'last_used_at'], 'pat_tokenable_last_used_idx');
            }
        });
    }

    public function down(): void
    {
        // Note: indexes that back a foreign key constraint (e.g. user_id on
        // library_progress) cannot be dropped independently on MySQL — they are
        // removed automatically when the FK or table is dropped.  Only drop
        // indexes that are purely performance-oriented here.
        $safeDrops = [
            'students' => ['students_tenant_updated_at_idx', 'students_tenant_status_idx'],
            'library_resources' => ['library_res_level_idx', 'library_res_class_idx', 'library_res_published_idx', 'library_res_approved_idx'],
            'attendance_records' => ['attendance_term_status_idx', 'attendance_tenant_updated_idx'],
            'assessments' => ['assessments_class_subject_term_idx', 'assessments_tenant_updated_idx'],
            'assessment_scores' => ['scores_tenant_updated_idx'],
            'ai_requests' => ['ai_requests_user_date_idx'],
            'result_publications' => ['result_pub_student_term_status_idx'],
            'audit_logs' => ['audit_actor_occurred_idx'],
            'outbox_events' => ['outbox_type_processed_idx'],
            'personal_access_tokens' => ['pat_tokenable_last_used_idx'],
            // library_progress.library_progress_user_updated_idx omitted:
            //   user_id is a FK column — MySQL prohibits dropping the index
            //   that backs a foreign key constraint independently.
        ];

        foreach ($safeDrops as $table => $indexes) {
            Schema::table($table, function (Blueprint $blueprint) use ($indexes): void {
                foreach ($indexes as $index) {
                    try {
                        $blueprint->dropIndex($index);
                    } catch (Exception) {
                        // Already removed or FK-backed — skip safely
                    }
                }
            });
        }
    }

    /**
     * Check whether a named index already exists on a table.
     * Uses the schema builder so it works across MySQL, PostgreSQL, and SQLite.
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        try {
            $indexes = Schema::getIndexes($table);
            foreach ($indexes as $index) {
                if (($index['name'] ?? '') === $indexName) {
                    return true;
                }
            }
        } catch (Exception) {
            // Table doesn't exist yet — safe to proceed
        }

        return false;
    }
};
