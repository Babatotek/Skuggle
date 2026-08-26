<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_support_tickets', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('ticket_number', 32)->unique();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('requester_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('requester_name', 180);
            $table->string('requester_email', 254);
            $table->string('requester_role', 80)->default('school_admin');
            $table->string('subject', 220);
            $table->string('category', 64);
            $table->string('priority', 24)->default('medium');
            $table->string('status', 32)->default('open')->index();
            $table->string('assigned_agent', 180)->nullable();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('sla_minutes_remaining')->default(240);
            $table->unsignedTinyInteger('satisfaction_rating')->nullable();
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['status', 'priority', 'updated_at']);
        });

        Schema::create('platform_support_messages', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('ticket_id')->constrained('platform_support_tickets')->cascadeOnDelete();
            $table->foreignId('author_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_name', 180);
            $table->string('sender_type', 32); // school | support_agent | system
            $table->longText('body');
            $table->json('attachments')->nullable();
            $table->timestamps();
            $table->index(['ticket_id', 'created_at']);
        });

        Schema::create('platform_invoices', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('invoice_number', 40)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained()->nullOnDelete();
            $table->string('cycle', 24)->default('monthly');
            $table->unsignedBigInteger('amount_minor');
            $table->unsignedBigInteger('discount_minor')->default(0);
            $table->char('currency', 3)->default('NGN');
            $table->string('status', 24)->default('pending')->index();
            $table->string('gateway', 40)->default('paystack');
            $table->string('provider_reference', 180)->nullable()->unique();
            $table->date('issued_on');
            $table->date('due_on');
            $table->timestamp('paid_at')->nullable();
            $table->string('receipt_url')->nullable();
            $table->json('line_items')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status', 'due_on']);
        });

        Schema::create('platform_broadcasts', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('title', 220);
            $table->string('summary', 280)->nullable();
            $table->longText('body');
            $table->string('channel', 40)->default('in_app');
            $table->string('audience', 64)->default('all_schools');
            $table->string('status', 24)->default('draft')->index();
            $table->unsignedInteger('recipient_count')->default(0);
            $table->unsignedTinyInteger('open_rate_percent')->default(0);
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['status', 'published_at']);
        });

        Schema::create('platform_backup_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('label', 180);
            $table->string('status', 24)->default('queued')->index();
            $table->string('trigger', 40)->default('manual');
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('storage_path')->nullable();
            $table->string('checksum', 128)->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('platform_api_credentials', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('name', 120);
            $table->string('provider', 64); // paystack, flutterwave, gemini, etc.
            $table->string('environment', 24)->default('live');
            $table->string('key_hint', 24); // last 4 / prefix only
            $table->string('fingerprint', 64)->unique();
            $table->string('status', 24)->default('active');
            $table->timestamp('last_rotated_at')->nullable();
            $table->foreignId('rotated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_api_credentials');
        Schema::dropIfExists('platform_backup_snapshots');
        Schema::dropIfExists('platform_broadcasts');
        Schema::dropIfExists('platform_invoices');
        Schema::dropIfExists('platform_support_messages');
        Schema::dropIfExists('platform_support_tickets');
    }
};
