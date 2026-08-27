<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_plan_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->ulid('public_id')->unique();
            $table->string('title', 160);
            $table->date('due_date')->nullable();
            $table->boolean('completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'user_id', 'completed', 'due_date'], 'personal_plan_owner_status_due_idx');
            $table->index(['user_id', 'updated_at'], 'personal_plan_user_updated_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_plan_items');
    }
};
