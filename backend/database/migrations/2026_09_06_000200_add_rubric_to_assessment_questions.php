<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_questions', function (Blueprint $table): void {
            $table->json('rubric')->nullable()->after('rationale');
        });
        Schema::table('assessment_bank_questions', function (Blueprint $table): void {
            $table->json('rubric')->nullable()->after('rationale');
        });
    }

    public function down(): void
    {
        Schema::table('assessment_questions', function (Blueprint $table): void {
            $table->dropColumn('rubric');
        });
        Schema::table('assessment_bank_questions', function (Blueprint $table): void {
            $table->dropColumn('rubric');
        });
    }
};
