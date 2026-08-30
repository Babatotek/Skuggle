<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    /**
     * Basic health check - always returns 200 if app is running.
     * Use for simple uptime monitoring and load balancer health checks.
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ])->header('Cache-Control', 'no-store, private');
    }

    /**
     * Readiness check - verifies all critical dependencies are operational.
     * Returns 503 if any dependency fails. Use for load balancer readiness probes.
     */
    public function ready(): JsonResponse
    {
        $checks = [];
        $allHealthy = true;

        // Check database connectivity
        try {
            DB::connection()->getPdo();
            $checks['database'] = ['status' => 'healthy'];
        } catch (\Exception $e) {
            $checks['database'] = [
                'status' => 'unhealthy',
                'error' => 'Cannot connect to database',
            ];
            $allHealthy = false;
        }

        // Check Redis connectivity (only if required for this environment)
        if (config('skuggle.observability.ready_requires_redis', false)) {
            try {
                if (config('cache.default') === 'redis' || config('queue.default') === 'redis') {
                    Redis::connection()->ping();
                    $checks['redis'] = ['status' => 'healthy'];
                }
            } catch (\Exception $e) {
                $checks['redis'] = [
                    'status' => 'unhealthy',
                    'error' => 'Cannot connect to Redis',
                ];
                $allHealthy = false;
            }
        }

        // Check cache is working
        try {
            $key = 'health_check_'.time();
            Cache::put($key, 'test', 1);
            $value = Cache::get($key);
            Cache::forget($key);

            $checks['cache'] = $value === 'test'
                ? ['status' => 'healthy']
                : ['status' => 'degraded', 'message' => 'Cache read/write mismatch'];

            if ($value !== 'test') {
                $allHealthy = false;
            }
        } catch (\Exception $e) {
            $checks['cache'] = [
                'status' => 'unhealthy',
                'error' => 'Cache operations failing',
            ];
            $allHealthy = false;
        }

        // Check filesystem is writable
        try {
            $testFile = storage_path('framework/cache/health_check_'.time().'.tmp');
            file_put_contents($testFile, 'test');

            if (file_get_contents($testFile) === 'test') {
                $checks['filesystem'] = ['status' => 'healthy'];
                @unlink($testFile);
            } else {
                $checks['filesystem'] = ['status' => 'degraded', 'message' => 'File read/write mismatch'];
                $allHealthy = false;
            }
        } catch (\Exception $e) {
            $checks['filesystem'] = [
                'status' => 'unhealthy',
                'error' => 'Cannot write to storage',
            ];
            $allHealthy = false;
        }

        $response = [
            'status' => $allHealthy ? 'ready' : 'unavailable',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ];

        return response()->json($response, $allHealthy ? 200 : 503)
            ->header('Cache-Control', 'no-store, private');
    }

    /**
     * Startup check - verifies application has fully initialized.
     * Use for Kubernetes startup probes or deployment validation.
     */
    public function startup(): JsonResponse
    {
        $checks = [];
        $ready = true;

        // Check if database is accessible and migrations have been run
        try {
            DB::connection()->getPdo();

            // Check that the migrations table exists — if it doesn't, migrations
            // have never been run.  A missing table is a "not_ready" state; a
            // connection failure is a hard error and also marks not-ready.
            if (DB::getSchemaBuilder()->hasTable('migrations')) {
                $checks['migrations'] = ['status' => 'ok'];
            } else {
                $checks['migrations'] = [
                    'status' => 'not_ready',
                    'message' => 'Migrations have not been run',
                ];
                $ready = false;
            }
        } catch (\Exception $e) {
            $checks['migrations'] = [
                'status' => 'not_ready',
                'error' => 'Database not accessible',
            ];
            $ready = false;
        }

        // Check if cache is accessible
        try {
            Cache::get('startup_check');
            $checks['cache'] = ['status' => 'ok'];
        } catch (\Exception $e) {
            $checks['cache'] = [
                'status' => 'not_ready',
                'error' => 'Cache not accessible',
            ];
            $ready = false;
        }

        $response = [
            'status' => $ready ? 'started' : 'starting',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ];

        return response()->json($response, $ready ? 200 : 503)
            ->header('Cache-Control', 'no-store, private');
    }

    /**
     * Liveness check - verifies the application process is alive and not deadlocked.
     * Use for Kubernetes liveness probes. Simpler than readiness check.
     */
    public function live(): JsonResponse
    {
        // Simple check - if we can respond, we're alive
        return response()->json([
            'status' => 'alive',
            'timestamp' => now()->toIso8601String(),
        ])->header('Cache-Control', 'no-store, private');
    }
}
