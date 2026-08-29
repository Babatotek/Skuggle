<?php

namespace App\Providers;

use App\Domain\Library\AI\AIProvider;
use App\Domain\Library\AI\GeminiProvider;
use App\Domain\Library\AI\GroqProvider;
use App\Domain\Library\AI\NullAIProvider;
use App\Domain\Tenancy\TenantContext;
use App\Models\Assessment;
use App\Models\LibraryResource;
use App\Models\ReportJob;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Policies\AssessmentPolicy;
use App\Policies\AttendancePolicy;
use App\Policies\LibraryResourcePolicy;
use App\Policies\ReportJobPolicy;
use App\Policies\StudentPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(TenantContext::class, fn () => new TenantContext);
        $this->app->bind(AIProvider::class, function () {
            return match (config('skuggle.ai.provider')) {
                'gemini' => new GeminiProvider,
                'groq' => new GroqProvider,
                default => new NullAIProvider,
            };
        });
    }

    public function boot(): void
    {
        if (app()->environment('production')) {
            URL::forceScheme('https');
            $this->enforceProductionStorage();
        }

        Password::defaults(function () {
            // Keep personal + school registration aligned with the UI (8+ chars) in every environment.
            $rule = Password::min(8)->mixedCase()->numbers()->symbols();

            return app()->environment('testing') ? $rule : $rule->uncompromised();
        });

        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            return URL::temporarySignedRoute(
                'skuggle.verification.verify',
                Carbon::now()->addMinutes((int) Config::get('auth.verification.expire', 60)),
                [
                    // Prefer public ULID so links never collide with coerced integer IDs.
                    'id' => method_exists($notifiable, 'getRouteKey')
                        ? $notifiable->getRouteKey()
                        : $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ],
            );
        });

        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $frontend = rtrim((string) config('skuggle.frontend_url'), '/');

            return $frontend.'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);
        });

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by((string) ($request->user()?->getKey() ?? $request->ip())));
        RateLimiter::for('uploads', fn (Request $request) => Limit::perMinute(15)->by((string) ($request->user()?->getKey() ?? $request->ip())));
        RateLimiter::for('ai', fn (Request $request) => Limit::perMinute(10)->by((string) ($request->user()?->getKey() ?? $request->ip())));
        RateLimiter::for('public-results', fn (Request $request) => [Limit::perMinute(10)->by($request->ip()), Limit::perMinute(5)->by((string) $request->input('pin'))]);
        RateLimiter::for('public-ai', fn (Request $request) => Limit::perMinute(3)->by($request->ip()));

        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(Assessment::class, AssessmentPolicy::class);
        Gate::policy(SchoolClass::class, AttendancePolicy::class);
        Gate::policy(LibraryResource::class, LibraryResourcePolicy::class);
        Gate::policy(ReportJob::class, ReportJobPolicy::class);

        DB::listen(function (QueryExecuted $query): void {
            if ($query->time >= 100) {
                Log::warning('database.slow_query', [
                    'request_id' => app()->bound('request') ? request()->attributes->get('request_id') : null,
                    'time_ms' => $query->time,
                    'connection' => $query->connectionName,
                    'query_fingerprint' => hash('sha256', $query->sql),
                ]);
            }
        });
    }

    /**
     * Enforce that production deployments use an object-storage disk (S3/R2)
     * rather than local filesystem.
     *
     * Local storage silently breaks in multi-server deployments because each
     * node writes to its own disk — uploads on server A are invisible on server B.
     *
     * Throws a RuntimeException at boot time so the misconfiguration is caught
     * in staging/deployment pipelines before it reaches real users.
     *
     * Override: set STORAGE_LOCAL_ALLOWED=true to opt out (shared-hosting deploys
     * that intentionally run single-node with persistent local storage).
     */
    private function enforceProductionStorage(): void
    {
        if ((bool) config('skuggle.storage_local_allowed', false)) {
            return;
        }

        $libraryDisk = (string) config('skuggle.library.disk', 'local');
        $localDrivers = ['local', 'public'];

        if (in_array($libraryDisk, $localDrivers, true)) {
            throw new \RuntimeException(
                "Production storage misconfiguration: LIBRARY_DISK is set to '{$libraryDisk}' "
                .'(a local filesystem driver). Multi-server deployments will silently lose uploads. '
                .'Set LIBRARY_DISK=s3 and configure AWS_BUCKET / AWS_ACCESS_KEY_ID, '
                .'or set STORAGE_LOCAL_ALLOWED=true if this is an intentional single-node deployment.'
            );
        }

        // Verify the configured disk is actually reachable (fail fast at boot).
        // We only check if the disk config exists — actual connectivity is checked by /ready.
        $diskConfig = config("filesystems.disks.{$libraryDisk}");
        if (! $diskConfig) {
            throw new \RuntimeException(
                "Production storage misconfiguration: LIBRARY_DISK='{$libraryDisk}' is not "
                .'defined in config/filesystems.php disks. Add the disk configuration.'
            );
        }
    }
}
