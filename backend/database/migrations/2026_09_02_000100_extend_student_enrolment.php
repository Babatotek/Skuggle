<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->string('preferred_name', 100)->nullable()->after('middle_name');
            $table->string('religion', 64)->nullable()->after('nationality');
            $table->unsignedTinyInteger('profile_completion_percent')->default(0)->after('status');
        });

        Schema::table('student_guardians', function (Blueprint $table): void {
            $table->boolean('lives_with_student')->default(false)->after('authorized_pickup');
        });

        Schema::table('student_medical_information', function (Blueprint $table): void {
            $table->string('blood_group', 8)->nullable()->after('student_id');
            $table->string('genotype', 8)->nullable()->after('blood_group');
            $table->longText('dietary_restrictions')->nullable()->after('medications');
            $table->longText('disability_needs')->nullable()->after('dietary_restrictions');
            $table->longText('special_educational_needs')->nullable()->after('disability_needs');
        });

        Schema::table('student_documents', function (Blueprint $table): void {
            $table->string('verification_status', 24)->default('pending')->after('scan_status');
        });

        Schema::table('enrollments', function (Blueprint $table): void {
            $table->foreignId('term_id')->nullable()->after('academic_session_id')->constrained()->nullOnDelete();
            $table->string('admission_type', 48)->nullable()->after('status');
            $table->string('student_category', 48)->nullable()->after('admission_type');
            $table->string('boarding_type', 24)->nullable()->after('student_category');
        });

        Schema::create('student_status_history', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32);
            $table->text('reason')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at');
            $table->timestamps();
            $table->index(['tenant_id', 'student_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_status_history');

        Schema::table('enrollments', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('term_id');
            $table->dropColumn(['admission_type', 'student_category', 'boarding_type']);
        });

        Schema::table('student_documents', function (Blueprint $table): void {
            $table->dropColumn('verification_status');
        });

        Schema::table('student_medical_information', function (Blueprint $table): void {
            $table->dropColumn(['blood_group', 'genotype', 'dietary_restrictions', 'disability_needs', 'special_educational_needs']);
        });

        Schema::table('student_guardians', function (Blueprint $table): void {
            $table->dropColumn('lives_with_student');
        });

        Schema::table('students', function (Blueprint $table): void {
            $table->dropColumn(['preferred_name', 'religion', 'profile_completion_percent']);
        });
    }
};
