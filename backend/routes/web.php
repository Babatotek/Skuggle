<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\HealthController;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;
use Illuminate\View\Middleware\ShareErrorsFromSession;

/*
|--------------------------------------------------------------------------
| Health / Readiness Endpoints
|--------------------------------------------------------------------------
| These routes are intentionally unauthenticated and registered on the
| web router (no /api prefix) so load balancers and Kubernetes probes
| can reach them without auth headers or URL prefixes.
|
| /health        — always 200 if the PHP process is alive (uptime monitor)
| /ready         — 200 only when DB + cache + FS are all healthy (LB probe)
| /startup       — 200 after migrations table is accessible (k8s startup probe)
| /live          — alias of health for Kubernetes liveness probes
|
| They must stay stateless: StartSession on these paths writes a MySQL
| session row (and Set-Cookie) on every probe, which contends for the
| Hostinger max_user_connections=50 limit and makes CDN treat later HTML
| requests as DYNAMIC once the browser has cookies.
*/

$statelessHealthMiddleware = [
    EncryptCookies::class,
    AddQueuedCookiesToResponse::class,
    StartSession::class,
    ShareErrorsFromSession::class,
    PreventRequestForgery::class,
];

Route::withoutMiddleware($statelessHealthMiddleware)->group(function (): void {
    Route::get('/health', [HealthController::class, 'health']);
    Route::get('/ready', [HealthController::class, 'ready']);
    Route::get('/startup', [HealthController::class, 'startup']);
    Route::get('/live', [HealthController::class, 'live']);
});

// Email verification links land here (browser redirect), then bounce to the SPA.
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('skuggle.verification.verify');
