<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cbt_quizzes', function (Blueprint $table): void {
            $table->id(); $table->ulid('public_id')->unique(); $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('title', 220); $table->string('subject', 120); $table->string('class_name', 100);
            $table->unsignedSmallInteger('duration_minutes'); $table->unsignedSmallInteger('total_marks'); $table->unsignedTinyInteger('pass_percentage')->default(50);
            $table->json('questions'); $table->boolean('shuffle_questions')->default(false); $table->string('status', 24)->default('draft');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete(); $table->timestamps();
            $table->index(['tenant_id', 'status', 'class_name']);
        });
        Schema::create('cbt_attempts', function (Blueprint $table): void {
            $table->id(); $table->ulid('public_id')->unique(); $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained('cbt_quizzes')->cascadeOnDelete(); $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('answers'); $table->unsignedSmallInteger('score'); $table->unsignedSmallInteger('total_marks'); $table->timestamp('submitted_at'); $table->timestamps();
            $table->index(['tenant_id', 'quiz_id', 'user_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('cbt_attempts'); Schema::dropIfExists('cbt_quizzes'); }
};
