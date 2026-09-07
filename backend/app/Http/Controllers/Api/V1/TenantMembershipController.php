<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\SchoolRoles;
use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\TenantMembership;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TenantMembershipController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        $memberships = TenantMembership::query()
            ->with(['user:id,public_id,name,email,status,last_login_at', 'role:id,name,label,privileged'])
            ->where('tenant_id', $context->tenantId())
            ->orderBy('id')
            ->get()
            ->map(fn (TenantMembership $membership) => $this->present($membership));

        return ApiResponse::success(['data' => $memberships]);
    }

    public function store(Request $request, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $this->assertSuperAdmin($context);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email:rfc', 'max:254'],
            'password' => ['required', 'string', 'min:8', 'max:120'],
            'role' => ['required', 'string', Rule::in([SchoolRoles::SCHOOL_ADMIN])],
        ]);

        $role = Role::query()->where('name', $data['role'])->firstOrFail();
        $email = mb_strtolower($data['email']);
        $user = User::query()->where('email', $email)->first();

        if ($user) {
            $exists = TenantMembership::query()
                ->where('tenant_id', $context->tenantId())
                ->where('user_id', $user->getKey())
                ->exists();
            if ($exists) {
                throw ValidationException::withMessages(['email' => ['This person already has a membership in this school.']]);
            }
        } else {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $email,
                'password' => $data['password'],
                'email_verified_at' => now(),
                'status' => 'active',
            ]);
        }

        $membership = TenantMembership::query()->create([
            'tenant_id' => $context->tenantId(),
            'user_id' => $user->getKey(),
            'role_id' => $role->getKey(),
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $audit->record('membership.created', $membership, [], [
            'role' => $role->name,
            'user_id' => $user->public_id,
        ]);

        return ApiResponse::success(['membership' => $this->present($membership->load(['user', 'role']))], [], 201);
    }

    public function update(Request $request, TenantMembership $membership, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $this->assertSuperAdmin($context);
        abort_unless((int) $membership->tenant_id === (int) $context->tenantId(), 404);

        $data = $request->validate([
            'role' => ['nullable', 'string', Rule::in([SchoolRoles::SCHOOL_ADMIN, 'teacher', 'bursar', 'principal', 'examination_officer', 'admission_officer', 'parent'])],
            'status' => ['nullable', 'string', Rule::in(['active', 'suspended'])],
            'currentPassword' => ['required_if:role,'.SchoolRoles::SCHOOL_ADMIN, 'nullable', 'string'],
        ]);

        $actor = $request->user();
        $targetRoleName = $membership->role?->name;
        if (SchoolRoles::isSchoolSuperAdmin($targetRoleName) && (int) $membership->user_id !== (int) $actor->getKey()) {
            return ApiResponse::error('FORBIDDEN', 'School Super Admin authority cannot be modified by this action.', 403);
        }
        if ((int) $membership->user_id === (int) $actor->getKey() && isset($data['role']) && $data['role'] !== SchoolRoles::SCHOOL_SUPER_ADMIN) {
            return ApiResponse::error('FORBIDDEN', 'You cannot change your own Super Admin role.', 403);
        }

        if (isset($data['role']) && $data['role'] === SchoolRoles::SCHOOL_ADMIN && ! Hash::check((string) $data['currentPassword'], (string) $actor->password)) {
            throw ValidationException::withMessages(['currentPassword' => ['Confirm your password to change administrator access.']]);
        }

        $before = ['role' => $targetRoleName, 'status' => $membership->status];

        if (isset($data['role'])) {
            $role = Role::query()->where('name', $data['role'])->firstOrFail();
            $membership->role_id = $role->getKey();
        }
        if (isset($data['status'])) {
            if (SchoolRoles::isSchoolSuperAdmin($targetRoleName) && $data['status'] !== 'active') {
                $remaining = TenantMembership::query()
                    ->where('tenant_id', $context->tenantId())
                    ->where('status', 'active')
                    ->where('id', '!=', $membership->getKey())
                    ->whereHas('role', fn ($query) => $query->where('name', SchoolRoles::SCHOOL_SUPER_ADMIN))
                    ->count();
                if ($remaining < 1) {
                    return ApiResponse::error('LAST_SUPER_ADMIN', 'The school must retain at least one Super Admin.', 422);
                }
            }
            $membership->status = $data['status'];
        }

        $membership->save();
        $audit->record('membership.updated', $membership, $before, [
            'role' => $membership->role()->value('name'),
            'status' => $membership->status,
        ]);

        return ApiResponse::success(['membership' => $this->present($membership->fresh(['user', 'role']))]);
    }

    private function assertSuperAdmin(TenantContext $context): void
    {
        abort_unless(SchoolRoles::isSchoolSuperAdmin($context->membership()->role?->name), 403);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(TenantMembership $membership): array
    {
        return [
            'id' => $membership->getKey(),
            'status' => $membership->status,
            'joinedAt' => optional($membership->joined_at)?->toIso8601String(),
            'role' => $membership->role?->name,
            'roleLabel' => $membership->role?->label,
            'privileged' => (bool) $membership->role?->privileged,
            'user' => [
                'id' => $membership->user?->public_id,
                'name' => $membership->user?->name,
                'email' => $membership->user?->email,
                'status' => $membership->user?->status,
            ],
        ];
    }
}
