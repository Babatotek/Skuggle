<?php

namespace App\Console\Commands;

use App\Domain\Tenancy\TenantContext;
use App\Models\Assessment;
use App\Models\AttendanceRecord;
use App\Models\ResultPublication;
use App\Models\Student;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RebuildDashboardSnapshots extends Command
{
    protected $signature = 'dashboard:rebuild-snapshots';

    protected $description = 'Rebuild per-tenant dashboard metric snapshots for each experience';

    private const EXPERIENCES = ['platform', 'leadership', 'operations', 'teacher', 'parent', 'student'];

    public function handle(TenantContext $context): int
    {
        $tenants = Tenant::query()->cursor();
        $rebuilt = 0;

        foreach ($tenants as $tenant) {
            $context->set($tenant);

            try {
                $metrics = $this->computeMetrics();
                $asOf = now();

                foreach (self::EXPERIENCES as $experience) {
                    $keys = [
                        'tenant_id' => $tenant->getKey(),
                        'experience' => $experience,
                    ];
                    $payload = [
                        'as_of' => $asOf,
                        'metrics' => json_encode($metrics, JSON_THROW_ON_ERROR),
                        'tasks' => json_encode([], JSON_THROW_ON_ERROR),
                        'updated_at' => $asOf,
                    ];

                    if (DB::table('dashboard_snapshots')->where($keys)->exists()) {
                        DB::table('dashboard_snapshots')->where($keys)->update($payload);
                    } else {
                        DB::table('dashboard_snapshots')->insert([
                            ...$keys,
                            'created_at' => $asOf,
                            ...$payload,
                        ]);
                    }

                    $rebuilt++;
                }
            } finally {
                $context->clear();
            }
        }

        $this->info("Rebuilt {$rebuilt} dashboard snapshots.");

        return self::SUCCESS;
    }

    /**
     * @return list<array{id: string, label: string, value: int, status: string}>
     */
    private function computeMetrics(): array
    {
        return [
            [
                'id' => 'students',
                'label' => 'Active students',
                'value' => Student::query()->where('status', 'active')->count(),
                'status' => 'neutral',
            ],
            [
                'id' => 'attendance',
                'label' => 'Attendance today',
                'value' => AttendanceRecord::query()->whereDate('attendance_date', today())->count(),
                'status' => 'neutral',
            ],
            [
                'id' => 'assessments',
                'label' => 'Active assessments',
                'value' => Assessment::query()->whereIn('status', ['draft', 'submitted', 'under_review'])->count(),
                'status' => 'neutral',
            ],
            [
                'id' => 'results',
                'label' => 'Published results',
                'value' => ResultPublication::query()->where('status', 'published')->count(),
                'status' => 'neutral',
            ],
        ];
    }
}
