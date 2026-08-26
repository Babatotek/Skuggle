<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('code', 64)->unique();
            $table->string('name', 120);
            $table->unsignedBigInteger('price_minor')->default(0);
            $table->char('currency', 3)->default('NGN');
            $table->string('billing_interval', 24)->default('monthly');
            $table->json('limits');
            $table->json('features');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->restrictOnDelete();
            $table->string('provider', 40)->nullable();
            $table->string('provider_reference', 160)->nullable();
            $table->string('status', 32);
            $table->timestamp('starts_at');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
            $table->unique(['provider', 'provider_reference']);
        });

        Schema::create('tenant_sequences', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->unsignedBigInteger('next_value')->default(1);
            $table->timestamps();
            $table->unique(['tenant_id', 'name']);
        });

        Schema::create('class_sections', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->string('name', 80);
            $table->unsignedInteger('capacity')->nullable();
            $table->string('status', 24)->default('active');
            $table->timestamps();
            $table->unique(['tenant_id', 'class_id', 'name']);
        });

        Schema::create('curricula', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 180);
            $table->string('authority', 120)->nullable();
            $table->string('version', 40);
            $table->json('metadata')->nullable();
            $table->string('status', 24)->default('active');
            $table->timestamps();
            $table->unique(['tenant_id', 'name', 'version']);
        });

        Schema::create('subject_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('curriculum_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'subject_id', 'class_id', 'academic_session_id'], 'subject_assignment_unique');
        });

        Schema::create('student_documents', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('document_type', 80);
            $table->string('original_name');
            $table->string('storage_key');
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('file_size');
            $table->string('sha256', 64);
            $table->string('scan_status', 24);
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['tenant_id', 'student_id', 'document_type']);
        });

        Schema::create('student_medical_information', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->longText('conditions')->nullable();
            $table->longText('allergies')->nullable();
            $table->longText('medications')->nullable();
            $table->longText('emergency_notes')->nullable();
            $table->unsignedBigInteger('revision')->default(1);
            $table->foreignId('updated_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'student_id']);
        });

        Schema::create('departments', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('code', 32);
            $table->foreignId('head_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'code']);
        });

        Schema::create('employees', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('employee_number', 64);
            $table->string('name', 180);
            $table->string('employment_type', 48);
            $table->date('started_at')->nullable();
            $table->string('status', 24)->default('active');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'employee_number']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('teacher_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('registration_number')->nullable();
            $table->json('qualifications')->nullable();
            $table->json('specialisms')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'employee_id']);
        });

        Schema::create('attendance_sessions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('school_classes')->cascadeOnDelete();
            $table->date('attendance_date');
            $table->string('session_type', 32)->default('daily');
            $table->string('status', 24)->default('open');
            $table->unsignedBigInteger('revision')->default(1);
            $table->foreignId('opened_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'class_id', 'attendance_date', 'session_type'], 'attendance_session_unique');
        });

        Schema::create('attendance_devices', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('device_hash', 64);
            $table->string('status', 24)->default('pending');
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'device_hash']);
        });

        Schema::create('staff_attendance', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('attendance_date');
            $table->string('status', 24);
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('checked_out_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'employee_id', 'attendance_date']);
        });

        Schema::create('assessment_submissions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->longText('answers')->nullable();
            $table->string('status', 24)->default('draft');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedBigInteger('revision')->default(1);
            $table->timestamps();
            $table->unique(['tenant_id', 'assessment_id', 'student_id']);
        });

        Schema::create('grading_schemes', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->json('bands');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->unique(['tenant_id', 'name']);
        });

        Schema::create('report_cards', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('result_publication_id')->constrained()->cascadeOnDelete();
            $table->string('storage_key');
            $table->string('sha256', 64);
            $table->unsignedBigInteger('file_size');
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'result_publication_id']);
        });

        Schema::create('ai_generations', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ai_request_id')->constrained()->cascadeOnDelete();
            $table->string('output_type', 80);
            $table->longText('content');
            $table->string('content_hash', 64);
            $table->boolean('human_review_required')->default(true);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('lesson_plans', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->string('title', 220);
            $table->longText('content');
            $table->string('status', 24)->default('draft');
            $table->unsignedBigInteger('revision')->default(1);
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('curriculum_content', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('curriculum_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 220);
            $table->string('content_type', 48);
            $table->longText('content');
            $table->json('learning_outcomes')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'subject_id']);
        });

        Schema::create('question_banks', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('question_type', 32);
            $table->longText('prompt');
            $table->json('options')->nullable();
            $table->longText('answer')->nullable();
            $table->string('difficulty', 24)->nullable();
            $table->json('learning_outcomes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['tenant_id', 'subject_id', 'difficulty']);
        });

        Schema::create('marking_jobs', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_submission_id')->constrained()->cascadeOnDelete();
            $table->string('state', 24)->default('queued');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->text('error_code')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'state', 'created_at']);
        });

        Schema::create('marking_results', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('marking_job_id')->constrained()->cascadeOnDelete();
            $table->decimal('suggested_score', 8, 2)->nullable();
            $table->longText('feedback')->nullable();
            $table->json('rubric_breakdown')->nullable();
            $table->boolean('human_review_required')->default(true);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('title', 220);
            $table->longText('body');
            $table->json('audience');
            $table->string('status', 24)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['tenant_id', 'status', 'published_at']);
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('notification_deliveries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('notification_id');
            $table->string('channel', 32);
            $table->string('destination_hash', 64);
            $table->string('status', 24);
            $table->string('provider_reference')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->foreign('notification_id')->references('id')->on('notifications')->cascadeOnDelete();
            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('messages', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->restrictOnDelete();
            $table->longText('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'recipient_id', 'created_at']);
        });

        Schema::create('email_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('message_id', 180)->nullable();
            $table->string('recipient_hash', 64);
            $table->string('template', 100);
            $table->string('status', 24);
            $table->text('error_code')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('sms_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('message_id', 180)->nullable();
            $table->string('recipient_hash', 64);
            $table->string('template', 100);
            $table->string('status', 24);
            $table->text('error_code')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('report_jobs', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->string('report_key', 100);
            $table->json('parameters')->nullable();
            $table->string('format', 16);
            $table->string('state', 24)->default('queued');
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->string('storage_key')->nullable();
            $table->string('filename')->nullable();
            $table->text('message')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'requested_by', 'created_at']);
        });

        Schema::create('student_imports', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->string('storage_key');
            $table->string('sha256', 64);
            $table->json('column_mapping')->nullable();
            $table->json('validation_summary')->nullable();
            $table->string('state', 24)->default('uploaded');
            $table->timestamps();
            $table->index(['tenant_id', 'state', 'created_at']);
        });

        Schema::create('payment_transactions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 40);
            $table->string('provider_reference', 180);
            $table->string('idempotency_key', 120);
            $table->unsignedBigInteger('amount_minor');
            $table->char('currency', 3);
            $table->string('status', 32);
            $table->string('payer_reference_hash', 64)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'provider_reference']);
            $table->unique(['tenant_id', 'idempotency_key']);
            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('dashboard_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('experience', 32);
            $table->dateTime('as_of');
            $table->json('metrics');
            $table->json('tasks')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'experience']);
        });

        Schema::create('library_practice_attempts', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('library_resource_id')->constrained()->cascadeOnDelete();
            $table->string('practice_id', 80);
            $table->longText('answers');
            $table->decimal('score', 5, 2)->nullable();
            $table->unsignedSmallInteger('total');
            $table->json('feedback')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'user_id', 'created_at']);
        });

        Schema::create('parent_help_plans', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 220);
            $table->longText('content');
            $table->unsignedSmallInteger('total_minutes');
            $table->timestamps();
            $table->index(['tenant_id', 'user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        foreach (['parent_help_plans', 'library_practice_attempts', 'dashboard_snapshots', 'payment_transactions', 'student_imports', 'report_jobs', 'sms_logs', 'email_logs', 'messages', 'notification_deliveries', 'notifications', 'announcements', 'marking_results', 'marking_jobs', 'question_banks', 'curriculum_content', 'lesson_plans', 'ai_generations', 'report_cards', 'grading_schemes', 'assessment_submissions', 'staff_attendance', 'attendance_devices', 'attendance_sessions', 'teacher_profiles', 'employees', 'departments', 'student_medical_information', 'student_documents', 'subject_assignments', 'curricula', 'class_sections', 'tenant_sequences', 'subscriptions', 'plans'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
