<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('term_id')->constrained()->cascadeOnDelete();
            $table->date('attendance_date');
            $table->string('status', 16);
            $table->unsignedBigInteger('revision')->default(1);
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'student_id', 'class_id', 'attendance_date'], 'attendance_record_unique');
            $table->index(['tenant_id', 'class_id', 'attendance_date']);
            $table->index(['tenant_id', 'student_id', 'attendance_date']);
        });

        Schema::create('assessments', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('term_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title', 180);
            $table->string('type', 32);
            $table->decimal('maximum_score', 8, 2);
            $table->string('status', 24)->default('draft');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('revision')->default(1);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'class_id', 'term_id']);
            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('assessment_questions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->string('question_type', 32);
            $table->longText('prompt');
            $table->json('options')->nullable();
            $table->text('correct_answer')->nullable();
            $table->text('rationale')->nullable();
            $table->string('learning_outcome')->nullable();
            $table->decimal('marks', 8, 2)->default(1);
            $table->unsignedInteger('position');
            $table->timestamps();
            $table->unique(['assessment_id', 'position']);
            $table->index(['tenant_id', 'assessment_id']);
        });

        Schema::create('assessment_scores', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 8, 2)->nullable();
            $table->string('status', 24)->default('draft');
            $table->unsignedBigInteger('revision')->default(1);
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'assessment_id', 'student_id']);
            $table->index(['tenant_id', 'student_id', 'created_at']);
        });

        Schema::create('result_publications', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('term_id')->constrained()->cascadeOnDelete();
            $table->string('status', 24)->default('draft');
            $table->unsignedBigInteger('revision')->default(1);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'student_id', 'academic_session_id', 'term_id'], 'result_publication_unique');
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('result_pins', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('result_publication_id')->constrained()->cascadeOnDelete();
            $table->string('pin_hash', 255);
            $table->unsignedSmallInteger('usage_limit')->default(5);
            $table->unsignedSmallInteger('usage_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        foreach (['result_pins', 'result_publications', 'assessment_scores', 'assessment_questions', 'assessments', 'attendance_records'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
