<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Authorization\PermissionRegistry;
use App\Domain\Identity\SchoolRoles;
use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\Student;
use App\Models\TenantAccessRole;
use App\Models\TenantMembership;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\TenantAccessRoleDefaults;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TenantMembershipController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        $memberships = TenantMembership::query()
            ->with(['user:id,public_id,name,email,status,last_login_at', 'role:id,name,label,privileged', 'roleAssignments.role'])
            ->where('tenant_id', $context->tenantId())
            ->orderBy('id')
            ->get();
        $employees = Employee::query()->with(['position', 'campus'])->whereIn('user_id', $memberships->pluck('user_id'))->get()->keyBy('user_id');
        $guardians = Guardian::query()->whereIn('user_id', $memberships->pluck('user_id'))->get()->keyBy('user_id');
        $students = Student::query()->whereIn('user_id', $memberships->pluck('user_id'))->get()->keyBy('user_id');
        $memberships = $memberships->map(function (TenantMembership $membership) use ($employees, $guardians, $students): array {
            $employee = $employees->get($membership->user_id);
            $guardian = $guardians->get($membership->user_id);
            $student = $students->get($membership->user_id);

            return [...$this->present($membership),
                'accountType' => $employee ? 'Staff' : ($student ? 'Student' : ($guardian ? 'Guardian' : 'School account')),
                'linkedProfile' => $employee ? ['id' => $employee->public_id, 'type' => 'workforce', 'label' => $employee->position?->name ?? $employee->name] : ($student ? ['id' => $student->public_id, 'type' => 'student', 'label' => trim($student->first_name.' '.$student->last_name)] : ($guardian ? ['id' => $guardian->public_id, 'type' => 'guardian', 'label' => $guardian->name] : null)),
                'campus' => $employee?->campus?->name,
                'accessRoles' => $membership->roleAssignments->filter(fn ($a) => $a->isEffective())->map(fn ($a) => ['name' => $a->role?->name, 'label' => $a->role?->label])->unique('name')->values(),
            ];
        });

        return ApiResponse::success(['data' => $memberships, 'canManageAccess' => SchoolRoles::isSchoolSuperAdmin($context->membership()->role?->name)]);
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
            'status' => ['nullable', 'string', Rule::in(['active', 'suspended', 'disabled', 'locked'])],
            'accessRoleId' => ['nullable', 'string'],
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

        if (array_key_exists('accessRoleId', $data)) {
            if ($data['accessRoleId']) {
                $accessRole = TenantAccessRole::query()->where('public_id', $data['accessRoleId'])->firstOrFail();
                $membership->tenant_access_role_id = $accessRole->getKey();
            } else {
                $membership->tenant_access_role_id = null;
            }
        }

        $membership->save();
        $audit->record('membership.updated', $membership, $before, [
            'role' => $membership->role()->value('name'),
            'status' => $membership->status,
            'access_role_id' => $membership->accessRole?->public_id,
        ]);

        return ApiResponse::success(['membership' => $this->present($membership->fresh(['user', 'role', 'accessRole']))]);
    }

    private function assertSuperAdmin(TenantContext $context): void
    {
        abort_unless(SchoolRoles::isSchoolSuperAdmin($context->membership()->role?->name), 403);
    }

    public function employeeAccess(string $employee, Request $request, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $this->assertSuperAdmin($context);
        $data = $request->validate(['email' => ['required', 'email:rfc', 'max:254'], 'password' => ['nullable', 'string', 'min:10', 'max:120'], 'role' => ['required', Rule::in(SchoolRoles::invitableRolesFor($context->membership()->role?->name))]]);
        $membership = DB::transaction(function () use ($employee, $data, $context, $audit) {
            $record = Employee::query()->where('public_id', $employee)->lockForUpdate()->firstOrFail();
            abort_if($record->user_id !== null, 422, 'This employee already has a linked account. Manage it in Users.');
            $email = mb_strtolower($data['email']);
            $user = User::query()->where('email', $email)->lockForUpdate()->first();
            if ($user) {
                $membership = TenantMembership::query()->where('tenant_id', $context->tenantId())->where('user_id', $user->getKey())->first();
                abort_unless($membership, 422, 'Use an invitation to link an existing account that has not joined this school.');
                abort_if(Employee::query()->where('user_id', $user->getKey())->exists(), 422, 'This school account is already linked to an employee.');
            } else {
                abort_unless(! empty($data['password']), 422, 'A temporary password is required for a new account.');
                $user = User::query()->create(['name' => $record->name, 'email' => $email, 'password' => $data['password'], 'status' => 'active']);
                $role = Role::query()->where('name', $data['role'])->firstOrFail();
                $membership = TenantMembership::query()->create(['tenant_id' => $context->tenantId(), 'user_id' => $user->getKey(), 'role_id' => $role->getKey(), 'status' => 'active', 'joined_at' => now()]);
            }
            $record->user_id = $user->getKey();
            $record->save();
            $audit->record('workforce.account.linked', $record, [], ['user_id' => $user->public_id]);

            return $membership->load(['user', 'role']);
        });

        return ApiResponse::success(['membership' => $this->present($membership)], [], 201);
    }

    public function catalog(TenantContext $context, TenantAccessRoleDefaults $defaults): JsonResponse
    {
        // Tenant Super Admins manage school-owned roles. Shared platform role
        // definitions are copied once as editable defaults, and remain available
        // as create templates afterwards.
        $defaults->ensureFor($context->tenant());

        $names = array_unique([...SchoolRoles::invitableRolesFor(SchoolRoles::SCHOOL_SUPER_ADMIN), SchoolRoles::SCHOOL_SUPER_ADMIN]);
        $memberships = TenantMembership::query()->with(['roleAssignments', 'accessRole'])->where('tenant_id', $context->tenantId())->get();
        $roles = Role::query()->with('permissions')->whereIn('name', $names)->orderBy('label')->get();
        $templates = $roles
            ->filter(fn ($role) => in_array($role->name, TenantAccessRoleDefaults::TEMPLATE_KEYS, true))
            ->map(fn ($role) => [
                'id' => $role->name,
                'name' => $role->name,
                'label' => $role->label,
                'description' => $role->description ?? 'Starter permission set for a new school role',
                'category' => $this->roleCategory($role->name),
                'permissions' => $role->permissions->pluck('name')->values(),
            ]);
        $tenantRoles = TenantAccessRole::query()->with('permissions')->orderBy('name')->get()->map(fn (TenantAccessRole $role) => [
            'id' => $role->public_id,
            'name' => $role->name,
            'label' => $role->name,
            'description' => $role->description ?? '',
            'category' => $role->category,
            'type' => $role->template_key ? 'Default' : 'Custom',
            'protected' => false,
            'memberCount' => $memberships->filter(fn ($m) => (int) $m->tenant_access_role_id === (int) $role->getKey())->count(),
            'permissions' => $role->permissions->pluck('name')->values(),
            'templateKey' => $role->template_key,
        ]);

        $permissionCatalog = collect(PermissionRegistry::definitions())
            ->filter(fn (array $definition, string $name) => ($definition['delegable'] ?? false)
                && ! str_starts_with($name, 'platform.')
                && $name !== 'tenants.manage')
            ->map(fn (array $definition, string $name) => [
                'name' => $name,
                'description' => $definition['description'],
                'domain' => $definition['domain'],
                'delegable' => true,
            ])
            ->values();

        return ApiResponse::success([
            'roles' => $tenantRoles->values(),
            'templates' => $templates->values(),
            'categories' => ['Administration', 'Academic Leadership', 'Teaching', 'Finance', 'Student Services', 'Operations', 'Custom'],
            'permissions' => $permissionCatalog,
        ]);
    }

    public function storeAccessRole(Request $request, TenantContext $context, AuditLogger $audit, TenantAccessRoleDefaults $defaults): JsonResponse
    {
        $this->assertSuperAdmin($context);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('tenant_access_roles', 'name')->where('tenant_id', $context->tenantId())],
            'description' => ['nullable', 'string', 'max:500'],
            'category' => ['nullable', 'string', 'max:64'],
            'templateKey' => ['nullable', 'string', 'max:80'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:120'],
        ]);

        $this->assertNotReservedAccessRoleName($data['name']);

        $role = TenantAccessRole::query()->create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? 'Custom',
            'template_key' => $data['templateKey'] ?? null,
        ]);

        $permissionNames = $data['permissions'] ?? [];
        if ($permissionNames === [] && ! empty($data['templateKey'])) {
            $template = Role::query()->with('permissions')->where('name', $data['templateKey'])->first();
            $permissionNames = $template?->permissions->pluck('name')->all() ?? [];
        }
        $synced = $defaults->syncDelegablePermissions($role, $permissionNames);
        $audit->record('access_role.created', $role, [], [
            'name' => $role->name,
            'category' => $role->category,
            'permissions' => $synced,
        ]);

        return ApiResponse::success($this->presentAccessRole($role->fresh('permissions')), [], 201);
    }

    public function updateAccessRole(string $accessRole, Request $request, TenantContext $context, AuditLogger $audit, TenantAccessRoleDefaults $defaults): JsonResponse
    {
        $this->assertSuperAdmin($context);
        $role = TenantAccessRole::query()->where('public_id', $accessRole)->firstOrFail();
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120', Rule::unique('tenant_access_roles', 'name')->where('tenant_id', $context->tenantId())->ignore($role->getKey())],
            'description' => ['nullable', 'string', 'max:500'],
            'category' => ['nullable', 'string', 'max:64'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'max:120'],
        ]);

        if (isset($data['name'])) {
            $this->assertNotReservedAccessRoleName($data['name']);
            $role->name = $data['name'];
        }
        if (array_key_exists('description', $data)) {
            $role->description = $data['description'];
        }
        if (array_key_exists('category', $data)) {
            $role->category = $data['category'];
        }
        $before = ['name' => $role->getOriginal('name'), 'permissions' => $role->permissions()->pluck('name')->all()];
        $role->save();
        $synced = array_key_exists('permissions', $data)
            ? $defaults->syncDelegablePermissions($role, $data['permissions'])
            : $role->permissions()->pluck('name')->all();
        $audit->record('access_role.updated', $role, $before, [
            'name' => $role->name,
            'permissions' => $synced,
        ]);

        return ApiResponse::success($this->presentAccessRole($role->fresh('permissions')));
    }

    public function destroyAccessRole(string $accessRole, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $this->assertSuperAdmin($context);
        $role = TenantAccessRole::query()->where('public_id', $accessRole)->firstOrFail();
        abort_if($role->memberships()->exists(), 422, 'Remove this access role from all users before deleting it.');
        $audit->record('access_role.deleted', $role, ['name' => $role->name], []);
        $role->delete();

        return ApiResponse::success(['deleted' => true]);
    }

    /** @param list<string> $permissionNames */
    private function assertNotReservedAccessRoleName(string $name): void
    {
        $normalized = mb_strtolower(trim($name));
        $reserved = collect(SchoolRoles::reservedAccessRoleNames())
            ->flatMap(fn (string $role) => [$role, str_replace('_', ' ', $role)])
            ->map(fn (string $role) => mb_strtolower($role))
            ->unique()
            ->all();
        abort_if(in_array($normalized, $reserved, true), 422, 'That name is reserved for a system access role.');
    }

    private function presentAccessRole(TenantAccessRole $role): array
    {
        return [
            'id' => $role->public_id,
            'name' => $role->name,
            'label' => $role->name,
            'description' => $role->description,
            'category' => $role->category,
            'type' => $role->template_key ? 'Default' : 'Custom',
            'protected' => false,
            'memberCount' => $role->memberships()->count(),
            'permissions' => $role->permissions->pluck('name')->values(),
            'templateKey' => $role->template_key,
        ];
    }

    private function roleCategory(string $name): string
    {
        return match ($name) {
            SchoolRoles::SCHOOL_SUPER_ADMIN, SchoolRoles::SCHOOL_ADMIN => 'Administration',
            'principal', 'head_teacher' => 'Academic Leadership',
            'teacher' => 'Teaching',
            'bursar' => 'Finance',
            'examination_officer', 'admission_officer' => 'Student Services',
            'parent', 'student' => 'Student Services',
            default => 'Operations',
        };
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
            'accessRoleId' => $membership->accessRole?->public_id,
            'accessRoleLabel' => $membership->accessRole?->name,
            'user' => [
                'id' => $membership->user?->public_id,
                'name' => $membership->user?->name,
                'email' => $membership->user?->email,
                'status' => $membership->user?->status,
                'lastAccess' => $membership->user?->last_login_at?->toIso8601String(),
            ],
        ];
    }
}
