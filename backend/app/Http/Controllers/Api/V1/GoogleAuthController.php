<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\SessionPresenter;
use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): JsonResponse|RedirectResponse
    {
        if (! config('services.google.enabled')) {
            return ApiResponse::error(
                'GOOGLE_SUSPENDED',
                'Google sign-in is temporarily unavailable. Use email and password instead.',
                503,
            );
        }

        $clientId = (string) config('services.google.client_id');
        if ($clientId === '') {
            return ApiResponse::error('GOOGLE_NOT_CONFIGURED', 'Google sign-in is not configured on this server.', 503);
        }

        $intent = $request->query('intent', 'login'); // login | signup
        $accountType = $request->query('accountType', 'student');
        if (! in_array($accountType, ['student', 'parent', 'teacher'], true)) {
            $accountType = 'student';
        }

        $state = Str::random(40);
        $request->session()->put('google.oauth', [
            'state' => $state,
            'intent' => $intent === 'signup' ? 'signup' : 'login',
            'accountType' => $accountType,
            'returnTo' => $this->safeReturnPath((string) $request->query('returnTo', '/app')),
        ]);

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $this->callbackUrl(),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'online',
            'prompt' => 'select_account',
            'state' => $state,
        ]);

        $url = 'https://accounts.google.com/o/oauth2/v2/auth?'.$query;

        if ($request->expectsJson() || $request->query('format') === 'json') {
            return ApiResponse::success(['url' => $url]);
        }

        return redirect()->away($url);
    }

    public function callback(
        Request $request,
        TenantContext $context,
        SessionPresenter $presenter,
        AuditLogger $audit,
    ): RedirectResponse {
        $frontend = rtrim((string) config('skuggle.frontend_url'), '/');
        if (! config('services.google.enabled')) {
            return redirect($frontend.'/login?oauth=suspended');
        }

        $oauth = $request->session()->pull('google.oauth', []);
        $returnTo = $this->safeReturnPath((string) ($oauth['returnTo'] ?? '/app'));

        if ($request->query('error')) {
            return redirect($frontend.'/login?oauth=denied');
        }

        if (! hash_equals((string) ($oauth['state'] ?? ''), (string) $request->query('state'))) {
            return redirect($frontend.'/login?oauth=invalid_state');
        }

        $code = (string) $request->query('code');
        if ($code === '') {
            return redirect($frontend.'/login?oauth=missing_code');
        }

        try {
            $profile = $this->exchangeCode($code);
        } catch (\Throwable $e) {
            report($e);

            return redirect($frontend.'/login?oauth=token_failed');
        }

        $email = mb_strtolower((string) ($profile['email'] ?? ''));
        $googleId = (string) ($profile['sub'] ?? '');
        $name = trim((string) ($profile['name'] ?? 'Skuggle User'));
        $avatar = $profile['picture'] ?? null;
        $emailVerified = (bool) ($profile['email_verified'] ?? false);

        if ($email === '' || $googleId === '') {
            return redirect($frontend.'/login?oauth=profile_incomplete');
        }

        $user = User::query()->where('google_id', $googleId)->orWhere('email', $email)->first();
        $intent = ($oauth['intent'] ?? 'login') === 'signup' ? 'signup' : 'login';

        if (! $user && $intent === 'login') {
            // First-time Google login → create personal space (quick signup).
            $intent = 'signup';
        }

        if (! $user) {
            $accountType = (string) ($oauth['accountType'] ?? 'student');
            $user = $this->createPersonalUser($name, $email, $googleId, $avatar, $emailVerified, $accountType, $audit);
        } else {
            $user->forceFill([
                'google_id' => $user->google_id ?: $googleId,
                'avatar_url' => $avatar ?: $user->avatar_url,
                'email_verified_at' => $user->email_verified_at ?? ($emailVerified ? now() : null),
                'status' => $user->status === 'active' ? 'active' : $user->status,
            ])->save();
        }

        if ($user->status !== 'active') {
            return redirect($frontend.'/login?oauth=account_inactive');
        }

        if ($user->two_factor_confirmed_at && $user->two_factor_secret) {
            $request->session()->put(['login.id' => $user->getKey(), 'login.remember' => true]);

            return redirect($frontend.'/login?mfa=1&returnTo='.urlencode($returnTo));
        }

        Auth::guard('web')->login($user, true);
        $request->session()->regenerate();

        $membership = $this->resolveDefaultMembership($user);
        if (! $membership) {
            Auth::logout();
            $request->session()->invalidate();

            return redirect($frontend.'/login?oauth=no_workspace');
        }

        $request->session()->put('tenant_public_id', $membership->tenant->public_id);
        $context->set($membership->tenant, $membership);
        try {
            $user->forceFill(['failed_login_attempts' => 0, 'locked_until' => null, 'last_login_at' => now()])->save();
            $audit->record('authentication.google_succeeded', $user);
        } finally {
            $context->clear();
        }

        return redirect($frontend.$returnTo);
    }

    /**
     * @return array{sub?: string, email?: string, name?: string, picture?: string, email_verified?: bool}
     */
    private function exchangeCode(string $code): array
    {
        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => $this->callbackUrl(),
            'grant_type' => 'authorization_code',
        ]);

        if (! $tokenResponse->successful()) {
            throw new \RuntimeException('Google token exchange failed: '.$tokenResponse->body());
        }

        $accessToken = (string) $tokenResponse->json('access_token');
        $profileResponse = Http::withToken($accessToken)->get('https://openidconnect.googleapis.com/v1/userinfo');
        if (! $profileResponse->successful()) {
            throw new \RuntimeException('Google profile fetch failed: '.$profileResponse->body());
        }

        return $profileResponse->json();
    }

    private function createPersonalUser(
        string $name,
        string $email,
        string $googleId,
        ?string $avatar,
        bool $emailVerified,
        string $accountType,
        AuditLogger $audit,
    ): User {
        return DB::transaction(function () use ($name, $email, $googleId, $avatar, $emailVerified, $accountType, $audit): User {
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

            $user = User::query()->create([
                'name' => $name,
                'email' => $email,
                'google_id' => $googleId,
                'avatar_url' => $avatar,
                'password' => Str::password(32),
                'email_verified_at' => $emailVerified ? now() : null,
                'status' => 'active',
            ]);

            $role = Role::query()->where('name', $accountType)->firstOrFail();
            TenantMembership::query()->create([
                'tenant_id' => $tenant->getKey(),
                'user_id' => $user->getKey(),
                'role_id' => $role->getKey(),
                'status' => 'active',
                'joined_at' => now(),
            ]);

            if ($accountType === 'parent') {
                Guardian::query()->create(['user_id' => $user->getKey(), 'name' => $name, 'phone' => 'not-provided', 'email' => $email]);
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

            $audit->record('individual.registered_google', $user, [], ['account_type' => $accountType]);

            return $user;
        });
    }

    private function resolveDefaultMembership(User $user): ?TenantMembership
    {
        return $user->memberships()
            ->with(['tenant', 'role.permissions'])
            ->where('status', 'active')
            ->whereHas('tenant', function ($q): void {
                $q->where(function ($inner): void {
                    $inner->where('type', 'individual')
                        ->orWhereIn('status', ['active']); // schools: hide trial/suspended from default
                });
            })
            ->orderByDesc('joined_at')
            ->first()
            ?? $user->memberships()
                ->with(['tenant', 'role.permissions'])
                ->where('status', 'active')
                ->whereHas('tenant', fn ($q) => $q->whereIn('status', ['active', 'trial']))
                ->orderByDesc('joined_at')
                ->first();
    }

    private function callbackUrl(): string
    {
        return rtrim((string) config('app.url'), '/').'/api/v1/auth/google/callback';
    }

    private function safeReturnPath(string $candidate): string
    {
        if ($candidate === '' || ! str_starts_with($candidate, '/') || str_starts_with($candidate, '//')) {
            return '/app';
        }

        return $candidate;
    }
}
