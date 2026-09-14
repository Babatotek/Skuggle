<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tenant-defined access role definitions (metadata).
 * Authorization wiring remains deferred to the Role Access & Permission PRD;
 * system/protected roles stay in the global roles table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_access_roles', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('description', 500)->nullable();
            $table->string('category', 64)->nullable();
            $table->string('template_key', 80)->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_access_roles');
    }
};
