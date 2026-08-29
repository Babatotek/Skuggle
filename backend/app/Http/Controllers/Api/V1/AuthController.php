<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\SessionPresenter;
use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AcademicSession;
use App\Models\Campus;
use App\Models\TenantMembership;
use App\Models\Term;
use App\Models\User;
use App\Notifications\WelcomeToSkuggleNotification;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;

class AuthController extends Controller
{
    public function login(LoginRequest $request, TenantContext $context, SessionPresenter $presenter, AuditLogger $audit): JsonResponse
    {
        $email = $request->string('email')->toString();
        $user = User::query()->where('email', $email)->first();
        $validAccount = $user && $user->status === 'active' && (! $user->locked_until || $user->locked_until->isPast());

        $remember = $request->boolean('remember');
        if (! $validAccount || ! Auth::attempt(['email' => $email, 'password' => $request->string('password')->toString()], $remember)) {
            if ($user) {
                $attempts = $user->failed_login_attempts + 1;
                $user->forceFill(['failed_login_attempts' => $attempts, 'locked_until' => $attempts >= 5 ? now()->addMinutes(15) : null])->save();
            }
            DB::table('security_events')->insert([
                'tenant_id' => null, 'user_id' => $user?->getKey(), 'event_type' => 'authentication.failed', 'severity' => 'warning',
                'ip_hash' => hash_hmac('sha256', (string) $request->ip(), (string) config('app.key')), 'metadata' => json_encode(['email_hash' => hash('sha256', $email)]), 'occurred_at' => now(),
            ]);

            return ApiResponse::error('INVALID_CREDENTIALS', 'These credentials do not match our records.', 401);
        }

        $user = $request->user();
        if ($user && ! $user->hasVerifiedEmail()) {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return ApiResponse::error(
                'EMAIL_UNVERIFIED',
                'Verify your email address before signing in.',
                403,
                ['email' => [$email]],
            );
        }

        if ($user->two_factor_confirmed_at && $user->two_factor_secret) {
            $request->session()->put(['login.id' => $user->getKey(), 'login.remember' => $remember]);
            Auth::guard('web')->logout();

            return ApiResponse::error('MFA_CHALLENGE_REQUIRED', 'Enter an authenticator code or recovery code to complete sign in.', 409);
        }

        return $this->completeLogin($request, $context, $presenter, $audit);
    }

    public function twoFactorChallenge(Request $request, TenantContext $context, SessionPresenter $presenter, AuditLogger $audit, TwoFactorAuthenticationProvider $provider): JsonResponse
    {
        $data = $request->validate(['code' => ['nullable', 'string', 'max:20', 'required_without:recovery_code'], 'recovery_code' => ['nullable', 'string', 'max:100', 'required_without:code']]);
        $user = User::query()->find($request->session()->get('login.id'));
        if (! $user || ! $user->two_factor_secret) {
            return ApiResponse::error('MFA_CHALLENGE_EXPIRED', 'The sign-in challenge expired. Start again.', 401);
        }
        $valid = false;
        if (! empty($data['code'])) {
            try {
                $valid = $provider->verify(decrypt($user->two_factor_secret), $data['code']);
            } catch (\Throwable) {
                $valid = false;
            }
        }
        if (! empty($data['recovery_code'])) {
            $valid = in_array($data['recovery_code'], $user->recoveryCodes(), true);
            if ($valid) {
                $user->replaceRecoveryCode($data['recovery_code']);
            }
        }
        if (! $valid) {
            return ApiResponse::error('INVALID_MFA_CODE', 'The authentication code is invalid or expired.', 422);
        }
        $remember = (bool) $request->session()->pull('login.remember', false);
        $request->session()->forget('login.id');
        Auth::guard('web')->login($user, $remember);

        return $this->completeLogin($request, $context, $presenter, $audit);
    }

    private function completeLogin(Request $request, TenantContext $context, SessionPresenter $presenter, AuditLogger $audit): JsonResponse
    {
        $user = $request->user();
        if ($user && ! $user->hasVerifiedEmail()) {
            $email = (string) $user->email;
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return ApiResponse::error(
                'EMAIL_UNVERIFIED',
                'Verify your email address before signing in.',
                403,
                ['email' => [$email]],
            );
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
        $user = $request->user();
        $preferredTenantId = $request->hasSession() ? $request->session()->get('tenant_public_id') : null;
        $membership = null;
        if ($preferredTenantId) {
            $membership = $user->memberships()
                ->with(['tenant', 'role.permissions'])
                ->where('status', 'active')
                ->whereHas('tenant', fn ($q) => $q->where('public_id', $preferredTenantId)->whereIn('status', ['active', 'trial']))
                ->first();
        }
        $membership ??= $this->defaultMembership($user);
        if (! $membership || ! in_array($membership->tenant->status, ['active', 'trial'], true)) {
            Auth::logout();
            $request->session()->invalidate();

            return ApiResponse::error('WORKSPACE_UNAVAILABLE', 'No active workspace is available for this account.', 403);
        }

        $request->session()->put('tenant_public_id', $membership->tenant->public_id);
        $context->set($membership->tenant, $membership);
        try {
            $this->setDefaultAcademicContext($request);
            $user->forceFill(['failed_login_attempts' => 0, 'locked_until' => null, 'last_login_at' => now()])->save();
            $audit->record('authentication.succeeded', $user);

            return ApiResponse::success(['user' => $presenter->present($user, $membership)]);
        } finally {
            $context->clear();
        }
    }

    public function memberships(Request $request): JsonResponse
    {
        $items = $this->switchableMemberships($request->user())
            ->map(fn (TenantMembership $membership) => $this->presentMembership($membership))
            ->values();

        return ApiResponse::success(['data' => $items]);
    }

    public function switchWorkspace(Request $request, TenantContext $context, SessionPresenter $presenter, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'tenantId' => ['required', 'string'],
        ]);

        $membership = $this->switchableMemberships($request->user())
            ->first(fn (TenantMembership $item) => $item->tenant?->public_id === $data['tenantId']);

        if (! $membership) {
            return ApiResponse::error('WORKSPACE_UNAVAILABLE', 'That workspace is not available for this account.', 403);
        }

        $request->session()->put('tenant_public_id', $membership->tenant->public_id);
        $request->session()->forget(['campus_public_id', 'academic_session_public_id', 'term_public_id']);
        $context->set($membership->tenant, $membership);
        try {
            $this->setDefaultAcademicContext($request);
            $audit->record('authentication.workspace_switched', $request->user(), [], [
                'tenant' => $membership->tenant->code,
                'role' => $membership->role->name,
            ]);

            return ApiResponse::success(['user' => $presenter->present($request->user(), $membership)]);
        } finally {
            $context->clear();
        }
    }

    /**
     * @return Collection<int, TenantMembership>
     */
    private function switchableMemberships(User $user)
    {
        return $user->memberships()
            ->with(['tenant', 'role.permissions'])
            ->where('status', 'active')
            ->get()
            ->filter(function (TenantMembership $membership): bool {
                $tenant = $membership->tenant;
                if (! $tenant) {
                    return false;
                }
                // Personal spaces always available; hide suspended schools (trial stays visible for onboarding).
                if ($tenant->type === 'individual') {
                    return in_array($tenant->status, ['active', 'trial'], true);
                }

                return in_array($tenant->status, ['active', 'trial'], true);
            })
            ->values();
    }

    private function defaultMembership(User $user): ?TenantMembership
    {
        $switchable = $this->switchableMemberships($user)->sortByDesc(fn (TenantMembership $m) => $m->joined_at)->values();
        if ($switchable->isNotEmpty()) {
            return $switchable->first();
        }

        return $user->memberships()
            ->with(['tenant', 'role.permissions'])
            ->where('status', 'active')
            ->whereHas('tenant', fn ($q) => $q->whereIn('status', ['active', 'trial']))
            ->orderByDesc('joined_at')
            ->first();
    }

    private function presentMembership(TenantMembership $membership): array
    {
        return [
            'tenantId' => $membership->tenant->public_id,
            'tenantName' => $membership->tenant->name,
            'tenantCode' => $membership->tenant->code,
            'tenantType' => $membership->tenant->type,
            'tenantStatus' => $membership->tenant->status,
            'role' => $membership->role->name,
            'roleLabel' => $membership->role->label,
            'logoUrl' => data_get($membership->tenant->settings, 'branding.logo_url'),
        ];
    }

    public function me(Request $request, SessionPresenter $presenter): JsonResponse
    {
        return ApiResponse::success(['user' => $presenter->present($request->user())]);
    }

    public function logout(Request $request, AuditLogger $audit): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $audit->record('authentication.logout', $user);
            $user->currentAccessToken()?->delete();
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return ApiResponse::success(null);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email:rfc', 'max:254']]);
        Password::sendResetLink(['email' => mb_strtolower((string) $request->input('email'))]);

        return ApiResponse::success(['message' => 'If an account exists for that address, a reset link will be sent.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email:rfc', 'max:254'],
            'password' => ['required', 'string', 'min:10', 'confirmed'],
        ]);

        $status = Password::reset(
            [
                'email' => mb_strtolower($data['email']),
                'password' => $data['password'],
                'password_confirmation' => $request->input('password_confirmation'),
                'token' => $data['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'failed_login_attempts' => 0,
                    'locked_until' => null,
                ])->save();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return ApiResponse::error('PASSWORD_RESET_FAILED', __($status), 422);
        }

        return ApiResponse::success(['message' => 'Password has been reset. You can sign in now.']);
    }

    public function verifyEmail(Request $request, string $id, string $hash): RedirectResponse
    {
        $frontend = rtrim((string) config('skuggle.frontend_url'), '/');
        $user = $this->findUserForVerification($id);

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
            return redirect()->away("{$frontend}/verify-email?status=invalid");
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
            $this->auditVerification($user);
            $user->notify(new WelcomeToSkuggleNotification);
        }

        return redirect()->away("{$frontend}/verify-email?status=success");
    }

    /**
     * Resolve verification links by public ULID or numeric id without
     * letting MySQL coerce a ULID string into the wrong integer row.
     */
    private function findUserForVerification(string $id): ?User
    {
        if (ctype_digit($id)) {
            return User::query()->find((int) $id);
        }

        return User::query()->where('public_id', $id)->first();
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return ApiResponse::success(['message' => 'Email is already verified.', 'alreadyVerified' => true]);
        }

        $user->sendEmailVerificationNotification();

        return ApiResponse::success(['message' => 'A new verification link has been sent.']);
    }

    /**
     * Public resend for newly registered users who are not signed in yet.
     * Always returns the same success payload to avoid email enumeration.
     */
    public function resendVerificationByEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:254'],
        ]);

        $user = User::query()->where('email', mb_strtolower(trim($validated['email'])))->first();
        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return ApiResponse::success(['message' => 'If that account needs verification, a new link has been sent.']);
    }

    public function contexts(): JsonResponse
    {
        return ApiResponse::success([
            'campuses' => Campus::query()->where('status', 'active')->orderBy('name')->get(['public_id', 'name'])->map(fn ($item) => ['id' => $item->public_id, 'name' => $item->name]),
            'sessions' => AcademicSession::query()->where('status', 'active')->orderByDesc('starts_at')->get(['public_id', 'name'])->map(fn ($item) => ['id' => $item->public_id, 'name' => $item->name]),
            'terms' => Term::query()->with('academicSession:id,public_id')->orderBy('sequence')->get(['public_id', 'academic_session_id', 'name'])->map(fn ($item) => ['id' => $item->public_id, 'name' => $item->name, 'sessionId' => $item->academicSession?->public_id]),
        ]);
    }

    public function updateContext(Request $request, SessionPresenter $presenter, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate(['campusId' => ['nullable', 'string'], 'sessionId' => ['nullable', 'string'], 'termId' => ['nullable', 'string']]);
        $campus = isset($data['campusId']) ? Campus::query()->where('public_id', $data['campusId'])->firstOrFail() : null;
        $session = isset($data['sessionId']) ? AcademicSession::query()->where('public_id', $data['sessionId'])->firstOrFail() : null;
        $term = isset($data['termId']) ? Term::query()->where('public_id', $data['termId'])->firstOrFail() : null;
        if ($term && $session && $term->academic_session_id !== $session->getKey()) {
            return ApiResponse::error('INVALID_CONTEXT', 'The selected term does not belong to the selected academic session.', 422);
        }
        $request->session()->put(['campus_public_id' => $campus?->public_id, 'academic_session_public_id' => $session?->public_id, 'term_public_id' => $term?->public_id]);
        $request->session()->migrate(true);
        $audit->record('academic_context.changed', $request->user(), [], array_filter($data));

        return ApiResponse::success(['user' => $presenter->present($request->user())]);
    }

    private function setDefaultAcademicContext(Request $request): void
    {
        $request->session()->put([
            'campus_public_id' => Campus::query()->where('status', 'active')->value('public_id'),
            'academic_session_public_id' => AcademicSession::query()->where('is_current', true)->value('public_id'),
            'term_public_id' => Term::query()->where('is_current', true)->value('public_id'),
        ]);
    }

    private function auditVerification(User $user): void
    {
        try {
            app(AuditLogger::class)->record('authentication.email_verified', $user);
        } catch (\Throwable) {
            // Verification must succeed even if audit logging is unavailable.
        }
    }
}
