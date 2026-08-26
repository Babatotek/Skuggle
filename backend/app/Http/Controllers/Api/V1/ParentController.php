<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AssessmentScore;
use App\Models\AttendanceRecord;
use App\Models\Guardian;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentController extends Controller
{
    public function children(Request $request): JsonResponse
    {
        $guardian = Guardian::query()
            ->where('user_id', $request->user()->getKey())
            ->with(['students.enrollments.schoolClass'])
            ->first();

        if (! $guardian) {
            return ApiResponse::success([]);
        }

        return ApiResponse::success($guardian->students->map(function ($student): array {
            $this->authorize('view', $student);
            $enrollment = $student->enrollments->firstWhere('status', 'active') ?? $student->enrollments->first();
            $attendance = AttendanceRecord::query()
                ->where('student_id', $student->getKey())
                ->selectRaw('COUNT(*) total, SUM(CASE WHEN status IN ("present", "late") THEN 1 ELSE 0 END) attended')
                ->first();
            $average = AssessmentScore::query()->where('student_id', $student->getKey())->whereNotNull('score')->avg('score');
            $recent = AssessmentScore::query()->where('student_id', $student->getKey())->with('assessment')->latest('graded_at')->first();

            return [
                'id' => $student->public_id,
                'fullName' => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
                'className' => trim(($enrollment?->schoolClass?->name ?? '').' '.($enrollment?->schoolClass?->arm ?? '')),
                'currentAverage' => $average !== null ? round((float) $average, 1) : null,
                'attendanceRate' => $attendance->total ? round(((int) $attendance->attended / (int) $attendance->total) * 100, 1) : null,
                'assignmentsDue' => null,
                'recentAssessment' => $recent ? ['title' => $recent->assessment?->title ?? 'Assessment', 'score' => (string) $recent->score] : null,
                'upcomingEvents' => [],
            ];
        }));
    }
}
