<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('name', 180);
            $table->string('slug', 180)->unique();
            $table->string('code', 32)->unique();
            $table->string('type', 24)->default('school');
            $table->string('status', 24)->default('trial')->index();
            $table->string('subscription_plan', 64)->default('pilot');
            $table->string('subscription_status', 32)->default('trial');
            $table->timestamp('subscription_started_at')->nullable();
            $table->timestamp('subscription_expires_at')->nullable()->index();
            $table->string('timezone', 64)->default('Africa/Lagos');
            $table->char('country', 2)->default('NG');
            $table->char('currency', 3)->default('NGN');
            $table->unsignedBigInteger('settings_version')->default(1);
            $table->json('settings')->nullable();
            $table->json('quota_limits')->nullable();
            $table->json('quota_usage')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('label', 120);
            $table->boolean('privileged')->default(false);
        });

        Schema::create('permissions', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('description')->nullable();
        });

        Schema::create('role_permission', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        Schema::create('tenant_memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->restrictOnDelete();
            $table->string('status', 24)->default('active');
            $table->timestamp('joined_at')->nullable();
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'user_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('tenant_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('key', 160);
            $table->json('value')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'key']);
        });

        Schema::create('feature_flags', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('key', 120);
            $table->boolean('enabled')->default(false);
            $table->json('configuration')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('tenant_settings');
        Schema::dropIfExists('tenant_memberships');
        Schema::dropIfExists('role_permission');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('tenants');
    }
};
