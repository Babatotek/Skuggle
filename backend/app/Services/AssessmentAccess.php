<?php

namespace App\Services;

use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Tenancy\TenantContext;
use App\Models\Assessment;
use App\Models\Employee;
use App\Models\TeacherAssignment;
use Illuminate\Database\Eloquent\Builder;

final class AssessmentAccess
{
    public function allows(string $capability): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && $context->membershipId() !== null
            && app(CanonicalAuthorizationEvaluator::class)->allows($context->membership(), $capability);
    }

    public function tenantWide(): bool
    {
        return $this->allows('assessment.assessment.manage');
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public function scope(Builder $query): Builder
    {
        if ($this->tenantWide()) {
            return $query;
        }
        $context = app(TenantContext::class);
        if (! Employee::query()->where('user_id', $context->actorId())->where('status', 'active')->exists()) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereExists(function ($assignment) use ($context): void {
            $assignment->selectRaw('1')->from('teacher_assignments')
                ->where('teacher_assignments.tenant_id', $context->tenantId())
                ->where('teacher_assignments.user_id', $context->actorId())
                ->whereColumn('teacher_assignments.class_id', 'assessments.class_id')
                ->whereColumn('teacher_assignments.subject_id', 'assessments.subject_id')
                ->whereColumn('teacher_assignments.academic_session_id', 'assessments.academic_session_id');
        });
    }

    public function assigned(int $classId, int $subjectId, int $sessionId): bool
    {
        if ($this->tenantWide()) {
            return true;
        }
        $actor = app(TenantContext::class)->actorId();

        return Employee::query()->where('user_id', $actor)->where('status', 'active')->exists()
            && TeacherAssignment::query()->where('user_id', $actor)->where('class_id', $classId)
                ->where('subject_id', $subjectId)->where('academic_session_id', $sessionId)->exists();
    }

    public function resource(Assessment $assessment): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && (int) $assessment->tenant_id === $context->tenantId()
            && $this->assigned((int) $assessment->class_id, (int) $assessment->subject_id, (int) $assessment->academic_session_id);
    }
}
