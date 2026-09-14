<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_types', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code', 40);
            $table->string('name', 120);
            $table->decimal('default_maximum_score', 8, 2)->default(20);
            $table->decimal('default_weight', 8, 2)->default(10);
            $table->json('allowed_delivery')->nullable();
            $table->boolean('moderation_required')->default(true);
            $table->boolean('resit_allowed')->default(false);
            $table->boolean('result_contribution')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('position')->default(1);
            $table->timestamps();
            $table->unique(['tenant_id', 'code']);
        });

        Schema::create('assessment_sections', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->string('title', 180);
            $table->unsignedInteger('position')->default(1);
            $table->unsignedInteger('optional_count')->nullable();
            $table->decimal('maximum_marks', 8, 2)->nullable();
            $table->text('instructions')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'assessment_id']);
        });

        Schema::create('assessment_score_adjustments', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('score_id')->nullable()->constrained('assessment_scores')->nullOnDelete();
            $table->decimal('previous_score', 8, 2)->nullable();
            $table->decimal('new_score', 8, 2)->nullable();
            $table->string('previous_status', 24)->nullable();
            $table->string('new_status', 24)->nullable();
            $table->string('reason', 500)->nullable();
            $table->string('correlation_id', 64)->nullable();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['tenant_id', 'assessment_id']);
        });

        Schema::create('assessment_rubric_scores', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->nullable()->constrained('assessment_questions')->nullOnDelete();
            $table->string('criterion', 180);
            $table->decimal('score', 8, 2);
            $table->decimal('maximum', 8, 2);
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'assessment_id', 'student_id'], 'ars_tenant_assessment_student_idx');
        });

        Schema::create('assessment_templates', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title', 180);
            $table->string('type', 40)->nullable();
            $table->json('payload');
            $table->timestamps();
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('smartmark_detections', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sheet_id')->constrained('smartmark_sheets')->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('expected', 8)->nullable();
            $table->string('detected', 8)->nullable();
            $table->decimal('confidence', 5, 2)->nullable();
            $table->decimal('marks', 8, 2)->default(0);
            $table->string('teacher_decision', 24)->nullable();
            $table->timestamps();
            $table->unique(['sheet_id', 'position']);
        });

        Schema::table('assessments', function (Blueprint $table): void {
            $table->decimal('weight', 8, 2)->nullable()->after('maximum_score');
            $table->text('description')->nullable()->after('title');
            $table->text('instructions')->nullable()->after('description');
            $table->string('delivery', 24)->nullable()->after('type');
            $table->string('code', 80)->nullable()->after('delivery');
            $table->string('participant_mode', 24)->nullable()->after('code');
            $table->string('content_mode', 24)->nullable()->after('participant_mode');
            $table->decimal('pass_threshold', 8, 2)->nullable()->after('weight');
            $table->string('late_policy', 24)->nullable();
            $table->boolean('random_questions')->default(false);
            $table->boolean('random_options')->default(false);
            $table->unsignedTinyInteger('attempt_limit')->default(1);
            $table->string('resume_policy', 24)->nullable();
            $table->string('feedback_policy', 24)->nullable();
            $table->boolean('navigation_restricted')->default(false);
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('locked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('responsible_teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('assessment_templates')->nullOnDelete();
        });

        Schema::table('assessment_questions', function (Blueprint $table): void {
            $table->foreignId('section_id')->nullable()->after('assessment_id')->constrained('assessment_sections')->nullOnDelete();
            $table->string('learning_objective')->nullable()->after('learning_outcome');
            $table->string('source', 80)->nullable();
            $table->string('image_key')->nullable();
        });

        Schema::table('assessment_bank_questions', function (Blueprint $table): void {
            $table->string('learning_objective')->nullable();
            $table->string('source', 80)->nullable();
            $table->string('class_level', 80)->nullable();
            $table->string('image_key')->nullable();
        });

        Schema::table('assessment_submissions', function (Blueprint $table): void {
            $table->unsignedInteger('attempt_number')->default(1);
            $table->unsignedInteger('time_spent_seconds')->nullable();
            $table->string('answer_fingerprint', 64)->nullable();
            $table->json('shuffle_map')->nullable();
        });

        Schema::table('smartmark_sheets', function (Blueprint $table): void {
            $table->unsignedInteger('page_number')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('smartmark_sheets', function (Blueprint $table): void {
            $table->dropColumn('page_number');
        });
        Schema::table('assessment_submissions', function (Blueprint $table): void {
            $table->dropColumn(['attempt_number', 'time_spent_seconds', 'answer_fingerprint', 'shuffle_map']);
        });
        Schema::table('assessment_bank_questions', function (Blueprint $table): void {
            $table->dropColumn(['learning_objective', 'source', 'class_level', 'image_key']);
        });
        Schema::table('assessment_questions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('section_id');
            $table->dropColumn(['learning_objective', 'source', 'image_key']);
        });
        Schema::table('assessments', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('locked_by');
            $table->dropConstrainedForeignId('responsible_teacher_id');
            $table->dropConstrainedForeignId('template_id');
            $table->dropColumn([
                'weight', 'description', 'instructions', 'delivery', 'code', 'participant_mode', 'content_mode',
                'pass_threshold', 'late_policy', 'random_questions', 'random_options', 'attempt_limit',
                'resume_policy', 'feedback_policy', 'navigation_restricted', 'duration_minutes',
                'starts_at', 'ends_at', 'locked_at',
            ]);
        });
        Schema::dropIfExists('smartmark_detections');
        Schema::dropIfExists('assessment_templates');
        Schema::dropIfExists('assessment_rubric_scores');
        Schema::dropIfExists('assessment_score_adjustments');
        Schema::dropIfExists('assessment_sections');
        Schema::dropIfExists('assessment_types');
    }
};
