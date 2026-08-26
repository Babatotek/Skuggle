<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AttendanceRecord;
use App\Models\ResultPublication;
use App\Models\Student;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function show(string $experience, Request $request, TenantContext $context): JsonResponse
    {
        abort_unless(in_array($experience, ['platform', 'leadership', 'operations', 'teacher', 'parent', 'student'], true), 404);

        if ($experience === 'platform') {
            return app(PlatformController::class)->overview();
        }

        $cacheKey = "skuggle:v1:tenant:{$context->tenantId()}:dashboard:{$experience}";
        $data = Cache::remember($cacheKey, now()->addSeconds(60), function () use ($experience, $request, $context): array {
            $snapshot = DB::table('dashboard_snapshots')
                ->where('tenant_id', $context->tenantId())
                ->where('experience', $experience)
                ->first();

            if ($snapshot) {
                return [
                    'experience' => $experience,
                    'greeting' => 'Welcome back, '.str($request->user()->name)->before(' '),
                    'updatedAt' => $snapshot->as_of,
                    'metrics' => json_decode($snapshot->metrics, true, flags: JSON_THROW_ON_ERROR),
                    'tasks' => json_decode($snapshot->tasks ?: '[]', true, flags: JSON_THROW_ON_ERROR),
                    'notices' => [],
                    'source' => 'snapshot',
                ];
            }

            $metrics = match ($experience) {
                'leadership', 'operations' => [
                    ['id' => 'students', 'label' => 'Active students', 'value' => Student::query()->where('status', 'active')->count(), 'status' => 'neutral'],
                    ['id' => 'attendance', 'label' => 'Attendance today', 'value' => AttendanceRecord::query()->whereDate('attendance_date', today())->count(), 'status' => 'neutral'],
                    ['id' => 'assessments', 'label' => 'Active assessments', 'value' => Assessment::query()->whereIn('status', ['draft', 'submitted', 'under_review'])->count(), 'status' => 'neutral'],
                    ['id' => 'results', 'label' => 'Published results', 'value' => ResultPublication::query()->where('status', 'published')->count(), 'status' => 'neutral'],
                ],
                default => [],
            };

            return [
                'experience' => $experience,
                'greeting' => 'Welcome back, '.str($request->user()->name)->before(' '),
                'updatedAt' => now()->toIso8601String(),
                'metrics' => $metrics,
                'tasks' => [],
                'notices' => [],
                'source' => 'live',
            ];
        });

        return ApiResponse::success($data);
    }
}
