<?php

use Illuminate\Support\Str;

/**
 * Laravel Pulse configuration for Skuggle APM.
 *
 * Install on production / Linux CI:
 *   composer require laravel/pulse
 *   php artisan vendor:publish --tag=pulse-config
 *   php artisan migrate
 *
 * Dashboard is gated by PulseServiceProvider (same email allow-list pattern as Horizon).
 */
return [

    'domain' => env('PULSE_DOMAIN'),

    'path' => env('PULSE_PATH', 'pulse'),

    'enabled' => filter_var(env('PULSE_ENABLED', 'true'), FILTER_VALIDATE_BOOLEAN),

    'storage' => [
        'driver' => env('PULSE_STORAGE_DRIVER', 'database'),

        'database' => [
            'connection' => env('PULSE_DB_CONNECTION'),
            'chunk' => 1000,
        ],
    ],

    'ingest' => [
        'driver' => env('PULSE_INGEST_DRIVER', 'storage'),
        'buffer' => env('PULSE_INGEST_BUFFER', 5_000),
        'trim' => [
            'lottery' => [1, 1_000],
            'keep' => '7 days',
        ],
        'redis' => [
            'connection' => env('PULSE_REDIS_CONNECTION'),
            'chunk' => 1000,
        ],
    ],

    'cache' => env('PULSE_CACHE_DRIVER'),

    'recorders' => [
        \Laravel\Pulse\Recorders\CacheInteractions::class => [
            'enabled' => env('PULSE_CACHE_INTERACTIONS_ENABLED', true),
            'sample_rate' => env('PULSE_CACHE_INTERACTIONS_SAMPLE_RATE', 1),
            'ignore' => [
                '/^laravel:pulse:/',
                '/^skuggle:v1:tenant:/',
            ],
        ],

        \Laravel\Pulse\Recorders\Exceptions::class => [
            'enabled' => env('PULSE_EXCEPTIONS_ENABLED', true),
            'sample_rate' => env('PULSE_EXCEPTIONS_SAMPLE_RATE', 1),
            'location' => env('PULSE_EXCEPTIONS_LOCATION', true),
            'ignore' => [],
        ],

        \Laravel\Pulse\Recorders\Queues::class => [
            'enabled' => env('PULSE_QUEUES_ENABLED', true),
            'sample_rate' => env('PULSE_QUEUES_SAMPLE_RATE', 1),
            'ignore' => [],
        ],

        \Laravel\Pulse\Recorders\Servers::class => [
            'server_name' => env('PULSE_SERVER_NAME', gethostname()),
            'directories' => explode(':', env('PULSE_SERVER_DIRECTORIES', '/')),
        ],

        \Laravel\Pulse\Recorders\SlowJobs::class => [
            'enabled' => env('PULSE_SLOW_JOBS_ENABLED', true),
            'sample_rate' => env('PULSE_SLOW_JOBS_SAMPLE_RATE', 1),
            'threshold' => env('PULSE_SLOW_JOBS_THRESHOLD', 1000),
            'ignore' => [],
        ],

        \Laravel\Pulse\Recorders\SlowOutgoingRequests::class => [
            'enabled' => env('PULSE_SLOW_OUTGOING_REQUESTS_ENABLED', true),
            'sample_rate' => env('PULSE_SLOW_OUTGOING_REQUESTS_SAMPLE_RATE', 1),
            'threshold' => env('PULSE_SLOW_OUTGOING_REQUESTS_THRESHOLD', 1000),
            'ignore' => [],
            'groups' => [],
        ],

        \Laravel\Pulse\Recorders\SlowQueries::class => [
            'enabled' => env('PULSE_SLOW_QUERIES_ENABLED', true),
            'sample_rate' => env('PULSE_SLOW_QUERIES_SAMPLE_RATE', 1),
            'threshold' => env('PULSE_SLOW_QUERIES_THRESHOLD', 100),
            'location' => env('PULSE_SLOW_QUERIES_LOCATION', true),
            'max_query_length' => env('PULSE_SLOW_QUERIES_MAX_QUERY_LENGTH'),
            'ignore' => [],
        ],

        \Laravel\Pulse\Recorders\SlowRequests::class => [
            'enabled' => env('PULSE_SLOW_REQUESTS_ENABLED', true),
            'sample_rate' => env('PULSE_SLOW_REQUESTS_SAMPLE_RATE', 1),
            'threshold' => env('PULSE_SLOW_REQUESTS_THRESHOLD', 500),
            'ignore' => [
                '#^/'.env('PULSE_PATH', 'pulse').'$#',
                '#^/health$#',
                '#^/ready$#',
                '#^/live$#',
                '#^/startup$#',
            ],
        ],

        \Laravel\Pulse\Recorders\UserJobs::class => [
            'enabled' => env('PULSE_USER_JOBS_ENABLED', true),
            'sample_rate' => env('PULSE_USER_JOBS_SAMPLE_RATE', 1),
            'ignore' => [],
        ],

        \Laravel\Pulse\Recorders\UserRequests::class => [
            'enabled' => env('PULSE_USER_REQUESTS_ENABLED', true),
            'sample_rate' => env('PULSE_USER_REQUESTS_SAMPLE_RATE', 1),
            'ignore' => [
                '#^/'.env('PULSE_PATH', 'pulse').'$#',
                '#^/health$#',
                '#^/ready$#',
                '#^/live$#',
            ],
        ],
    ],
];
