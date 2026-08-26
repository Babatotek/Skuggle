<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campuses', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 160);
            $table->string('code', 32);
            $table->string('status', 24)->default('active');
            $table->timestamps();
            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('academic_sessions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 64);
            $table->date('starts_at');
            $table->date('ends_at');
            $table->boolean('is_current')->default(false);
            $table->string('status', 24)->default('active');
            $table->timestamps();
            $table->unique(['tenant_id', 'name']);
            $table->index(['tenant_id', 'is_current']);
        });

        Schema::create('terms', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->string('name', 64);
            $table->unsignedTinyInteger('sequence');
            $table->date('starts_at');
            $table->date('ends_at');
            $table->boolean('is_current')->default(false);
            $table->timestamps();
            $table->unique(['tenant_id', 'academic_session_id', 'sequence']);
            $table->index(['tenant_id', 'is_current']);
        });

        Schema::create('school_classes', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campus_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 100);
            $table->string('arm', 40)->nullable();
            $table->string('educational_level', 80)->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('status', 24)->default('active');
            $table->timestamps();
            $table->unique(['tenant_id', 'campus_id', 'name', 'arm']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('subjects', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('code', 32);
            $table->string('status', 24)->default('active');
            $table->timestamps();
            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('class_subject', function (Blueprint $table): void {
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->primary(['tenant_id', 'class_id', 'subject_id']);
        });

        Schema::create('teacher_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->string('assignment_type', 32)->default('subject_teacher');
            $table->timestamps();
            $table->unique(['tenant_id', 'user_id', 'class_id', 'subject_id', 'academic_session_id'], 'teacher_assignment_unique');
            $table->index(['tenant_id', 'user_id']);
        });

        Schema::create('students', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('admission_number', 64);
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 32)->nullable();
            $table->string('nationality', 80)->nullable();
            $table->string('state_of_origin', 100)->nullable();
            $table->date('admission_date')->nullable();
            $table->string('photo_key')->nullable();
            $table->string('status', 32)->default('active');
            $table->unsignedBigInteger('revision')->default(1);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'admission_number']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'last_name', 'first_name']);
        });

        Schema::create('guardians', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 180);
            $table->string('phone', 32);
            $table->string('email', 254)->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'phone']);
            $table->index(['tenant_id', 'user_id']);
        });

        Schema::create('student_guardians', function (Blueprint $table): void {
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained()->cascadeOnDelete();
            $table->string('relationship', 64);
            $table->boolean('preferred_contact')->default(false);
            $table->boolean('billing_responsible')->default(false);
            $table->boolean('authorized_pickup')->default(false);
            $table->timestamps();
            $table->primary(['tenant_id', 'student_id', 'guardian_id']);
        });

        Schema::create('enrollments', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->string('status', 24)->default('active');
            $table->timestamps();
            $table->unique(['tenant_id', 'student_id', 'academic_session_id']);
            $table->index(['tenant_id', 'class_id', 'status']);
        });
    }

    public function down(): void
    {
        foreach (['enrollments', 'student_guardians', 'guardians', 'students', 'teacher_assignments', 'class_subject', 'subjects', 'school_classes', 'terms', 'academic_sessions', 'campuses'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
