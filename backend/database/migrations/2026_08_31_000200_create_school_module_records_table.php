<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_module_records', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('module', 64);
            $table->string('title', 190);
            $table->string('status', 32)->default('active');
            $table->string('reference', 80)->nullable();
            $table->json('payload')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['tenant_id', 'module', 'status'], 'school_mod_rec_mod_status_idx');
            $table->index(['tenant_id', 'module', 'created_at'], 'school_mod_rec_mod_created_idx');
        });

        Schema::table('teacher_assignments', function (Blueprint $table): void {
            if (! Schema::hasColumn('teacher_assignments', 'public_id')) {
                $table->ulid('public_id')->nullable()->after('id');
            }
        });

        $permissionNames = ['admissions.manage', 'communication.send', 'operations.manage', 'services.manage', 'learning.manage'];
        foreach ($permissionNames as $name) {
            DB::table('permissions')->updateOrInsert(['name' => $name], ['description' => null]);
        }
        $permissionIds = DB::table('permissions')->whereIn('name', $permissionNames)->pluck('id');
        $superId = DB::table('roles')->where('name', 'school_super_admin')->value('id');
        $officerId = DB::table('roles')->where('name', 'school_admin')->value('id');
        $teacherId = DB::table('roles')->where('name', 'teacher')->value('id');
        $principalId = DB::table('roles')->where('name', 'principal')->value('id');
        foreach ($permissionIds as $permissionId) {
            if ($superId) {
                DB::table('role_permission')->insertOrIgnore(['role_id' => $superId, 'permission_id' => $permissionId]);
            }
            if ($officerId) {
                DB::table('role_permission')->insertOrIgnore(['role_id' => $officerId, 'permission_id' => $permissionId]);
            }
        }
        $teacherPerm = DB::table('permissions')->where('name', 'learning.manage')->value('id');
        $commPerm = DB::table('permissions')->where('name', 'communication.send')->value('id');
        if ($teacherId && $teacherPerm) {
            DB::table('role_permission')->insertOrIgnore(['role_id' => $teacherId, 'permission_id' => $teacherPerm]);
        }
        if ($teacherId && $commPerm) {
            DB::table('role_permission')->insertOrIgnore(['role_id' => $teacherId, 'permission_id' => $commPerm]);
        }
        if ($principalId && $commPerm) {
            DB::table('role_permission')->insertOrIgnore(['role_id' => $principalId, 'permission_id' => $commPerm]);
        }
        $servicesPerm = DB::table('permissions')->where('name', 'services.manage')->value('id');
        if ($principalId && $servicesPerm) {
            DB::table('role_permission')->insertOrIgnore(['role_id' => $principalId, 'permission_id' => $servicesPerm]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('school_module_records');
        Schema::table('teacher_assignments', function (Blueprint $table): void {
            if (Schema::hasColumn('teacher_assignments', 'public_id')) {
                $table->dropColumn('public_id');
            }
        });
    }
};
