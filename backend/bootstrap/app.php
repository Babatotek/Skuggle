<?php

use App\Exceptions\ApiException;
use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\EnforceTenantQuota;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsurePublicAiEnabled;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\Idempotency;
use App\Http\Middleware\RequestMetrics;
use App\Http\Middleware\RequireMfaForPrivilegedRole;
use App\Http\Middleware\ResolveTenant;
use App\Http\Middleware\SecurityHeaders;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withProviders([
        App\Providers\HorizonServiceProvider::class,
        App\Providers\PulseServiceProvider::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->redirectGuestsTo(fn () => rtrim((string) config('skuggle.frontend_url'), '/').'/login');
        
        // Trusted proxies configuration with production safety
        // Use $_ENV because env() helper may not be available yet during app bootstrap
        $trustedProxies = $_ENV['TRUSTED_PROXIES'] ?? env('TRUSTED_PROXIES');
        $appEnv = $_ENV['APP_ENV'] ?? env('APP_ENV', 'production');
        
        if ($trustedProxies === '*' && $appEnv === 'production') {
            throw new RuntimeException(
                'TRUSTED_PROXIES cannot be "*" (wildcard) in production environment. ' .
                'Configure explicit proxy IP addresses or CIDR ranges for security. ' .
                'See deploy/PROXY_CONFIGURATION.md for details.'
            );
        }
        
        if ($trustedProxies === '*') {
            $middleware->trustProxies(at: '*');
        } elseif (! empty($trustedProxies)) {
            $middleware->trustProxies(at: array_filter(explode(',', $trustedProxies)));
        }
        
        $middleware->append([AssignRequestId::class, SecurityHeaders::class, RequestMetrics::class]);
        $middleware->api(prepend: [ForceJsonResponse::class]);
        $middleware->alias([
            'tenant' => ResolveTenant::class,
            'permission' => EnsurePermission::class,
            'quota' => EnforceTenantQuota::class,
            'idempotency' => Idempotency::class,
            // Privileged MFA enforced on mutating verified routes via alias `mfa`.
            'mfa' => RequireMfaForPrivilegedRole::class,
            'verified' => EnsureEmailIsVerified::class,
            'public.ai' => EnsurePublicAiEnabled::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('dashboard:rebuild-snapshots')->everyFiveMinutes()->withoutOverlapping();
        $schedule->command('idempotency:prune')->hourly();
        $schedule->command('exports:prune')->hourly();
        $schedule->command('queue:prune-failed --hours=168')->daily();
        $schedule->command('sync:prune-tokens')->daily();
        $schedule->command('backup:database --trigger=scheduled')->dailyAt('02:15')->withoutOverlapping();
        $schedule->command('backup:files')->weeklyOn(0, '03:00')->withoutOverlapping();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn () => true);
        $exceptions->render(fn (ApiException $e) => ApiResponse::error($e->errorCode, $e->getMessage(), $e->status, $e->fields));
        $exceptions->render(fn (ValidationException $e) => ApiResponse::error('VALIDATION_ERROR', 'The submitted information is invalid.', 422, $e->errors()));
        $exceptions->render(fn (AuthenticationException $e) => ApiResponse::error('UNAUTHENTICATED', 'Authentication is required.', 401));
        $exceptions->render(fn (AuthorizationException $e) => ApiResponse::error('FORBIDDEN', 'You do not have access to this resource.', 403));
        $exceptions->render(fn (ModelNotFoundException $e) => ApiResponse::error('NOT_FOUND', 'The requested resource was not found.', 404));
        $exceptions->render(fn (HttpExceptionInterface $e) => ApiResponse::error('HTTP_ERROR', $e->getStatusCode() >= 500 ? 'The server could not complete this request.' : $e->getMessage(), $e->getStatusCode()));
        $exceptions->dontFlash(['current_password', 'password', 'password_confirmation']);
    })
    ->create();
