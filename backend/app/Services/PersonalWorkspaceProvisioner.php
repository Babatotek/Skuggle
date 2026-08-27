<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\Employee;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Ensures every account has a portable My Skuggle (individual) membership.
 * Joining a school adds a school membership; it must never replace personal ownership.
 */
final class PersonalWorkspaceProvisioner
{
    public function __construct(private readonly TenantContext $context) {}

    /**
     * @param  'teacher'|'parent'|'student'|string  $preferredAccountType
     */
    public function ensureFor(User $user, string $preferredAccountType = 'teacher'): TenantMembership
    {
        $existing = $user->memberships()
            ->with(['tenant', 'role'])
            ->where('status', 'active')
            ->whereHas('tenant', fn ($q) => $q->where('type', 'individual')->whereIn('status', ['active', 'trial']))
            ->orderByDesc('joined_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        $accountType = $this->normalizeAccountType($preferredAccountType);
        $role = Role::query()->where('name', $accountType)->firstOrFail();
        $name = trim($user->name) !== '' ? $user->name : 'Member';

        $tenant = Tenant::query()->create([
            'name' => $name."'s Learning Space",
            'slug' => Str::slug($name.'-learning-'.Str::lower(Str::random(6))),
            'code' => 'IND-'.Str::upper(Str::random(12)),
            'type' => 'individual',
            'status' => 'active',
            'subscription_plan' => 'free',
            'subscription_status' => 'active',
            'subscription_started_at' => now(),
            'quota_limits' => ['users' => 3, 'students' => 3, 'storage_bytes' => 524288000, 'ai_requests_per_day' => 10],
            'quota_usage' => ['users' => 1, 'students' => $accountType === 'student' ? 1 : 0, 'storage_bytes' => 0],
            'settings' => [],
        ]);

        $membership = TenantMembership::query()->create([
            'tenant_id' => $tenant->getKey(),
            'user_id' => $user->getKey(),
            'role_id' => $role->getKey(),
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $previousHadTenant = $this->context->hasTenant();
        $previousTenant = $previousHadTenant ? $this->context->tenant() : null;
        $previousMembership = $previousHadTenant ? $this->context->membership() : null;

        $this->context->set($tenant, $membership);
        try {
            if ($accountType === 'parent') {
                $hasGuardian = Guardian::query()
                    ->where('user_id', $user->getKey())
                    ->exists();
                if (! $hasGuardian) {
                    Guardian::query()->create([
                        'user_id' => $user->getKey(),
                        'name' => $name,
                        'phone' => 'not-provided',
                        'email' => $user->email,
                    ]);
                }
            }

            if ($accountType === 'teacher') {
                $hasIndependent = Employee::query()
                    ->where('user_id', $user->getKey())
                    ->exists();
                if (! $hasIndependent) {
                    Employee::query()->create([
                        'user_id' => $user->getKey(),
                        'employee_number' => 'IND-'.Str::upper(Str::random(8)),
                        'name' => $name,
                        'employment_type' => 'independent',
                        'started_at' => now()->toDateString(),
                        'status' => 'active',
                    ]);
                }
            }
        } finally {
            if ($previousHadTenant && $previousTenant) {
                $this->context->set($previousTenant, $previousMembership);
            } else {
                $this->context->clear();
            }
        }

        return $membership->load(['tenant', 'role']);
    }

    private function normalizeAccountType(string $preferred): string
    {
        return match ($preferred) {
            'parent' => 'parent',
            'student' => 'student',
            'teacher' => 'teacher',
            default => 'teacher',
        };
    }
}
