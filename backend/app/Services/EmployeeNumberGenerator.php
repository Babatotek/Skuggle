<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\Employee;
use App\Models\Tenant;
use App\Support\SchoolCode;
use Illuminate\Support\Facades\DB;

final class EmployeeNumberGenerator
{
    public const DEFAULT_PATTERN = '{SCHOOL_CODE}-E-{SEQUENCE:3}';

    public function __construct(
        private readonly TenantContext $context,
        private readonly TenantSequence $sequence,
    ) {}

    public function pattern(?Tenant $tenant = null): string
    {
        $tenant ??= $this->context->tenant();

        return (string) data_get($tenant->settings, 'registration.employee_number_pattern', self::DEFAULT_PATTERN);
    }

    public function preview(?Tenant $tenant = null): string
    {
        return $this->generate(preview: true, tenant: $tenant);
    }

    public function generate(bool $preview = false, ?Tenant $tenant = null): string
    {
        $tenant ??= $this->context->tenant();
        $pattern = $this->pattern($tenant);
        $sequence = $preview ? $this->peekNextSequence($tenant) : $this->sequence->next('employee_number');

        $result = strtr($pattern, [
            '{SCHOOL_CODE}' => SchoolCode::forTenant($tenant),
            '{YEAR}' => now()->format('Y'),
            '{YEAR2}' => now()->format('y'),
        ]);

        return preg_replace_callback('/\{SEQUENCE(?::(\d+))?\}/', function (array $matches) use ($sequence): string {
            $width = isset($matches[1]) ? (int) $matches[1] : 3;

            return str_pad((string) $sequence, $width, '0', STR_PAD_LEFT);
        }, $result) ?? $result;
    }

    /**
     * Rewrite existing employee numbers so the prefix matches the current school name.
     * Preserves creation order. Safe under unique (tenant_id, employee_number).
     *
     * @return list<array{id: string, from: string, to: string}>
     */
    public function realignExisting(?Tenant $tenant = null): array
    {
        $tenant ??= $this->context->tenant();
        $employees = Employee::query()
            ->where('tenant_id', $tenant->getKey())
            ->orderBy('id')
            ->get();

        if ($employees->isEmpty()) {
            return [];
        }

        $prefix = SchoolCode::forTenant($tenant).'-E-';
        $changes = [];

        DB::transaction(function () use ($tenant, $employees, $prefix, &$changes): void {
            $snapshot = $employees->map(fn (Employee $employee) => [
                'model' => $employee,
                'from' => (string) $employee->employee_number,
            ]);

            foreach ($snapshot as $row) {
                $row['model']->forceFill(['employee_number' => '__ALIGN_'.$row['model']->getKey()])->saveQuietly();
            }

            foreach ($snapshot->values() as $index => $row) {
                $to = $prefix.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);
                $row['model']->forceFill(['employee_number' => $to])->saveQuietly();
                $changes[] = ['id' => $row['model']->public_id, 'from' => $row['from'], 'to' => $to];
            }

            DB::table('tenant_sequences')->updateOrInsert(
                ['tenant_id' => $tenant->getKey(), 'name' => 'employee_number'],
                [
                    'next_value' => $employees->count() + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        });

        return $changes;
    }

    private function peekNextSequence(?Tenant $tenant = null): int
    {
        $tenantId = $tenant?->getKey() ?? $this->context->tenantId();
        $row = DB::table('tenant_sequences')
            ->where('tenant_id', $tenantId)
            ->where('name', 'employee_number')
            ->first();

        return $row ? (int) $row->next_value : 1;
    }
}
