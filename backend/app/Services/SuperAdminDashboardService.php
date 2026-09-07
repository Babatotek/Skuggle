<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\AdmissionApplication;
use App\Models\Announcement;
use App\Models\AssessmentScore;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Message;
use App\Models\PaymentTransaction;
use App\Models\ResultPublication;
use App\Models\Student;
use App\Models\Term;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class SuperAdminDashboardService
{
    public function __construct(private readonly TenantContext $context) {}

    /**
     * @return array<string, mixed>
     */
    public function assemble(): array
    {
        $tenant = $this->context->tenant();
        $permissions = $this->context->membership()->permissionNames();
        $has = fn (string $permission): bool => in_array($permission, $permissions, true);

        $students = Student::query()->where('status', 'active')->count();
        $staff = Schema::hasTable('employees')
            ? Employee::query()->where('status', 'active')->count()
            : 0;

        $today = today();
        $todayRecords = AttendanceRecord::query()->whereDate('attendance_date', $today)->get();
        $absentToday = $todayRecords->where('status', 'absent')->count();
        $presentToday = $todayRecords->whereIn('status', ['present', 'late', 'excused'])->count();
        $markedToday = $todayRecords->count();
        $attendanceRate = $markedToday > 0
            ? round(($presentToday / $markedToday) * 100, 1)
            : null;

        $yesterdayRecords = AttendanceRecord::query()->whereDate('attendance_date', $today->copy()->subDay())->get();
        $yesterdayMarked = $yesterdayRecords->count();
        $yesterdayPresent = $yesterdayRecords->whereIn('status', ['present', 'late', 'excused'])->count();
        $yesterdayRate = $yesterdayMarked > 0 ? round(($yesterdayPresent / $yesterdayMarked) * 100, 1) : null;
        $attendanceDelta = ($attendanceRate !== null && $yesterdayRate !== null)
            ? round($attendanceRate - $yesterdayRate, 1)
            : null;

        $collectedMinor = (int) PaymentTransaction::query()->where('status', 'succeeded')->sum('amount_minor');
        $outstandingMinor = (int) PaymentTransaction::query()->whereIn('status', ['pending', 'processing'])->sum('amount_minor');
        $overdueMinor = (int) PaymentTransaction::query()
            ->whereIn('status', ['pending', 'processing', 'overdue'])
            ->where('created_at', '<', now()->subDays(14))
            ->sum('amount_minor');
        $outstandingNet = max(0, $outstandingMinor - $overdueMinor);
        $totalFeesMinor = $collectedMinor + $outstandingMinor;
        $feePct = fn (int $part): int => $totalFeesMinor > 0 ? (int) round(($part / $totalFeesMinor) * 100) : 0;

        $avgPerformance = AssessmentScore::query()
            ->join('assessments', 'assessments.id', '=', 'assessment_scores.assessment_id')
            ->where('assessments.status', 'locked')
            ->whereNotNull('assessment_scores.score')
            ->avg('assessment_scores.score');
        $avgPerformance = $avgPerformance !== null ? round((float) $avgPerformance, 1) : null;

        $awaitingApproval = ResultPublication::query()->whereIn('status', ['draft', 'submitted', 'under_review', 'pending_approval'])->count();
        $unreadMessages = Message::query()
            ->where('recipient_id', $this->context->membership()->user_id)
            ->whereNull('read_at')
            ->count();

        $atRiskStudents = array_slice(app(PerformanceService::class)->atRisk(), 0, 8);
        $securityAlerts = Schema::hasTable('security_events')
            ? (int) DB::table('security_events')
                ->where('tenant_id', $tenant->getKey())
                ->where('occurred_at', '>=', now()->subDay())
                ->whereIn('severity', ['warning', 'critical', 'error'])
                ->count()
            : 0;

        $quickActions = $this->quickActions($has);

        return [
            'experience' => 'superadmin',
            'schoolName' => $tenant->name,
            'roleLabel' => 'Super Admin',
            'updatedAt' => now()->toIso8601String(),
            'inbox' => [
                'notifications' => 0,
                'messages' => $unreadMessages,
            ],
            'metrics' => [
                [
                    'id' => 'students',
                    'label' => 'Total Students',
                    'value' => $students,
                    'display' => number_format($students),
                    'delta' => null,
                    'deltaLabel' => $students === 0 ? 'No enrolled students yet' : 'Active enrolments',
                ],
                [
                    'id' => 'staff',
                    'label' => 'Total Staff',
                    'value' => $staff,
                    'display' => number_format($staff),
                    'delta' => null,
                    'deltaLabel' => $staff === 0 ? 'No staff records yet' : 'Active staff',
                ],
                [
                    'id' => 'attendance',
                    'label' => 'Attendance Today',
                    'value' => $attendanceRate,
                    'display' => $attendanceRate === null ? '—' : $attendanceRate.'%',
                    'delta' => $attendanceDelta,
                    'deltaLabel' => $attendanceRate === null ? 'No register marked today' : 'vs yesterday',
                ],
                [
                    'id' => 'fees',
                    'label' => 'Fee Collection',
                    'value' => $collectedMinor,
                    'display' => $this->naira($collectedMinor),
                    'delta' => null,
                    'deltaLabel' => $collectedMinor === 0 ? 'No successful payments yet' : 'Collected (succeeded)',
                ],
                [
                    'id' => 'performance',
                    'label' => 'Avg. Performance',
                    'value' => $avgPerformance,
                    'display' => $avgPerformance === null ? '—' : $avgPerformance.'%',
                    'delta' => null,
                    'deltaLabel' => $avgPerformance === null ? 'No scored assessments yet' : 'Across recorded scores',
                ],
            ],
            'alerts' => [
                $this->alert('absent', 'Students Absent Today', $absentToday, $absentToday > 0 ? 'Requires attention' : 'All marked students present', 'attendance', $has('attendance.view')),
                $this->alert('invoices', 'Unpaid Invoices', (int) PaymentTransaction::query()->whereIn('status', ['pending', 'processing', 'overdue'])->count(), $outstandingMinor > 0 ? 'Outstanding' : 'No open invoices', 'finance', $has('finance.view')),
                $this->alert('results', 'Results Awaiting Approval', $awaitingApproval, $awaitingApproval > 0 ? 'Action required' : 'Nothing pending', 'results', $has('results.view')),
                $this->alert('risk', 'Students At Risk', count($atRiskStudents), count($atRiskStudents) > 0 ? 'Needs intervention' : 'No at-risk students', 'at-risk-students', $has('reports.view') || $has('students.view')),
                $this->alert('admissions', 'Admission Applications', AdmissionApplication::query()->whereNotIn('status', ['rejected', 'enrolled'])->count(), 'Awaiting review', 'admissions-applications', $has('admissions.application.view')),
                $this->alert('security', 'Security Alerts', $securityAlerts, $securityAlerts > 0 ? 'Review immediately' : 'No alerts in 24h', 'audit-logs', $has('audit.view') || $has('security.manage')),
            ],
            'attendanceOverview' => $this->attendanceWeek($students),
            'feeOverview' => [
                'totalMinor' => $totalFeesMinor,
                'totalDisplay' => $this->naira($totalFeesMinor),
                'collected' => ['amountMinor' => $collectedMinor, 'display' => $this->naira($collectedMinor), 'percent' => $feePct($collectedMinor)],
                'outstanding' => ['amountMinor' => $outstandingNet, 'display' => $this->naira($outstandingNet), 'percent' => $feePct($outstandingNet)],
                'overdue' => ['amountMinor' => $overdueMinor, 'display' => $this->naira($overdueMinor), 'percent' => $feePct($overdueMinor)],
            ],
            'topClasses' => $this->topClasses(),
            'studentsAtRisk' => $atRiskStudents,
            'calendar' => $this->calendar(),
            'announcements' => Announcement::query()
                ->latest('published_at')
                ->limit(5)
                ->get(['public_id', 'title', 'published_at'])
                ->map(fn (Announcement $row) => [
                    'id' => $row->public_id,
                    'title' => $row->title,
                    'publishedAt' => optional($row->published_at)?->toDateString(),
                ])
                ->all(),
            'activity' => AuditLog::query()
                ->where('tenant_id', $tenant->getKey())
                ->orderByDesc('occurred_at')
                ->limit(8)
                ->get(['action', 'occurred_at', 'resource_type'])
                ->map(fn (AuditLog $row) => [
                    'action' => $row->action,
                    'occurredAt' => optional($row->occurred_at)?->toIso8601String(),
                    'resource' => class_basename((string) $row->resource_type),
                ])
                ->all(),
            'quickActions' => $quickActions,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function attendanceWeek(int $studentCount): array
    {
        $days = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $records = AttendanceRecord::query()->whereDate('attendance_date', $date)->get();
            $marked = $records->count();
            $present = $records->whereIn('status', ['present', 'late', 'excused'])->count();
            $days[] = [
                'label' => $date->format('D'),
                'date' => $date->toDateString(),
                'rate' => $marked > 0 ? round(($present / $marked) * 100, 1) : ($studentCount > 0 ? 0 : null),
            ];
        }

        return $days;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function topClasses(): array
    {
        $rows = AssessmentScore::query()
            ->join('assessments', 'assessments.id', '=', 'assessment_scores.assessment_id')
            ->join('school_classes', 'school_classes.id', '=', 'assessments.class_id')
            ->where('assessments.status', 'locked')
            ->whereNotNull('assessment_scores.score')
            ->groupBy('school_classes.id', 'school_classes.public_id', 'school_classes.name', 'school_classes.arm')
            ->orderByDesc(DB::raw('avg(assessment_scores.score)'))
            ->limit(5)
            ->get([
                'school_classes.public_id as class_id',
                'school_classes.name',
                'school_classes.arm',
                DB::raw('avg(assessment_scores.score) as average_score'),
            ]);

        return $rows->values()->map(function ($row, int $index): array {
            $label = trim($row->name.($row->arm ? ' '.$row->arm : ''));

            return [
                'id' => $row->class_id,
                'class' => $label,
                'averageScore' => round((float) $row->average_score, 1),
                'rank' => $index + 1,
            ];
        })->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function calendar(): array
    {
        $terms = Term::query()->with('academicSession')->orderBy('starts_at')->limit(6)->get();

        return [
            'focusDate' => now()->toDateString(),
            'events' => $terms->map(fn (Term $term) => [
                'id' => $term->public_id,
                'title' => trim(($term->academicSession?->name ? $term->academicSession->name.' · ' : '').$term->name),
                'startsAt' => optional($term->starts_at)?->toDateString(),
                'endsAt' => optional($term->ends_at)?->toDateString(),
                'kind' => $term->is_current ? 'current' : 'term',
            ])->all(),
        ];
    }

    /**
     * @param  callable(string): bool  $has
     * @return list<array<string, mixed>>
     */
    private function quickActions(callable $has): array
    {
        $actions = [
            ['id' => 'students', 'label' => 'Add Student', 'tab' => 'students', 'permission' => 'students.create'],
            ['id' => 'staff', 'label' => 'Add Staff', 'tab' => 'people', 'permission' => 'users.manage'],
            ['id' => 'notice', 'label' => 'Create Notice', 'tab' => 'notices', 'permission' => 'communication.send'],
            ['id' => 'attendance', 'label' => 'Take Attendance', 'tab' => 'daily-register', 'permission' => 'attendance.create'],
            ['id' => 'payment', 'label' => 'Record Payment', 'tab' => 'payments', 'permission' => 'finance.view'],
            ['id' => 'exam', 'label' => 'Create Exam', 'tab' => 'examinations', 'permission' => 'assessment.create'],
            ['id' => 'publish', 'label' => 'Publish Result', 'tab' => 'result-publishing', 'permission' => 'results.publish'],
            ['id' => 'message', 'label' => 'Send Message', 'tab' => 'broadcasts', 'permission' => 'communication.send'],
            ['id' => 'admins', 'label' => 'Manage Admins', 'tab' => 'administrators', 'permission' => 'roles.manage'],
        ];

        return array_values(array_filter($actions, fn (array $action): bool => $has($action['permission'])));
    }

    /**
     * @return array<string, mixed>
     */
    private function alert(string $id, string $label, int $count, string $hint, string $tab, bool $enabled): array
    {
        return compact('id', 'label', 'count', 'hint', 'tab', 'enabled');
    }

    private function naira(int $amountMinor): string
    {
        $naira = $amountMinor / 100;
        if ($naira >= 1_000_000) {
            return '₦'.number_format($naira / 1_000_000, 1).'M';
        }
        if ($naira >= 1_000) {
            return '₦'.number_format($naira / 1_000, 1).'K';
        }

        return '₦'.number_format($naira, 0);
    }
}
