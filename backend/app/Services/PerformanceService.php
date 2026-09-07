<?php

namespace App\Services;

use App\Models\AssessmentScore;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\SchoolModuleRecord;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class PerformanceService
{
    /**
     * Canonical Assessment → Performance contract: only locked validated scores.
     *
     * @return Builder<AssessmentScore>
     */
    private function lockedScores(): Builder
    {
        return AssessmentScore::query()
            ->join('assessments', 'assessments.id', '=', 'assessment_scores.assessment_id')
            ->where('assessments.status', 'locked')
            ->whereNotNull('assessment_scores.score');
    }

    /**
     * @return array<string, mixed>
     */
    public function view(string $view): array
    {
        if ($view === 'insights') {
            $atRisk = $this->atRisk();

            return ['summary' => $this->insights(count($atRisk)), 'rows' => $atRisk];
        }

        return match ($view) {
            'students' => ['rows' => $this->studentProgress()],
            'subjects' => ['rows' => $this->subjectPerformance()],
            'classes' => ['rows' => $this->classPerformance()],
            'trends' => ['rows' => $this->trends()],
            'at-risk' => ['rows' => $this->atRisk()],
            default => abort(404),
        };
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function atRisk(): array
    {
        $attendance = AttendanceRecord::query()
            ->select('student_id')
            ->selectRaw('COUNT(*) as marked')
            ->selectRaw("SUM(CASE WHEN status IN ('present','late','excused') THEN 1 ELSE 0 END) as present")
            ->where('attendance_date', '>=', now()->subDays(30))
            ->groupBy('student_id');

        $scores = $this->lockedScores()
            ->select('assessment_scores.student_id')
            ->selectRaw('AVG(assessment_scores.score) as avg_score')
            ->groupBy('assessment_scores.student_id');

        $rows = Student::query()
            ->where('students.status', 'active')
            ->leftJoinSub($attendance, 'att', 'att.student_id', '=', 'students.id')
            ->leftJoinSub($scores, 'sc', 'sc.student_id', '=', 'students.id')
            ->select([
                'students.id',
                'students.public_id',
                'students.first_name',
                'students.last_name',
                'att.marked',
                'att.present',
                'sc.avg_score',
            ])
            ->get();

        $enrolments = Enrollment::query()
            ->with('schoolClass')
            ->whereIn('student_id', $rows->pluck('id'))
            ->latest()
            ->get()
            ->unique('student_id')
            ->keyBy('student_id');

        $atRisk = [];
        foreach ($rows as $row) {
            $marked = (int) ($row->marked ?? 0);
            $present = (int) ($row->present ?? 0);
            $rate = $marked > 0 ? round(($present / $marked) * 100, 1) : 100.0;
            $avg = $row->avg_score !== null ? round((float) $row->avg_score, 1) : null;
            $high = ($marked >= 3 && $rate < 75) || ($avg !== null && $avg < 45);
            $medium = ($marked >= 3 && $rate < 85) || ($avg !== null && $avg < 55);
            if (! $high && ! $medium) {
                continue;
            }
            $class = $enrolments->get($row->id);
            $atRisk[] = [
                'id' => $row->public_id,
                'name' => trim($row->first_name.' '.$row->last_name),
                'class' => $class?->schoolClass ? trim($class->schoolClass->name.' '.($class->schoolClass->arm ?? '')) : '—',
                'riskLevel' => $high ? 'high' : 'medium',
                'attendanceRate' => $rate,
                'averageScore' => $avg,
            ];
        }
        usort($atRisk, fn (array $a, array $b): int => ($a['riskLevel'] === 'high' ? 0 : 1) <=> ($b['riskLevel'] === 'high' ? 0 : 1));

        return array_slice($atRisk, 0, 50);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function studentProgress(): array
    {
        return $this->lockedScores()
            ->join('students', 'students.id', '=', 'assessment_scores.student_id')
            ->groupBy('students.id', 'students.public_id', 'students.first_name', 'students.last_name')
            ->orderByDesc(DB::raw('avg(assessment_scores.score)'))
            ->limit(50)
            ->get([
                'students.public_id as student_public_id',
                'students.first_name',
                'students.last_name',
                DB::raw('avg(assessment_scores.score) as average_score'),
                DB::raw('count(assessment_scores.id) as assessments'),
            ])
            ->map(fn ($row) => [
                'id' => $row->student_public_id,
                'name' => trim($row->first_name.' '.$row->last_name),
                'averageScore' => round((float) $row->average_score, 1),
                'assessments' => (int) $row->assessments,
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function subjectPerformance(): array
    {
        return $this->lockedScores()
            ->join('subjects', 'subjects.id', '=', 'assessments.subject_id')
            ->groupBy('subjects.id', 'subjects.public_id', 'subjects.name')
            ->orderByDesc(DB::raw('avg(assessment_scores.score)'))
            ->limit(40)
            ->get([
                'subjects.public_id as subject_public_id',
                'subjects.name',
                DB::raw('avg(assessment_scores.score) as average_score'),
                DB::raw('count(assessment_scores.id) as scores'),
            ])
            ->map(fn ($row) => [
                'id' => $row->subject_public_id,
                'name' => $row->name,
                'averageScore' => round((float) $row->average_score, 1),
                'scores' => (int) $row->scores,
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function classPerformance(): array
    {
        return $this->lockedScores()
            ->join('school_classes', 'school_classes.id', '=', 'assessments.class_id')
            ->groupBy('school_classes.id', 'school_classes.public_id', 'school_classes.name', 'school_classes.arm')
            ->orderByDesc(DB::raw('avg(assessment_scores.score)'))
            ->limit(40)
            ->get([
                'school_classes.public_id as class_public_id',
                'school_classes.name',
                'school_classes.arm',
                DB::raw('avg(assessment_scores.score) as average_score'),
            ])
            ->map(fn ($row) => [
                'id' => $row->class_public_id,
                'name' => trim($row->name.' '.($row->arm ?? '')),
                'averageScore' => round((float) $row->average_score, 1),
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function trends(): array
    {
        return $this->lockedScores()
            ->where('assessments.updated_at', '>=', now()->subDays(90))
            ->selectRaw('DATE(assessments.updated_at) as day, avg(assessment_scores.score) as average_score, count(*) as scores')
            ->groupBy(DB::raw('DATE(assessments.updated_at)'))
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'day' => $row->day,
                'averageScore' => round((float) $row->average_score, 1),
                'scores' => (int) $row->scores,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function insights(int $atRiskCount): array
    {
        $avg = $this->lockedScores()->avg('assessment_scores.score');
        $interventions = SchoolModuleRecord::query()->where('module', 'interventions')->whereIn('status', ['open', 'in_progress'])->count();

        return [
            'averageScore' => $avg !== null ? round((float) $avg, 1) : null,
            'atRiskCount' => $atRiskCount,
            'openInterventions' => $interventions,
        ];
    }
}
