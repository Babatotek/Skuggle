<?php

namespace App\Policies;

use App\Domain\Tenancy\TenantContext;
use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'students.view');
    }

    public function view(User $user, Student $student): bool
    {
        if (! $this->sameTenant($student)) {
            return false;
        }

        if ($this->allows($user, 'students.view')) {
            return true;
        }

        return $this->isLinkedGuardian($user, $student) || $this->isSelfStudent($user, $student);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'students.create');
    }

    public function update(User $user, Student $student): bool
    {
        return $this->sameTenant($student) && $this->allows($user, 'students.edit');
    }

    private function allows(User $user, string $permission): bool
    {
        $context = app(TenantContext::class);
        if (! $context->hasTenant()) {
            return false;
        }

        return in_array($permission, $context->membership()->permissionNames(), true);
    }

    private function sameTenant(Student $student): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && (int) $student->tenant_id === $context->tenantId();
    }

    private function isLinkedGuardian(User $user, Student $student): bool
    {
        return $student->guardians()->where('user_id', $user->getKey())->exists();
    }

    private function isSelfStudent(User $user, Student $student): bool
    {
        return isset($student->user_id) && (int) $student->user_id === (int) $user->getKey();
    }
}
