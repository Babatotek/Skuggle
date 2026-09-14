<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_access_role_permission', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_access_role_id');
            $table->unsignedBigInteger('permission_id');
            $table->primary(['tenant_access_role_id', 'permission_id'], 'tap_role_permission_pk');
            $table->foreign('tenant_access_role_id', 'tap_role_fk')->references('id')->on('tenant_access_roles')->cascadeOnDelete();
            $table->foreign('permission_id', 'tap_permission_fk')->references('id')->on('permissions')->cascadeOnDelete();
        });

        Schema::table('tenant_memberships', function (Blueprint $table) {
            $table->foreignId('tenant_access_role_id')->nullable()->after('role_id')->constrained('tenant_access_roles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tenant_memberships', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_access_role_id');
        });
        Schema::dropIfExists('tenant_access_role_permission');
    }
};
