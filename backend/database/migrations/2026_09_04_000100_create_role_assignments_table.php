<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_assignments', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_membership_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->restrictOnDelete();
            $table->string('scope_type', 16)->default('TENANT');
            $table->unsignedBigInteger('scope_id')->nullable();
            // MySQL UNIQUE permits repeated NULL values, so normalize scope
            // identity into a required key for duplicate-grant protection.
            $table->string('scope_key', 64)->default('TENANT');
            $table->timestamp('starts_at')->nullable()->index();
            $table->timestamp('ends_at')->nullable()->index();
            $table->string('status', 16)->default('ACTIVE')->index();
            $table->string('source', 32)->default('DIRECT');
            $table->boolean('is_primary')->default(false);
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason', 500)->nullable();
            $table->timestamps();
            $table->index(['tenant_membership_id', 'status']);
            $table->index(['role_id', 'status']);
            $table->unique(['tenant_membership_id', 'role_id', 'scope_key', 'source'], 'role_assignment_identity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_assignments');
    }
};
