<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_resources', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 180);
            $table->string('title', 220);
            $table->text('description')->nullable();
            $table->string('author', 180)->nullable();
            $table->string('publisher', 180)->nullable();
            $table->string('resource_type', 40);
            $table->string('educational_level', 80)->nullable();
            $table->string('class_name', 100)->nullable();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject_label', 120)->nullable();
            $table->string('term_label', 80)->nullable();
            $table->string('topic', 180)->nullable();
            $table->unsignedSmallInteger('estimated_study_minutes')->nullable();
            $table->string('access_tier', 24)->default('free');
            $table->string('source_label', 180);
            $table->string('cover_image_key')->nullable();
            $table->string('storage_key')->nullable();
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('licence_name', 120)->default('All rights reserved');
            $table->string('copyright_owner')->nullable();
            $table->text('usage_note')->nullable();
            $table->json('learning_objectives')->nullable();
            $table->json('table_of_contents')->nullable();
            $table->longText('sections')->nullable();
            $table->string('content_version', 40)->default('1.0');
            $table->boolean('school_approved')->default(false);
            $table->boolean('is_public')->default(false);
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 24)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'created_at']);
            $table->index(['tenant_id', 'subject_id', 'resource_type']);
            $table->index(['is_public', 'status', 'published_at']);
        });

        Schema::create('library_resource_versions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('library_resource_id')->constrained()->cascadeOnDelete();
            $table->string('version', 40);
            $table->longText('snapshot');
            $table->string('change_summary', 500);
            $table->boolean('is_current')->default(false);
            $table->string('restored_from_version', 40)->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'library_resource_id', 'version'], 'library_resource_version_unique');
            $table->index(['tenant_id', 'library_resource_id', 'is_current'], 'library_versions_current_idx');
        });

        Schema::create('library_annotations', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('library_resource_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->string('section_id', 120)->nullable();
            $table->text('body');
            $table->string('colour', 16)->default('yellow');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'library_resource_id', 'created_at'], 'library_annotations_lookup_idx');
        });

        Schema::create('library_bookmarks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('library_resource_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['tenant_id', 'user_id', 'library_resource_id'], 'library_bookmarks_unique');
        });

        Schema::create('library_progress', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('library_resource_id')->constrained()->cascadeOnDelete();
            $table->string('section_id', 120)->nullable();
            $table->string('content_version', 40);
            $table->decimal('progress_percent', 5, 2)->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'user_id', 'library_resource_id'], 'library_progress_unique');
            $table->index(['tenant_id', 'user_id', 'updated_at'], 'library_progress_user_idx');
        });

        Schema::create('library_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('library_resource_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 32);
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->index(['tenant_id', 'library_resource_id', 'event_type', 'occurred_at'], 'library_usage_lookup');
            $table->index(['tenant_id', 'user_id', 'occurred_at']);
        });

        Schema::create('library_assignments', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('library_resource_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->json('student_ids')->nullable();
            $table->string('activity', 32);
            $table->string('reading_range')->nullable();
            $table->timestamp('deadline');
            $table->text('note')->nullable();
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['tenant_id', 'class_id', 'deadline']);
        });

        Schema::create('document_uploads', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('purpose', 40);
            $table->string('original_name');
            $table->string('storage_key');
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('file_size');
            $table->string('sha256', 64);
            $table->string('scan_status', 24);
            $table->longText('extracted_text')->nullable();
            $table->longText('outcomes')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->index(['tenant_id', 'user_id', 'expires_at']);
            $table->index(['sha256', 'scan_status']);
        });

        Schema::create('generated_quizzes', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_upload_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title', 220);
            $table->string('subject', 120)->nullable();
            $table->string('class_name', 100)->nullable();
            $table->json('learning_outcomes');
            $table->longText('questions');
            $table->string('status', 24)->default('draft');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'created_by', 'status']);
        });

        Schema::create('export_jobs', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->string('type', 40)->default('library_batch_pdf');
            $table->string('title', 220);
            $table->json('resource_ids');
            $table->boolean('include_cover_page')->default(true);
            $table->string('state', 24)->default('queued');
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->string('message')->nullable();
            $table->string('storage_key')->nullable();
            $table->string('filename')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'requested_by', 'created_at']);
            $table->index(['state', 'created_at']);
        });
    }

    public function down(): void
    {
        foreach (['export_jobs', 'generated_quizzes', 'document_uploads', 'library_assignments', 'library_events', 'library_progress', 'library_bookmarks', 'library_annotations', 'library_resource_versions', 'library_resources'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
