<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\SaveAttendanceRequest;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\TeacherAssignment;
use App\Services\AcademicContext;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    public function classes(Request $request, TenantContext $context): JsonResponse
    {
        $this->authorize('viewAny', SchoolClass::class);
        $query = SchoolClass::query()->where('status', 'active')->withCount(['enrollments' => fn ($q) => $q->where('status', 'active')]);
        if ($context->membership()->role->name === 'teacher') {
            $classIds = TeacherAssignment::query()->where('user_id', $request->user()->getKey())->pluck('class_id');
            $query->whereIn('id', $classIds);
        }

        return ApiResponse::success($query->orderBy('name')->get()->map(fn ($item) => ['id' => $item->public_id, 'name' => trim($item->name.' '.$item->arm), 'studentCount' => $item->enrollments_count]));
    }

    public function show(string $class, Request $request, AcademicContext $academic): JsonResponse
    {
        [$session] = $academic->resolve($request);
        $schoolClass = SchoolClass::query()->where('public_id', $class)->firstOrFail();
        $this->authorize('view', $schoolClass);
        $date = $request->date('date', today())->toDateString();
        $enrollments = Enrollment::query()->where('class_id', $schoolClass->getKey())->where('academic_session_id', $session->getKey())->where('status', 'active')->with('student')->get();
        $records = AttendanceRecord::query()->where('class_id', $schoolClass->getKey())->whereDate('attendance_date', $date)->get()->keyBy('student_id');

        return ApiResponse::success(['classId' => $schoolClass->public_id, 'className' => trim($schoolClass->name.' '.$schoolClass->arm), 'date' => $date, 'students' => $enrollments->map(function ($enrollment) use ($records): array {
            $student = $enrollment->student;

            return ['id' => $student->public_id, 'admissionNumber' => $student->admission_number, 'fullName' => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"), 'status' => $records->get($student->getKey())?->status];
        }), 'revision' => $this->revision($schoolClass->getKey(), $date)]);
    }

    public function update(string $class, SaveAttendanceRequest $request, AcademicContext $academic, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        [$session, $term] = $academic->resolve($request);
        $schoolClass = SchoolClass::query()->where('public_id', $class)->firstOrFail();
        $this->authorize('update', $schoolClass);
        $date = $request->date('date')->toDateString();
        $lock = Cache::lock("skuggle:v1:tenant:{$context->tenantId()}:attendance:{$schoolClass->getKey()}:{$date}", 20);
        $lock->block(5, function () use ($request, $schoolClass, $date, $session, $term, $audit): void {
            DB::transaction(function () use ($request, $schoolClass, $date, $session, $term, $audit): void {
                if (! hash_equals($this->revision($schoolClass->getKey(), $date), $request->string('revision')->toString())) {
                    throw new ApiException('REVISION_CONFLICT', 'Attendance was changed by another user. Reload the sheet and review it before saving.', 409);
                }
                $students = Enrollment::query()->where('class_id', $schoolClass->getKey())->where('academic_session_id', $session->getKey())->where('status', 'active')->with('student')->get()->pluck('student', 'student.public_id');
                $statuses = $request->validated('statuses');
                if (array_diff(array_keys($statuses), $students->keys()->all())) {
                    throw new ApiException('INVALID_ROSTER', 'One or more students are not enrolled in this class.', 422);
                }
                foreach ($statuses as $publicId => $status) {
                    $student = $students->get($publicId);
                    $record = AttendanceRecord::query()->where(['student_id' => $student->getKey(), 'class_id' => $schoolClass->getKey(), 'attendance_date' => $date])->lockForUpdate()->first();
                    if ($record) {
                        $record->update(['status' => $status, 'revision' => $record->revision + 1, 'recorded_by' => $request->user()->getKey()]);
                    } else {
                        AttendanceRecord::query()->create(['student_id' => $student->getKey(), 'class_id' => $schoolClass->getKey(), 'academic_session_id' => $session->getKey(), 'term_id' => $term->getKey(), 'attendance_date' => $date, 'status' => $status, 'recorded_by' => $request->user()->getKey()]);
                    }
                }
                $audit->record('attendance.saved', $schoolClass, [], ['date' => $date, 'students_recorded' => count($statuses)]);
            });
        });

        return ApiResponse::success(['revision' => $this->revision($schoolClass->getKey(), $date)]);
    }

    private function revision(int $classId, string $date): string
    {
        $state = AttendanceRecord::query()->where('class_id', $classId)->whereDate('attendance_date', $date)->selectRaw('COUNT(*) as aggregate_count, COALESCE(MAX(revision), 0) as max_revision, COALESCE(MAX(updated_at), "1970-01-01") as last_update')->first();

        return hash('sha256', "{$classId}|{$date}|{$state->aggregate_count}|{$state->max_revision}|{$state->last_update}");
    }
}
