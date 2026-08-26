<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Assessment;
use App\Models\AssessmentScore;
use App\Models\AttendanceRecord;
use App\Models\DeviceSyncToken;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Term;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SyncController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'string', 'max:120'],
            'last_sync_token' => ['nullable', 'string', 'max:120'],
            'changes' => ['required', 'array'],
            'changes.*.type' => ['required', 'string', 'in:attendance,score'],
            'changes.*.client_change_id' => ['nullable', 'string', 'max:120'],
            'changes.*.id' => ['nullable', 'string'],
            'changes.*.revision' => ['nullable', 'integer', 'min:0'],
            'changes.*.payload' => ['required', 'array'],
        ]);

        $user = $request->user();

        $result = DB::transaction(function () use ($data, $user): array {
            $accepted = [];
            $conflicts = [];
            $serverChanges = [];

            $device = DeviceSyncToken::query()
                ->where('user_id', $user->getKey())
                ->where('device_id', $data['device_id'])
                ->lockForUpdate()
                ->first();

            if ($device && ! empty($data['last_sync_token']) && ! hash_equals((string) $device->token, (string) $data['last_sync_token'])) {
                return [
                    'error' => ApiResponse::error('SYNC_TOKEN_MISMATCH', 'The sync token is stale. Pull server changes and retry.', 409),
                ];
            }

            $since = $device?->last_synced_at;

            foreach ($data['changes'] as $change) {
                $outcome = match ($change['type']) {
                    'attendance' => $this->applyAttendance($change),
                    'score' => $this->applyScore($change),
                };

                if ($outcome['status'] === 'accepted') {
                    $accepted[] = $outcome['item'];
                } else {
                    $conflicts[] = $outcome['item'];
                }
            }

            if ($since) {
                $serverChanges = array_merge(
                    $this->attendanceServerChanges($since),
                    $this->scoreServerChanges($since),
                );
            }

            $newToken = (string) Str::ulid();
            if ($device) {
                $device->update(['token' => $newToken, 'last_synced_at' => now()]);
            } else {
                DeviceSyncToken::query()->create([
                    'user_id' => $user->getKey(),
                    'device_id' => $data['device_id'],
                    'token' => $newToken,
                    'last_synced_at' => now(),
                ]);
            }

            return compact('accepted', 'conflicts', 'serverChanges', 'newToken');
        });

        if (isset($result['error'])) {
            return $result['error'];
        }

        return ApiResponse::success([
            'accepted' => $result['accepted'],
            'conflicts' => $result['conflicts'],
            'server_changes' => $result['serverChanges'],
            'new_sync_token' => $result['newToken'],
        ]);
    }

    private function applyAttendance(array $change): array
    {
        $payload = $change['payload'];
        $clientChangeId = $change['client_change_id'] ?? null;
        $student = Student::query()->where('public_id', $payload['student_id'] ?? '')->first();
        $class = SchoolClass::query()->where('public_id', $payload['class_id'] ?? '')->first();
        $date = $payload['attendance_date'] ?? null;

        if (! $student || ! $class || ! $date || empty($payload['status'])) {
            return $this->conflict('attendance', $clientChangeId, 'INVALID_PAYLOAD');
        }

        $record = AttendanceRecord::query()
            ->where('student_id', $student->getKey())
            ->where('class_id', $class->getKey())
            ->whereDate('attendance_date', $date)
            ->lockForUpdate()
            ->first();

        $expectedRevision = (int) ($change['revision'] ?? 0);
        if ($record && (int) $record->revision !== $expectedRevision) {
            return $this->conflict('attendance', $clientChangeId, 'REVISION_CONFLICT', $this->presentAttendance($record));
        }

        if ($record) {
            $record->update([
                'status' => $payload['status'],
                'revision' => $record->revision + 1,
                'recorded_by' => request()->user()->getKey(),
            ]);
            $record->refresh();
        } else {
            $session = AcademicSession::query()->where('public_id', $payload['academic_session_id'] ?? '')->first();
            $term = Term::query()->where('public_id', $payload['term_id'] ?? '')->first();
            if (! $session || ! $term) {
                return $this->conflict('attendance', $clientChangeId, 'ACADEMIC_CONTEXT_REQUIRED');
            }

            $record = AttendanceRecord::query()->create([
                'student_id' => $student->getKey(),
                'class_id' => $class->getKey(),
                'academic_session_id' => $session->getKey(),
                'term_id' => $term->getKey(),
                'attendance_date' => $date,
                'status' => $payload['status'],
                'recorded_by' => request()->user()->getKey(),
            ]);
        }

        return [
            'status' => 'accepted',
            'item' => [
                'type' => 'attendance',
                'client_change_id' => $clientChangeId,
                'server' => $this->presentAttendance($record),
            ],
        ];
    }

    private function applyScore(array $change): array
    {
        $payload = $change['payload'];
        $clientChangeId = $change['client_change_id'] ?? null;
        $assessment = Assessment::query()->where('public_id', $payload['assessment_id'] ?? '')->first();
        $student = Student::query()->where('public_id', $payload['student_id'] ?? '')->first();

        if (! $assessment || ! $student || ! array_key_exists('score', $payload)) {
            return $this->conflict('score', $clientChangeId, 'INVALID_PAYLOAD');
        }

        $score = AssessmentScore::query()
            ->where('assessment_id', $assessment->getKey())
            ->where('student_id', $student->getKey())
            ->lockForUpdate()
            ->first();

        $expectedRevision = (int) ($change['revision'] ?? 0);
        if ($score && (int) $score->revision !== $expectedRevision) {
            return $this->conflict('score', $clientChangeId, 'REVISION_CONFLICT', $this->presentScore($score));
        }

        if ($score) {
            $score->update([
                'score' => $payload['score'],
                'graded_by' => request()->user()->getKey(),
                'graded_at' => now(),
                'revision' => $score->revision + 1,
            ]);
            $score->refresh();
        } else {
            $score = AssessmentScore::query()->create([
                'assessment_id' => $assessment->getKey(),
                'student_id' => $student->getKey(),
                'score' => $payload['score'],
                'status' => 'draft',
                'graded_by' => request()->user()->getKey(),
                'graded_at' => now(),
            ]);
        }

        return [
            'status' => 'accepted',
            'item' => [
                'type' => 'score',
                'client_change_id' => $clientChangeId,
                'server' => $this->presentScore($score),
            ],
        ];
    }

    private function conflict(string $type, ?string $clientChangeId, string $reason, ?array $server = null): array
    {
        return [
            'status' => 'conflict',
            'item' => [
                'type' => $type,
                'client_change_id' => $clientChangeId,
                'reason' => $reason,
                'server' => $server,
            ],
        ];
    }

    private function attendanceServerChanges($since): array
    {
        return AttendanceRecord::query()
            ->where('updated_at', '>', $since)
            ->with(['student:id,public_id', 'schoolClass:id,public_id'])
            ->orderBy('updated_at')
            ->limit(500)
            ->get()
            ->map(fn (AttendanceRecord $record) => [
                'type' => 'attendance',
                'server' => $this->presentAttendance($record),
            ])
            ->all();
    }

    private function scoreServerChanges($since): array
    {
        return AssessmentScore::query()
            ->where('updated_at', '>', $since)
            ->with(['student:id,public_id', 'assessment:id,public_id'])
            ->orderBy('updated_at')
            ->limit(500)
            ->get()
            ->map(fn (AssessmentScore $score) => [
                'type' => 'score',
                'server' => $this->presentScore($score),
            ])
            ->all();
    }

    private function presentAttendance(AttendanceRecord $record): array
    {
        $record->loadMissing(['student:id,public_id', 'schoolClass:id,public_id']);

        return [
            'id' => $record->public_id,
            'revision' => (int) $record->revision,
            'studentId' => $record->student?->public_id,
            'classId' => $record->schoolClass?->public_id,
            'attendanceDate' => $record->attendance_date?->toDateString(),
            'status' => $record->status,
            'updatedAt' => $record->updated_at?->toIso8601String(),
        ];
    }

    private function presentScore(AssessmentScore $score): array
    {
        $score->loadMissing(['student:id,public_id', 'assessment:id,public_id']);

        return [
            'id' => $score->public_id,
            'revision' => (int) $score->revision,
            'assessmentId' => $score->assessment?->public_id,
            'studentId' => $score->student?->public_id,
            'score' => $score->score !== null ? (float) $score->score : null,
            'updatedAt' => $score->updated_at?->toIso8601String(),
        ];
    }
}
