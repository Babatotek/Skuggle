<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\TenantInvitation;
use App\Models\TenantMembership;
use App\Models\User;
use App\Notifications\TenantInvitationNotification;
use App\Services\AuditLogger;
use App\Services\PersonalWorkspaceProvisioner;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InviteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invites = TenantInvitation::query()
            ->with('role:id,name,label')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (TenantInvitation $invite) => $this->present($invite));

        return ApiResponse::success(['data' => $invites]);
    }

    public function store(Request $request, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:254'],
            'role' => ['required', 'string', Rule::in(['teacher', 'parent', 'student', 'bursar', 'principal', 'school_admin', 'examination_officer', 'admission_officer'])],
            'name' => ['nullable', 'string', 'max:180'],
            'expiresInDays' => ['nullable', 'integer', 'min:1', 'max:30'],
        ]);

        $role = Role::query()->where('name', $data['role'])->firstOrFail();
        $token = TenantInvitation::issueToken();
        $frontend = rtrim((string) config('skuggle.frontend_url'), '/');

        $invite = TenantInvitation::query()->create([
            'role_id' => $role->getKey(),
            'invited_by' => $request->user()->getKey(),
            'email' => mb_strtolower($data['email']),
            'token_hash' => TenantInvitation::hashToken($token),
            'plain_token_hint' => substr($token, 0, 8),
            'status' => 'pending',
            'expires_at' => now()->addDays((int) ($data['expiresInDays'] ?? 7)),
            'metadata' => [
                'name' => $data['name'] ?? null,
                'school_code' => $context->tenant()->code,
            ],
        ]);

        $registrationLink = "{$frontend}/join?invite={$token}";

        Notification::route('mail', $invite->email)->notify(new TenantInvitationNotification(
            schoolName: $context->tenant()->name,
            roleLabel: (string) $role->label,
            registrationLink: $registrationLink,
            expiresAt: $invite->expires_at?->toDayDateTimeString() ?? 'soon',
        ));

        $audit->record('invite.created', $invite, [], [
            'email_hash' => hash('sha256', $invite->email),
            'role' => $role->name,
            'email_queued' => true,
        ]);

        return ApiResponse::success([
            'invite' => $this->present($invite),
            'registrationLink' => $registrationLink,
            'token' => $token,
            'schoolCode' => $context->tenant()->code,
            'emailQueued' => true,
        ], [], 201);
    }

    public function show(string $token): JsonResponse
    {
        $invite = $this->findOpenInvite($token);
        if (! $invite) {
            return ApiResponse::error('INVITE_INVALID', 'This invitation is invalid or has expired.', 404);
        }

        return ApiResponse::success([
            'invite' => [
                'email' => $invite->email,
                'role' => $invite->role->name,
                'roleLabel' => $invite->role->label,
                'schoolName' => $invite->tenant->name,
                'schoolCode' => $invite->tenant->code,
                'expiresAt' => $invite->expires_at?->toIso8601String(),
                'suggestedName' => data_get($invite->metadata, 'name'),
            ],
        ]);
    }

    public function accept(Request $request, string $token, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $invite = $this->findOpenInvite($token);
        if (! $invite) {
            return ApiResponse::error('INVITE_INVALID', 'This invitation is invalid or has expired.', 404);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'password' => ['required', 'string', 'min:10', 'confirmed'],
            'email' => ['nullable', 'email:rfc', 'max:254'],
        ]);

        $email = mb_strtolower((string) ($data['email'] ?? $invite->email));
        if ($email !== $invite->email) {
            return ApiResponse::error('INVITE_EMAIL_MISMATCH', 'Use the email address this invitation was sent to.', 422);
        }

        $result = DB::transaction(function () use ($invite, $data, $email, $audit, $context): array {
            $user = User::query()->where('email', $email)->first();
            if (! $user) {
                $user = User::query()->create([
                    'name' => $data['name'],
                    'email' => $email,
                    'password' => $data['password'],
                    'email_verified_at' => now(),
                    'status' => 'active',
                ]);
                event(new Registered($user));
            }

            $membership = TenantMembership::query()->updateOrCreate(
                [
                    'tenant_id' => $invite->tenant_id,
                    'user_id' => $user->getKey(),
                ],
                [
                    'role_id' => $invite->role_id,
                    'status' => 'active',
                    'joined_at' => now(),
                    'invited_by' => $invite->invited_by,
                ],
            );

            $context->set($invite->tenant, $membership);
            try {
                $this->provisionRoleRecord($invite, $user, $data['name']);
                app(PersonalWorkspaceProvisioner::class)->ensureFor($user, $invite->role->name);
            } finally {
                $context->clear();
            }

            $invite->forceFill([
                'status' => 'accepted',
                'accepted_at' => now(),
                'accepted_user_id' => $user->getKey(),
            ])->save();

            $audit->record('invite.accepted', $invite, [], ['user_id' => $user->public_id]);

            return ['user' => $user, 'membership' => $membership->load('role.permissions', 'tenant')];
        });

        Auth::guard('web')->login($result['user']);
        $request->session()->regenerate();
        $request->session()->put('tenant_public_id', $invite->tenant->public_id);
        $context->set($invite->tenant, $result['membership']);

        return ApiResponse::success([
            'joined' => true,
            'tenantId' => $invite->tenant->public_id,
            'role' => $invite->role->name,
        ]);
    }

    public function destroy(TenantInvitation $invitation, AuditLogger $audit): JsonResponse
    {
        if ($invitation->status === 'pending') {
            $invitation->update(['status' => 'revoked']);
            $audit->record('invite.revoked', $invitation);
        }

        return ApiResponse::success(['revoked' => true]);
    }

    private function findOpenInvite(string $token): ?TenantInvitation
    {
        $invite = TenantInvitation::query()
            ->withoutGlobalScopes()
            ->with(['role', 'tenant'])
            ->where('token_hash', TenantInvitation::hashToken($token))
            ->first();

        if (! $invite || ! $invite->isOpen()) {
            return null;
        }

        if (! in_array($invite->tenant->status, ['active', 'trial'], true)) {
            return null;
        }

        return $invite;
    }

    private function provisionRoleRecord(TenantInvitation $invite, User $user, string $name): void
    {
        $role = $invite->role->name;
        $tenantId = $invite->tenant_id;

        if (in_array($role, ['teacher', 'bursar', 'principal', 'school_admin', 'examination_officer', 'admission_officer'], true)) {
            Employee::query()->firstOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'user_id' => $user->getKey(),
                ],
                [
                    'employee_number' => 'INV-'.Str::upper(Str::random(8)),
                    'name' => $name,
                    'employment_type' => 'full_time',
                    'started_at' => now()->toDateString(),
                    'status' => 'active',
                ],
            );
        }

        if ($role === 'parent') {
            Guardian::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'email' => $user->email,
                ],
                [
                    'user_id' => $user->getKey(),
                    'name' => $name,
                    'phone' => $user->phone ?: '00000000000',
                    'address' => ['text' => ''],
                ],
            );
        }
    }

    private function present(TenantInvitation $invite): array
    {
        return [
            'id' => $invite->public_id,
            'email' => $invite->email,
            'role' => $invite->role?->name,
            'roleLabel' => $invite->role?->label,
            'status' => $invite->status,
            'expiresAt' => $invite->expires_at?->toIso8601String(),
            'acceptedAt' => $invite->accepted_at?->toIso8601String(),
            'tokenHint' => $invite->plain_token_hint,
            'schoolCode' => data_get($invite->metadata, 'school_code'),
        ];
    }
}
