<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_ai_summaries', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('library_resource_id')->constrained()->cascadeOnDelete();
            $table->string('content_version', 40);
            $table->longText('summary');
            $table->longText('key_points');
            $table->string('source_label', 180);
            $table->foreignId('ai_request_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'library_resource_id', 'content_version'], 'library_summary_version_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('library_ai_summaries');
    }
};
