<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\Assessment;
use App\Models\AttendanceRecord;
use App\Models\ResultPublication;
use App\Models\Tenant;

final class ResultReportService
{
    public function __construct(private readonly TenantContext $context) {}

    /** @return array<string, mixed> */
    public function buildForPublication(ResultPublication $publication): array
    {
        $publication->loadMissing(['student.enrollments.schoolClass', 'academicSession', 'term']);
        $tenant = $this->context->tenant();
        $student = $publication->student;
        $enrollment = $student->enrollments
            ->firstWhere('academic_session_id', $publication->academic_session_id)
            ?? $student->enrollments->first();

        $assessments = Assessment::query()
            ->with(['subject', 'scores' => fn ($q) => $q->where('student_id', $student->getKey())])
            ->where('academic_session_id', $publication->academic_session_id)
            ->where('term_id', $publication->term_id)
            ->whereIn('status', ['submitted', 'published', 'locked'])
            ->get();

        $subjects = [];
        foreach ($assessments as $assessment) {
            $score = $assessment->scores->first();
            if (! $score || $score->score === null) {
                continue;
            }
            $subjectName = $assessment->subject?->name ?? 'General';
            $percentage = $assessment->maximum_score > 0
                ? round(((float) $score->score / (float) $assessment->maximum_score) * 100, 1)
                : 0.0;

            if (! isset($subjects[$subjectName])) {
                $subjects[$subjectName] = [
                    'subject' => $subjectName,
                    'scores' => [],
                    'total' => 0.0,
                    'count' => 0,
                ];
            }

            $subjects[$subjectName]['scores'][] = [
                'title' => $assessment->title,
                'type' => $assessment->type,
                'score' => (float) $score->score,
                'maxScore' => (float) $assessment->maximum_score,
                'percentage' => $percentage,
            ];
            $subjects[$subjectName]['total'] += $percentage;
            $subjects[$subjectName]['count']++;
        }

        $subjectRows = collect($subjects)->map(function (array $row): array {
            $average = $row['count'] > 0 ? round($row['total'] / $row['count'], 1) : 0.0;

            return [
                'subject' => $row['subject'],
                'average' => $average,
                'grade' => $this->gradeLetter($average),
                'scores' => $row['scores'],
            ];
        })->sortBy('subject')->values()->all();

        $termAverage = count($subjectRows) > 0
            ? round(collect($subjectRows)->avg('average'), 1)
            : null;

        $attendanceSummary = $this->attendanceSummary(
            $student->getKey(),
            $publication->academic_session_id,
            $publication->term_id,
            $enrollment?->class_id,
        );

        return [
            'publicationId' => $publication->public_id,
            'school' => $this->presentSchool($tenant),
            'student' => [
                'displayName' => trim("{$student->first_name} {$student->last_name}"),
                'admissionNumber' => $student->admission_number,
                'className' => trim(($enrollment?->schoolClass?->name ?? '').' '.($enrollment?->schoolClass?->arm ?? '')),
            ],
            'session' => $publication->academicSession?->name,
            'term' => $publication->term?->name,
            'termAverage' => $termAverage,
            'termGrade' => $termAverage !== null ? $this->gradeLetter($termAverage) : null,
            'subjects' => $subjectRows,
            'attendance' => $attendanceSummary,
            'publishedAt' => $publication->published_at?->toIso8601String(),
        ];
    }

    /** @return array{present: int, absent: int, late: int, rate: float|null} */
    private function attendanceSummary(int $studentId, int $sessionId, int $termId, ?int $classId): array
    {
        $query = AttendanceRecord::query()
            ->where('student_id', $studentId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId);

        if ($classId) {
            $query->where('class_id', $classId);
        }

        $records = $query->get(['status']);
        $total = $records->count();
        if ($total === 0) {
            return ['present' => 0, 'absent' => 0, 'late' => 0, 'rate' => null];
        }

        $present = $records->whereIn('status', ['present', 'excused'])->count();
        $absent = $records->where('status', 'absent')->count();
        $late = $records->where('status', 'late')->count();

        return [
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'rate' => round(($present / $total) * 100, 1),
        ];
    }

    /** @return array<string, mixed> */
    private function presentSchool(Tenant $tenant): array
    {
        $settings = $tenant->settings ?? [];

        return [
            'name' => $tenant->name,
            'motto' => data_get($settings, 'profile.motto'),
            'logoUrl' => data_get($settings, 'branding.logo_url'),
            'primaryColour' => data_get($settings, 'branding.primary_colour', '#4338CA'),
            'contact' => data_get($settings, 'contact'),
        ];
    }

    private function gradeLetter(float $percentage): string
    {
        return match (true) {
            $percentage >= 70 => 'A',
            $percentage >= 60 => 'B',
            $percentage >= 50 => 'C',
            $percentage >= 45 => 'D',
            $percentage >= 40 => 'E',
            default => 'F',
        };
    }
}
