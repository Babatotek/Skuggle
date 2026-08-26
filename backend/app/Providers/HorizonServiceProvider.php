<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap Horizon services.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Gate controlling access to the Horizon dashboard.
     *
     * Only users whose email matches HORIZON_ADMIN_EMAILS (comma-separated)
     * can access the dashboard in production.  In non-production environments
     * all authenticated users are allowed (safe for local/staging).
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user) {
            if (! app()->environment('production')) {
                return true;
            }

            $allowed = array_filter(array_map(
                'trim',
                explode(',', (string) env('HORIZON_ADMIN_EMAILS', ''))
            ));

            return in_array($user->email, $allowed, true);
        });
    }
}
