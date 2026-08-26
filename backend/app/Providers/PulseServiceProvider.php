<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/**
 * Gates the Pulse dashboard. Registers only when laravel/pulse is installed.
 *
 * Production install:
 *   composer require laravel/pulse
 *   php artisan migrate
 */
class PulseServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (! class_exists(\Laravel\Pulse\Pulse::class)) {
            return;
        }

        Gate::define('viewPulse', function ($user = null) {
            if ($user === null) {
                return false;
            }

            if (! app()->environment('production')) {
                return true;
            }

            $allowed = array_filter(array_map(
                'trim',
                explode(',', (string) env('PULSE_ADMIN_EMAILS', env('HORIZON_ADMIN_EMAILS', '')))
            ));

            return in_array($user->email, $allowed, true);
        });
    }
}
