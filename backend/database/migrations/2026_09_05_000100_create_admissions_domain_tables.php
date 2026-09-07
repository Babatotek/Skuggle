<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_cycles', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->date('opens_at')->nullable();
            $table->date('closes_at')->nullable();
            $table->string('status', 24)->default('draft');
            $table->char('currency', 3)->default('NGN');
            $table->unsignedBigInteger('application_fee_minor')->default(0);
            $table->json('settings')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('legacy_source_module', 64)->nullable();
            $table->unsignedBigInteger('legacy_source_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'legacy_source_module', 'legacy_source_id'], 'adm_cycle_legacy_unique');
            $table->index(['tenant_id', 'status', 'opens_at']);
        });

        Schema::create('admission_applications', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_cycle_id')->nullable()->constrained('admission_cycles')->nullOnDelete();
            $table->foreignId('requested_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->string('reference', 80);
            $table->string('status', 24)->default('draft');
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('gender', 32)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('nationality', 80)->nullable();
            $table->string('guardian_name', 190)->nullable();
            $table->string('guardian_phone', 40)->nullable();
            $table->string('guardian_email', 190)->nullable();
            $table->json('custom_fields')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('status_changed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('legacy_source_module', 64)->nullable();
            $table->unsignedBigInteger('legacy_source_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'reference']);
            $table->unique(['tenant_id', 'legacy_source_module', 'legacy_source_id'], 'adm_app_legacy_unique');
            $table->index(['tenant_id', 'status', 'created_at']);
            $table->index(['tenant_id', 'guardian_email']);
        });

        Schema::create('admission_screenings', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->string('status', 24)->default('scheduled');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('score', 7, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('legacy_source_module', 64)->nullable();
            $table->unsignedBigInteger('legacy_source_id')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'legacy_source_module', 'legacy_source_id'], 'adm_screen_legacy_unique');
            $table->index(['tenant_id', 'status', 'scheduled_at']);
        });

        Schema::create('admission_decisions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->foreignId('offered_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->string('decision', 24);
            $table->string('offer_reference', 80)->nullable();
            $table->date('expires_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('decided_at');
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('legacy_source_module', 64)->nullable();
            $table->unsignedBigInteger('legacy_source_id')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'admission_application_id']);
            $table->unique(['tenant_id', 'legacy_source_module', 'legacy_source_id'], 'adm_decision_legacy_unique');
            $table->index(['tenant_id', 'decision', 'decided_at']);
        });

        Schema::create('admission_documents', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->string('document_type', 64);
            $table->string('original_name', 255);
            $table->string('storage_key', 500);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->char('sha256', 64);
            $table->string('scan_status', 24)->default('pending');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'admission_application_id']);
        });

        Schema::create('admission_offer_letters', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->string('reference', 80)->nullable();
            $table->string('status', 24)->default('draft');
            $table->timestamp('issued_at')->nullable();
            $table->json('content')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('legacy_source_module', 64)->nullable();
            $table->unsignedBigInteger('legacy_source_id')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'legacy_source_module', 'legacy_source_id'], 'adm_letter_legacy_unique');
        });

        Schema::create('admission_workflow_history', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->string('from_status', 24)->nullable();
            $table->string('to_status', 24);
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at');
            $table->string('legacy_source_module', 64)->nullable();
            $table->unsignedBigInteger('legacy_source_id')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'legacy_source_module', 'legacy_source_id'], 'adm_history_legacy_unique');
            $table->index(['tenant_id', 'admission_application_id', 'changed_at'], 'adm_history_app_changed_idx');
        });

        Schema::create('admission_conversions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->restrictOnDelete();
            $table->foreignId('enrollment_id')->nullable()->constrained('enrollments')->nullOnDelete();
            $table->string('idempotency_key', 100)->nullable();
            $table->foreignId('converted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('converted_at');
            $table->timestamps();
            $table->unique(['tenant_id', 'admission_application_id']);
            $table->unique(['tenant_id', 'idempotency_key']);
        });

        Schema::create('admission_migration_issues', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('source_module', 64);
            $table->unsignedBigInteger('source_id');
            $table->string('reason_code', 64);
            $table->json('details')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'source_module', 'source_id', 'reason_code'], 'adm_migration_issue_unique');
        });

        $permissions = [
            'admissions.application.view',
            'admissions.application.create',
            'admissions.application.update',
            'admissions.screening.manage',
            'admissions.decision.manage',
            'admissions.enrolment.convert',
            'admissions.document.manage',
            'admissions.settings.update',
        ];
        foreach ($permissions as $name) {
            DB::table('permissions')->updateOrInsert(['name' => $name], ['description' => null]);
        }

        $allRoles = ['platform_super_admin', 'proprietor', 'school_super_admin'];
        $operationalRoles = ['school_admin', 'admission_officer'];
        foreach (array_merge($allRoles, $operationalRoles) as $roleName) {
            $roleId = DB::table('roles')->where('name', $roleName)->value('id');
            if (! $roleId) {
                continue;
            }
            foreach ($permissions as $permission) {
                $permissionId = DB::table('permissions')->where('name', $permission)->value('id');
                DB::table('role_permission')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_migration_issues');
        Schema::dropIfExists('admission_conversions');
        Schema::dropIfExists('admission_workflow_history');
        Schema::dropIfExists('admission_offer_letters');
        Schema::dropIfExists('admission_documents');
        Schema::dropIfExists('admission_decisions');
        Schema::dropIfExists('admission_screenings');
        Schema::dropIfExists('admission_applications');
        Schema::dropIfExists('admission_cycles');
    }
};
