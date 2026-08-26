<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    | Horizon exposes a dashboard at /horizon. In production this should be
    | behind authentication — see the gate in HorizonServiceProvider.
    */

    'domain' => env('HORIZON_DOMAIN'),
    'path'   => env('HORIZON_PATH', 'horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    */

    'use' => 'default',

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Prefix
    |--------------------------------------------------------------------------
    */

    'prefix' => env(
        'HORIZON_PREFIX',
        Str::slug(env('APP_NAME', 'laravel'), '_').'_horizon:'
    ),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds (seconds)
    |--------------------------------------------------------------------------
    | Alerts are triggered when a queue wait time exceeds these values.
    */

    'waits' => [
        'redis:default' => 60,
        'redis:exports' => 120,
        'redis:reports' => 120,
        'redis:ai'      => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Job Trimming
    |--------------------------------------------------------------------------
    | How long (in minutes) to keep completed/failed jobs in the Horizon store.
    */

    'trim' => [
        'recent'          => 60,
        'pending'         => 60,
        'completed'       => 90,
        'recent_failed'   => 10080,  // 7 days
        'failed'          => 10080,
        'monitored'       => 10080,
    ],

    /*
    |--------------------------------------------------------------------------
    | Silenced Jobs
    |--------------------------------------------------------------------------
    | Jobs listed here won't appear in the recent/completed lists, reducing noise.
    */

    'silenced' => [],

    /*
    |--------------------------------------------------------------------------
    | Metrics
    |--------------------------------------------------------------------------
    */

    'metrics' => [
        'trim_snapshots' => [
            'job'   => 24,
            'queue' => 24,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fast Termination
    |--------------------------------------------------------------------------
    */

    'fast_termination' => false,

    /*
    |--------------------------------------------------------------------------
    | Memory Limit (MB)
    |--------------------------------------------------------------------------
    */

    'memory_limit' => (int) env('HORIZON_MEMORY_LIMIT', 256),

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Environments
    |--------------------------------------------------------------------------
    | Workers are tuned per environment:
    |   local/testing — single process, minimal resources
    |   production    — dedicated pools per queue with autoscaling
    */

    'environments' => [

        'production' => [
            // Default catch-all queue
            'supervisor-default' => [
                'connection'  => 'redis',
                'queue'       => ['default'],
                'balance'     => 'auto',
                'autoScalingStrategy' => 'time',
                'minProcesses' => 1,
                'maxProcesses' => (int) env('HORIZON_MAX_PROCESSES', 10),
                'balanceMaxShift'   => 1,
                'balanceCooldown'   => 3,
                'memory'      => 128,
                'tries'       => 3,
                'timeout'     => 60,
                'nice'        => 0,
            ],

            // AI-generation queue — isolated so slow AI calls don't block other work
            'supervisor-ai' => [
                'connection'  => 'redis',
                'queue'       => ['ai'],
                'balance'     => 'simple',
                'minProcesses' => 1,
                'maxProcesses' => (int) env('HORIZON_AI_MAX_PROCESSES', 3),
                'memory'      => 256,
                'tries'       => 2,
                'timeout'     => (int) env('AI_REQUEST_TIMEOUT', 45) + 15,
                'nice'        => 5,
            ],

            // Export/report queue — CPU-intensive PDF generation
            'supervisor-exports' => [
                'connection'  => 'redis',
                'queue'       => ['exports', 'reports'],
                'balance'     => 'simple',
                'minProcesses' => 1,
                'maxProcesses' => (int) env('HORIZON_EXPORT_MAX_PROCESSES', 4),
                'memory'      => 512,
                'tries'       => 3,
                'timeout'     => 360,
                'nice'        => 10,
            ],
        ],

        'local' => [
            'supervisor-local' => [
                'connection'   => 'redis',
                'queue'        => ['default', 'ai', 'exports', 'reports'],
                'balance'      => 'simple',
                'minProcesses' => 1,
                'maxProcesses' => 2,
                'memory'       => 256,
                'tries'        => 3,
                'timeout'      => 360,
                'nice'         => 0,
            ],
        ],

        'testing' => [
            'supervisor-testing' => [
                'connection'   => 'sync',
                'queue'        => ['default'],
                'balance'      => 'simple',
                'minProcesses' => 1,
                'maxProcesses' => 1,
                'memory'       => 128,
                'tries'        => 1,
                'timeout'      => 60,
                'nice'         => 0,
            ],
        ],
    ],

];
