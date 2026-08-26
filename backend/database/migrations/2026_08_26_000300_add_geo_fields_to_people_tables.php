<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->string('country_code', 8)->nullable()->after('nationality');
            $table->string('local_government_area', 120)->nullable()->after('state_of_origin');
        });

        Schema::table('employees', function (Blueprint $table): void {
            $table->string('country_code', 8)->nullable()->after('employment_type');
            $table->string('state_region', 120)->nullable()->after('country_code');
            $table->string('local_government_area', 120)->nullable()->after('state_region');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->dropColumn(['country_code', 'local_government_area']);
        });

        Schema::table('employees', function (Blueprint $table): void {
            $table->dropColumn(['country_code', 'state_region', 'local_government_area']);
        });
    }
};
