<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_definitions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('form_key', 80);
            $table->string('name', 160);
            $table->string('category', 80)->default('people');
            $table->string('status', 24)->default('published');
            $table->unsignedInteger('version')->default(1);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'form_key'], 'form_defs_tenant_key_unique');
            $table->index(['tenant_id', 'category'], 'form_defs_tenant_category_idx');
        });

        Schema::create('form_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('form_definition_id')->constrained('form_definitions')->cascadeOnDelete();
            $table->string('section_key', 80)->nullable();
            $table->string('name', 120);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_customizable')->default(true);
            $table->timestamps();

            $table->index(['form_definition_id', 'sort_order'], 'form_sections_form_sort_idx');
            $table->index(['tenant_id', 'form_definition_id'], 'form_sections_tenant_form_idx');
        });

        Schema::create('field_definitions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('field_key', 80);
            $table->string('label', 160);
            $table->string('answer_type', 40);
            $table->string('source', 24)->default('custom');
            $table->string('template_key', 80)->nullable();
            $table->json('options')->nullable();
            $table->json('config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'field_key'], 'field_defs_tenant_key_unique');
            $table->index(['tenant_id', 'source'], 'field_defs_tenant_source_idx');
        });

        Schema::create('form_field_placements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('form_definition_id')->constrained('form_definitions')->cascadeOnDelete();
            $table->foreignId('form_section_id')->constrained('form_sections')->cascadeOnDelete();
            $table->foreignId('field_definition_id')->constrained('field_definitions')->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('required')->default(false);
            $table->boolean('visible')->default(true);
            $table->string('lock_level', 24)->default('custom');
            $table->json('permissions')->nullable();
            $table->json('conditional_rules')->nullable();
            $table->json('overrides')->nullable();
            $table->timestamps();

            $table->unique(['form_definition_id', 'field_definition_id'], 'ffp_form_field_unique');
            $table->index(['form_definition_id', 'form_section_id', 'sort_order'], 'ffp_form_section_sort_idx');
            $table->index(['tenant_id', 'form_definition_id'], 'ffp_tenant_form_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_field_placements');
        Schema::dropIfExists('field_definitions');
        Schema::dropIfExists('form_sections');
        Schema::dropIfExists('form_definitions');
    }
};
