<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\PerformanceService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function show(Request $request, string $view, PerformanceService $performance): JsonResponse
    {
        $permissions = $request->attributes->get('membership')?->permissionNames() ?? [];
        abort_unless(count(array_intersect(['reports.view', 'assessments.view', 'students.view'], $permissions)) > 0, 403);

        return ApiResponse::success($performance->view($view));
    }
}
