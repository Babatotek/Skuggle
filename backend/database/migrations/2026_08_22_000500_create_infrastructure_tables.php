<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 160);
            $table->string('resource_type')->nullable();
            $table->string('resource_id', 80)->nullable();
            $table->string('request_id', 100)->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->longText('before_values')->nullable();
            $table->longText('after_values')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->index(['tenant_id', 'occurred_at']);
            $table->index(['tenant_id', 'action', 'occurred_at']);
            $table->index(['resource_type', 'resource_id']);
        });

        Schema::create('idempotency_keys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('key', 120);
            $table->string('request_hash', 64);
            $table->unsignedSmallInteger('response_status');
            $table->longText('response_body');
            $table->timestamp('expires_at');
            $table->unique(['tenant_id', 'user_id', 'key']);
            $table->index('expires_at');
        });

        Schema::create('outbox_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->ulid('event_id')->unique();
            $table->string('event_type', 180);
            $table->string('aggregate_type', 120)->nullable();
            $table->string('aggregate_id', 80)->nullable();
            $table->json('payload');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('available_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['processed_at', 'available_at']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('webhook_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('provider', 80);
            $table->string('external_id', 180);
            $table->string('signature_hash', 64);
            $table->json('payload');
            $table->string('status', 24)->default('received');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'external_id']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('ai_requests', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('operation', 80);
            $table->string('provider', 40);
            $table->string('model', 120);
            $table->string('prompt_hash', 64);
            $table->string('provider_request_id')->nullable();
            $table->string('status', 24);
            $table->unsignedInteger('input_tokens')->nullable();
            $table->unsignedInteger('output_tokens')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->json('metadata')->nullable();
            $table->text('error_code')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'operation', 'status']);
        });

        Schema::create('tenant_daily_metrics', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->date('metric_date');
            $table->json('metrics');
            $table->timestamps();
            $table->unique(['tenant_id', 'metric_date']);
        });

        Schema::create('security_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_type', 100);
            $table->string('severity', 16);
            $table->string('ip_hash', 64)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->index(['tenant_id', 'severity', 'occurred_at']);
            $table->index(['event_type', 'occurred_at']);
        });
    }

    public function down(): void
    {
        foreach (['security_events', 'tenant_daily_metrics', 'ai_requests', 'webhook_events', 'outbox_events', 'idempotency_keys', 'audit_logs'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
