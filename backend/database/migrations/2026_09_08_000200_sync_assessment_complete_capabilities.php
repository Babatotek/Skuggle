<?php

use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrySynchronizer::class)->sync();
        $map = [
            'assessment.assessment.create' => [
                'assessment.assessment.update',
                'assessment.assessment.schedule',
                'assessment.assessment.cancel',
                'assessment.question.view',
                'assessment.question.create',
                'assessment.question.update',
            ],
            'assessment.create' => [
                'assessment.assessment.update',
                'assessment.assessment.schedule',
                'assessment.assessment.cancel',
                'assessment.question.view',
                'assessment.question.create',
                'assessment.question.update',
            ],
            'assessments.view' => ['assessment.question.view', 'assessment.score.view'],
            'assessment.assessment.view' => ['assessment.question.view', 'assessment.score.view'],
            'scores.edit' => ['assessment.score.view', 'assessment.score.review'],
            'assessment.score.enter' => ['assessment.score.view', 'assessment.score.review'],
            'assessment.score.moderate' => ['assessment.score.view', 'assessment.score.review'],
        ];
        foreach ($map as $from => $targets) {
            $fromId = DB::table('permissions')->where('name', $from)->value('id');
            if (! $fromId) {
                continue;
            }
            $roleIds = DB::table('role_permission')->where('permission_id', $fromId)->pluck('role_id');
            foreach ($targets as $target) {
                $targetId = DB::table('permissions')->where('name', $target)->value('id');
                if (! $targetId) {
                    continue;
                }
                foreach ($roleIds as $roleId) {
                    DB::table('role_permission')->insertOrIgnore([
                        'role_id' => $roleId,
                        'permission_id' => $targetId,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')->whereIn('name', [
            'assessment.assessment.update',
            'assessment.assessment.schedule',
            'assessment.assessment.cancel',
            'assessment.question.view',
            'assessment.question.create',
            'assessment.question.update',
            'assessment.score.view',
            'assessment.score.review',
        ])->delete();
    }
};
