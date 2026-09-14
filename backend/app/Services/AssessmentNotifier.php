<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\Assessment;
use App\Models\SmartmarkBatch;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class AssessmentNotifier
{
    public function assessmentScheduled(Assessment $assessment): void
    {
        $settings = AssessmentSettings::forTenant();
        if (! ($settings['notifications']['teacherScheduled'] ?? true)) {
            return;
        }
        $user = User::query()->find($assessment->responsible_teacher_id ?: $assessment->created_by);
        if ($user) {
            $this->push($user, 'Assessment scheduled', $assessment->title.' is scheduled.', '/school/assessment/assessments/'.$assessment->public_id);
        }
        $studentIds = app(AssessmentWorkflow::class)->roster($assessment)->pluck('user_id')->filter();
        if ($settings['notifications']['studentAvailable'] ?? true) {
            foreach (User::query()->whereIn('id', $studentIds)->get() as $student) {
                $this->push($student, 'Assessment available', $assessment->title.' is available.', '/school/my-assessments');
            }
        }
    }

    public function smartmarkExceptions(SmartmarkBatch $batch): void
    {
        $settings = AssessmentSettings::forTenant();
        if (! ($settings['notifications']['officerExceptions'] ?? true)) {
            return;
        }
        $tenantId = app(TenantContext::class)->tenantId();
        $roleIds = DB::table('roles')->whereIn('name', ['examination_officer', 'school_admin', 'school_super_admin'])->pluck('id');
        $userIds = TenantMembership::query()->where('tenant_id', $tenantId)->whereIn('role_id', $roleIds)->where('status', 'active')->pluck('user_id');
        foreach (User::query()->whereIn('id', $userIds)->get() as $user) {
            $this->push($user, 'SmartMark exceptions', 'A SmartMark batch needs review.', '/school/assessment/marking');
        }
    }

    public function cbtSubmitted(Assessment $assessment): void
    {
        $user = User::query()->find($assessment->responsible_teacher_id ?: $assessment->created_by);
        if ($user) {
            $this->push($user, 'CBT submission received', $assessment->title.' has a new student submission.', '/school/assessment/assessments/'.$assessment->public_id);
        }
    }

    public function teacherMarkingDue(Assessment $assessment): void
    {
        $settings = AssessmentSettings::forTenant();
        if (! ($settings['notifications']['teacherMarkingDue'] ?? true)) {
            return;
        }
        $user = User::query()->find($assessment->responsible_teacher_id ?: $assessment->created_by);
        if ($user) {
            $this->push($user, 'Marking due', $assessment->title.' is ready for marking.', '/school/assessment/assessments/'.$assessment->public_id.'/marking');
        }
    }

    private function push(User $user, string $title, string $description, string $actionUrl): void
    {
        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'tenant_id' => app(TenantContext::class)->tenantId(),
            'type' => self::class,
            'notifiable_type' => User::class,
            'notifiable_id' => $user->getKey(),
            'data' => json_encode(['title' => $title, 'description' => $description, 'type' => 'assessment', 'actionUrl' => $actionUrl], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
