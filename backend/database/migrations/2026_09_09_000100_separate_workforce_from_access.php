<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workforce_positions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('category', 24);
            $table->timestamps();
            $table->unique(['tenant_id', 'name']);
        });
        Schema::table('employees', function (Blueprint $table): void {
            $table->foreignId('position_id')->nullable()->constrained('workforce_positions')->nullOnDelete();
            $table->foreignId('campus_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('reporting_manager_id')->nullable()->constrained('employees')->nullOnDelete();
            // Existing staff are deliberately unclassified until reviewed; no role-derived backfill.
            $table->string('staff_category', 24)->nullable();
        });
        Schema::create('employee_documents', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('document_type', 48);
            $table->string('original_name');
            $table->string('storage_key');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
        Schema::table('employees', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('position_id');
            $table->dropConstrainedForeignId('campus_id');
            $table->dropConstrainedForeignId('reporting_manager_id');
            $table->dropColumn('staff_category');
        });
        Schema::dropIfExists('workforce_positions');
    }
};
