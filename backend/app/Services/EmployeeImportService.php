<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\Campus;
use App\Models\Department;
use App\Models\Employee;
use App\Models\WorkforcePosition;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

final class EmployeeImportService
{
    /** @var list<string> */
    public const HEADERS = [
        'employee_number',
        'name',
        'employment_type',
        'status',
        'staff_category',
        'position_name',
        'department_name',
        'campus_name',
        'email',
        'phone',
        'started_at',
    ];

    private const STATUSES = ['active', 'probation', 'on_leave', 'suspended', 'resigned', 'retired', 'terminated', 'inactive'];

    public function __construct(
        private readonly TenantContext $context,
        private readonly CustomFieldRegistry $customFields,
    ) {}

    public function templateCsv(): string
    {
        $customHeaders = collect($this->customFields->definitions($this->context->tenant(), CustomFieldRegistry::ENTITY_STAFF, true))
            ->pluck('key')
            ->filter()
            ->map(fn ($key) => 'custom_'.$key)
            ->all();

        $lines = [implode(',', [...self::HEADERS, ...$customHeaders])];
        $lines[] = 'FGGS-E-101,Mrs. Ada Okoro,full_time,active,teaching,Classroom Teacher,Academics,Main Campus,ada@example.com,08030000001,2025-09-01';

        return implode("\n", $lines)."\n";
    }

    /** @return array{validRows: list<array<string, mixed>>, errors: list<array{row: int, field: string, message: string}>} */
    public function parseAndValidate(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            return ['validRows' => [], 'errors' => [['row' => 0, 'field' => 'file', 'message' => 'Could not read the uploaded file.']]];
        }

        $header = fgetcsv($handle) ?: [];
        $header = array_map(fn ($value) => strtolower(trim((string) $value)), $header);
        $required = ['employee_number', 'name', 'employment_type'];
        $missing = array_values(array_diff($required, $header));
        if ($missing !== []) {
            fclose($handle);

            return ['validRows' => [], 'errors' => [['row' => 1, 'field' => 'header', 'message' => 'Missing columns: '.implode(', ', $missing)]]];
        }

        $indexes = array_flip($header);
        $validRows = [];
        $errors = [];
        $rowNumber = 1;
        $seenNumbers = [];

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if ($this->isBlankRow($row)) {
                continue;
            }

            $record = [];
            foreach (self::HEADERS as $column) {
                $record[$column] = isset($indexes[$column]) ? trim((string) ($row[$indexes[$column]] ?? '')) : '';
            }

            $rowErrors = $this->validateRow($record, $rowNumber, $seenNumbers);
            if ($rowErrors !== []) {
                array_push($errors, ...$rowErrors);
                continue;
            }

            $seenNumbers[mb_strtolower($record['employee_number'])] = true;
            $validRows[] = $record;
        }

        fclose($handle);

        return ['validRows' => $validRows, 'errors' => $errors];
    }

    /** @param list<array<string, mixed>> $rows */
    public function importRows(array $rows): array
    {
        $imported = 0;
        $errors = [];

        DB::transaction(function () use ($rows, &$imported, &$errors): void {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;
                try {
                    $number = trim((string) $row['employee_number']);
                    if (Employee::query()->where('employee_number', $number)->exists()) {
                        $errors[] = ['row' => $rowNumber, 'field' => 'employee_number', 'message' => 'Employee number already exists: '.$number];
                        continue;
                    }

                    $positionId = null;
                    if (! empty($row['position_name'])) {
                        $position = WorkforcePosition::query()->whereRaw('lower(name) = ?', [mb_strtolower(trim((string) $row['position_name']))])->first();
                        if (! $position) {
                            $category = in_array(($row['staff_category'] ?? ''), ['teaching', 'non_teaching'], true) ? $row['staff_category'] : 'teaching';
                            $position = WorkforcePosition::query()->create([
                                'name' => trim((string) $row['position_name']),
                                'category' => $category,
                            ]);
                        }
                        $positionId = $position->getKey();
                    }

                    $departmentId = null;
                    if (! empty($row['department_name'])) {
                        $department = Department::query()->whereRaw('lower(name) = ?', [mb_strtolower(trim((string) $row['department_name']))])->first();
                        if (! $department) {
                            $errors[] = ['row' => $rowNumber, 'field' => 'department_name', 'message' => 'Department not found: '.$row['department_name']];
                            continue;
                        }
                        $departmentId = $department->getKey();
                    }

                    $campusId = null;
                    if (! empty($row['campus_name'])) {
                        $campus = Campus::query()->whereRaw('lower(name) = ?', [mb_strtolower(trim((string) $row['campus_name']))])->first();
                        if (! $campus) {
                            $errors[] = ['row' => $rowNumber, 'field' => 'campus_name', 'message' => 'Campus not found: '.$row['campus_name']];
                            continue;
                        }
                        $campusId = $campus->getKey();
                    }

                    $status = strtolower(trim((string) ($row['status'] ?: 'active')));
                    $category = strtolower(trim((string) ($row['staff_category'] ?: '')));
                    Employee::query()->create([
                        'employee_number' => $number,
                        'name' => trim((string) $row['name']),
                        'employment_type' => trim((string) $row['employment_type']),
                        'status' => in_array($status, self::STATUSES, true) ? $status : 'active',
                        'staff_category' => in_array($category, ['teaching', 'non_teaching'], true) ? $category : null,
                        'position_id' => $positionId,
                        'department_id' => $departmentId,
                        'campus_id' => $campusId,
                        'started_at' => ! empty($row['started_at']) ? $row['started_at'] : null,
                        'metadata' => [
                            'personal' => [
                                'email' => ! empty($row['email']) ? trim((string) $row['email']) : null,
                                'phone' => ! empty($row['phone']) ? trim((string) $row['phone']) : null,
                            ],
                            'professional' => [],
                            'custom_fields' => [],
                        ],
                    ]);
                    $imported++;
                } catch (\Throwable $error) {
                    $errors[] = ['row' => $rowNumber, 'field' => 'row', 'message' => $error->getMessage()];
                }
            }
        });

        return ['imported' => $imported, 'errors' => $errors];
    }

    /** @param array<string, string> $record */
    private function validateRow(array $record, int $rowNumber, array $seenNumbers): array
    {
        $errors = [];
        if ($record['employee_number'] === '') {
            $errors[] = ['row' => $rowNumber, 'field' => 'employee_number', 'message' => 'Employee number is required.'];
        } elseif (isset($seenNumbers[mb_strtolower($record['employee_number'])])) {
            $errors[] = ['row' => $rowNumber, 'field' => 'employee_number', 'message' => 'Duplicate employee number in file.'];
        }
        if ($record['name'] === '') {
            $errors[] = ['row' => $rowNumber, 'field' => 'name', 'message' => 'Name is required.'];
        }
        if ($record['employment_type'] === '') {
            $errors[] = ['row' => $rowNumber, 'field' => 'employment_type', 'message' => 'Employment type is required.'];
        }
        if ($record['status'] !== '' && ! in_array(strtolower($record['status']), self::STATUSES, true)) {
            $errors[] = ['row' => $rowNumber, 'field' => 'status', 'message' => 'Invalid employment status.'];
        }
        if ($record['staff_category'] !== '' && ! in_array(strtolower($record['staff_category']), ['teaching', 'non_teaching'], true)) {
            $errors[] = ['row' => $rowNumber, 'field' => 'staff_category', 'message' => 'Staff category must be teaching or non_teaching.'];
        }
        if ($record['email'] !== '' && ! filter_var($record['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['row' => $rowNumber, 'field' => 'email', 'message' => 'Invalid email address.'];
        }
        if ($record['started_at'] !== '' && strtotime($record['started_at']) === false) {
            $errors[] = ['row' => $rowNumber, 'field' => 'started_at', 'message' => 'Invalid start date.'];
        }

        return $errors;
    }

    /** @param list<mixed> $row */
    private function isBlankRow(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }
}
