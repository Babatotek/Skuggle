<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterIndividualRequest;
use App\Http\Requests\Auth\RegisterSchoolRequest;
use App\Models\Campus;
use App\Models\Employee;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantMembership;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\PersonalWorkspaceProvisioner;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    public function school(RegisterSchoolRequest $request, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $context, $audit): array {
            $tenant = Tenant::query()->create([
                'name' => $request->string('schoolName')->toString(),
                'slug' => $this->uniqueSlug($request->string('schoolName')->toString()),
                'code' => $request->string('schoolCode')->toString(),
                'type' => 'school',
                'status' => 'trial',
                'subscription_started_at' => now(),
                'subscription_expires_at' => now()->addDays(30),
                'settings' => [
                    'contact' => ['email' => $request->string('schoolEmail')->toString(), 'phone' => $request->string('phone')->toString(), 'address' => $request->string('address')->toString()],
                    'profile' => ['school_type' => $request->string('schoolType')->toString(), 'school_level' => $request->string('schoolLevel')->toString()],
                    'branding' => ['primary_colour' => $request->input('primaryColor', '#5B36E8')],
                ],
                'quota_limits' => ['users' => 250, 'students' => 1000, 'storage_bytes' => 5368709120, 'ai_requests_per_day' => 250],
                'quota_usage' => ['users' => 1, 'students' => 0, 'storage_bytes' => 0],
            ]);

            $user = User::query()->create([
                'name' => $request->string('adminName')->toString(),
                'email' => $request->string('adminEmail')->toString(),
                'phone' => $request->string('phone')->toString(),
                'password' => $request->string('password')->toString(),
            ]);
            $role = Role::query()->where('name', 'school_admin')->firstOrFail();
            $membership = TenantMembership::query()->create(['tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(), 'role_id' => $role->getKey(), 'status' => 'active', 'joined_at' => now()]);
            $context->set($tenant, $membership->load('role.permissions', 'tenant'));
            Campus::query()->create(['name' => 'Main Campus', 'code' => 'MAIN', 'status' => 'active']);

            if ($request->hasFile('logo')) {
                $disk = (string) config('skuggle.library.disk');
                $path = $request->file('logo')->store("tenants/{$tenant->public_id}/branding", $disk);
                $settings = $tenant->settings;
                data_set($settings, 'branding.logo_key', $path);
                try {
                    data_set($settings, 'branding.logo_url', Storage::disk($disk)->url($path));
                } catch (\Throwable) { /* private disks intentionally expose no URL */
                }
                $tenant->update(['settings' => $settings]);
            }

            $audit->record('tenant.registered', $tenant, [], ['code' => $tenant->code, 'type' => 'school']);
            // School admins also receive My Skuggle so joining/creating a school never replaces personal ownership.
            app(PersonalWorkspaceProvisioner::class)->ensureFor($user, 'teacher');
            $context->clear();
            $this->dispatchRegistered($user);

            return ['schoolId' => $tenant->public_id, 'requiresVerification' => true, 'personalWorkspace' => true];
        });

        return ApiResponse::success($result, [], 201);
    }

    public function individual(RegisterIndividualRequest $request, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $inviteToken = trim((string) $request->input('schoolInvitationCode', ''));
        if ($inviteToken !== '') {
            $joined = $this->registerViaInvite($request, $inviteToken, $context, $audit);
            if ($joined !== null) {
                return $joined;
            }

            return ApiResponse::error(
                'INVITE_INVALID',
                'That invitation or school code is invalid or expired. Leave it blank to create a personal space.',
                422,
            );
        }

        $result = DB::transaction(function () use ($request, $context, $audit): array {
            $accountType = $request->string('accountType')->toString();
            $name = trim($request->string('firstName')->toString().' '.$request->string('lastName')->toString());
            $tenant = Tenant::query()->create([
                'name' => $name."'s Learning Space",
                'slug' => $this->uniqueSlug($name.' learning'),
                'code' => 'IND-'.Str::upper(Str::random(12)),
                'type' => 'individual',
                'status' => 'active',
                'subscription_plan' => 'free',
                'subscription_status' => 'active',
                'subscription_started_at' => now(),
                'quota_limits' => ['users' => 3, 'students' => 3, 'storage_bytes' => 524288000, 'ai_requests_per_day' => 10],
                'quota_usage' => ['users' => 1, 'students' => $accountType === 'student' ? 1 : 0, 'storage_bytes' => 0],
                'settings' => ['profile' => ['class_name' => $request->input('className')]],
            ]);
            $user = User::query()->create(['name' => $name, 'email' => $request->string('email')->toString(), 'password' => $request->string('password')->toString()]);
            $role = Role::query()->where('name', $accountType)->firstOrFail();
            $membership = TenantMembership::query()->create(['tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(), 'role_id' => $role->getKey(), 'status' => 'active', 'joined_at' => now()]);
            $context->set($tenant, $membership->load('role.permissions', 'tenant'));

            if ($accountType === 'parent') {
                Guardian::query()->create(['user_id' => $user->getKey(), 'name' => $name, 'phone' => 'not-provided', 'email' => $user->email]);
            }

            if ($accountType === 'teacher') {
                Employee::query()->create([
                    'user_id' => $user->getKey(),
                    'employee_number' => 'IND-'.Str::upper(Str::random(8)),
                    'name' => $name,
                    'employment_type' => 'independent',
                    'started_at' => now()->toDateString(),
                    'status' => 'active',
                ]);
            }

            $audit->record('individual.registered', $user, [], ['account_type' => $accountType, 'guardian_consent' => $request->boolean('guardianConsent')]);
            $context->clear();
            $this->dispatchRegistered($user);

            return ['accountId' => $user->public_id, 'workspace' => 'personal', 'requiresVerification' => true];
        });

        return ApiResponse::success($result, [], 201);
    }

    private function registerViaInvite(
        RegisterIndividualRequest $request,
        string $token,
        TenantContext $context,
        AuditLogger $audit,
    ): ?JsonResponse {
        $invite = TenantInvitation::query()
            ->withoutGlobalScopes()
            ->with(['role', 'tenant'])
            ->where('token_hash', TenantInvitation::hashToken($token))
            ->first();

        if (! $invite || ! $invite->isOpen() || ! in_array($invite->tenant->status, ['active', 'trial'], true)) {
            return null;
        }

        $email = mb_strtolower($request->string('email')->toString());
        if ($email !== $invite->email) {
            return ApiResponse::error('INVITE_EMAIL_MISMATCH', 'Use the email address this invitation was sent to.', 422);
        }

        $result = DB::transaction(function () use ($request, $invite, $email, $audit, $context): array {
            $name = trim($request->string('firstName')->toString().' '.$request->string('lastName')->toString());
            $user = User::query()->create([
                'name' => $name,
                'email' => $email,
                'password' => $request->string('password')->toString(),
                'email_verified_at' => now(),
                'status' => 'active',
            ]);

            $membership = TenantMembership::query()->create([
                'tenant_id' => $invite->tenant_id,
                'user_id' => $user->getKey(),
                'role_id' => $invite->role_id,
                'status' => 'active',
                'joined_at' => now(),
                'invited_by' => $invite->invited_by,
            ]);

            $context->set($invite->tenant, $membership->load('role.permissions', 'tenant'));

            $roleName = $invite->role->name;
            if ($roleName === 'parent') {
                Guardian::query()->create([
                    'user_id' => $user->getKey(),
                    'name' => $name,
                    'phone' => 'not-provided',
                    'email' => $email,
                ]);
            }
            if (in_array($roleName, ['teacher', 'bursar', 'principal', 'school_admin', 'examination_officer', 'admission_officer'], true)) {
                Employee::query()->create([
                    'user_id' => $user->getKey(),
                    'employee_number' => 'INV-'.Str::upper(Str::random(8)),
                    'name' => $name,
                    'employment_type' => 'full_time',
                    'started_at' => now()->toDateString(),
                    'status' => 'active',
                ]);
            }

            // Personal My Skuggle remains owned by the user; school membership is additive.
            $accountType = $request->string('accountType')->toString();
            app(PersonalWorkspaceProvisioner::class)->ensureFor($user, $accountType);

            $invite->forceFill([
                'status' => 'accepted',
                'accepted_at' => now(),
                'accepted_user_id' => $user->getKey(),
            ])->save();

            $audit->record('invite.accepted_via_register', $invite, [], ['user_id' => $user->public_id]);
            $context->clear();
            $this->dispatchRegistered($user);

            return [
                'accountId' => $user->public_id,
                'workspace' => 'school',
                'tenantId' => $invite->tenant->public_id,
                'role' => $roleName,
                'personalWorkspace' => true,
                'requiresVerification' => false,
            ];
        });

        return ApiResponse::success($result, [], 201);
    }

    /**
     * Fire Registered after commit so mail/route failures never roll back the account.
     */
    private function dispatchRegistered(User $user): void
    {
        DB::afterCommit(function () use ($user): void {
            try {
                event(new Registered($user));
            } catch (\Throwable $e) {
                report($e);
            }
        });
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'workspace';
        $slug = $base;
        $suffix = 1;
        while (Tenant::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}
