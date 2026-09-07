<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_bank_questions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('question_type', 32);
            $table->longText('prompt');
            $table->json('options')->nullable();
            $table->text('correct_answer')->nullable();
            $table->text('rationale')->nullable();
            $table->decimal('marks', 8, 2)->default(1);
            $table->string('difficulty', 24)->default('medium');
            $table->string('topic')->nullable();
            $table->string('curriculum')->nullable();
            $table->string('status', 24)->default('draft');
            $table->boolean('ai_generated')->default(false);
            $table->timestamps();
            $table->index(['tenant_id', 'subject_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_bank_questions');
    }
};
