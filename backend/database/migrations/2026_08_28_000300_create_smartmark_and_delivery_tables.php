<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('smartmark_batches', function (Blueprint $table): void {
            $table->id(); $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('state', 24)->default('queued')->index();
            $table->string('storage_key'); $table->string('original_filename'); $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes'); $table->string('sha256', 64);
            $table->json('answer_key'); $table->unsignedSmallInteger('max_score');
            $table->text('error_message')->nullable(); $table->timestamps();
            $table->index(['tenant_id', 'created_at']);
        });
        Schema::create('smartmark_sheets', function (Blueprint $table): void {
            $table->id(); $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('smartmark_batches')->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $table->string('admission_number', 64)->nullable(); $table->string('student_name')->nullable();
            $table->json('answers'); $table->decimal('detected_score', 8, 2); $table->decimal('confidence', 5, 2);
            $table->boolean('human_review_required')->default(true); $table->text('flag_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('committed_at')->nullable(); $table->timestamps();
            $table->index(['tenant_id', 'batch_id']);
        });
        Schema::create('outbound_deliveries', function (Blueprint $table): void {
            $table->id(); $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('announcement_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('channel', 24); $table->text('destination'); $table->string('destination_hash', 64);
            $table->string('provider', 40); $table->string('status', 24)->default('queued');
            $table->string('provider_reference', 180)->nullable(); $table->unsignedSmallInteger('attempts')->default(0);
            $table->text('error_message')->nullable(); $table->timestamp('sent_at')->nullable(); $table->timestamp('delivered_at')->nullable();
            $table->timestamps(); $table->index(['tenant_id', 'status', 'created_at']);
            $table->unique(['announcement_id', 'channel', 'destination_hash'], 'delivery_announcement_channel_destination_unique');
        });
    }
    public function down(): void { Schema::dropIfExists('outbound_deliveries'); Schema::dropIfExists('smartmark_sheets'); Schema::dropIfExists('smartmark_batches'); }
};
