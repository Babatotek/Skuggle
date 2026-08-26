<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            if (! Schema::hasColumn('students', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('tenant_id')
                    ->constrained()
                    ->nullOnDelete();
                $table->unique(['tenant_id', 'user_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            if (Schema::hasColumn('students', 'user_id')) {
                $table->dropUnique(['tenant_id', 'user_id']);
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
