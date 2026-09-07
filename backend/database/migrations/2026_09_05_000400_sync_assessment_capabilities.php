<?php

use App\Models\Permission;
use App\Models\Role;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrySynchronizer::class)->sync();
        // Preserve existing school-wide review/configuration grants; role labels
        // are never authorization inputs. Unlock is deliberately separately granted.
        $mapping = [
            'scores.approve' => ['assessment.assessment.manage', 'assessment.score.lock', 'assessment.question.review'],
            'assessment.score.moderate' => ['assessment.assessment.manage', 'assessment.score.lock', 'assessment.question.review'],
            'settings.configure' => ['assessment.settings.configure', 'assessment.assessment.manage'],
            'school.settings.update' => ['assessment.settings.configure', 'assessment.assessment.manage'],
            'assessment.create' => ['assessment.question.review'],
            'assessment.assessment.create' => ['assessment.question.review'],
        ];
        foreach ($mapping as $existing => $targets) {
            $ids = Permission::query()->whereIn('name', $targets)->pluck('id');
            Role::query()->whereHas('permissions', fn ($q) => $q->where('name', $existing))->each(fn ($role) => $role->permissions()->syncWithoutDetaching($ids));
        }
    }

    public function down(): void
    {
        // Grants can be administratively changed after cutover. Do not revoke them
        // blindly or destroy score audit history on a presentation rollback.
    }
};
