<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\AcademicSession;
use App\Models\Enrollment;
use App\Models\Guardian;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

final class StudentImportService
{
    /** @var list<string> */
    public const HEADERS = [
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'admission_date',
        'class_name',
        'guardian_name',
        'guardian_phone',
        'guardian_email',
    ];

    public function __construct(
        private readonly TenantContext $context,
        private readonly TenantSequence $sequence,
    ) {}

    public function templateCsv(): string
    {
        $lines = [implode(',', self::HEADERS)];
        $lines[] = 'Ada,Okoro,female,2012-05-14,2025-09-01,JSS 1 A,Jane Okoro,08030000001,jane@example.com';

        return implode("\n", $lines)."\n";
    }

    /** @return array{validRows: list<array<string, string>>, errors: list<array{row: int, field: string, message: string}>} */
    public function parseAndValidate(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            return ['validRows' => [], 'errors' => [['row' => 0, 'field' => 'file', 'message' => 'Could not read the uploaded file.']]];
        }

        $header = fgetcsv($handle) ?: [];
        $header = array_map(fn ($value) => strtolower(trim((string) $value)), $header);
        $missing = array_values(array_diff(self::HEADERS, $header));
        if ($missing !== []) {
            fclose($handle);

            return ['validRows' => [], 'errors' => [['row' => 1, 'field' => 'header', 'message' => 'Missing columns: '.implode(', ', $missing)]]];
        }

        $indexes = array_flip($header);
        $validRows = [];
        $errors = [];
        $rowNumber = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if ($this->isBlankRow($row)) {
                continue;
            }

            $record = [];
            foreach (self::HEADERS as $column) {
                $record[$column] = trim((string) ($row[$indexes[$column]] ?? ''));
            }

            $rowErrors = $this->validateRow($record, $rowNumber);
            if ($rowErrors !== []) {
                array_push($errors, ...$rowErrors);
                continue;
            }

            $validRows[] = $record;
        }

        fclose($handle);

        return ['validRows' => $validRows, 'errors' => $errors];
    }

    /** @param list<array<string, string>> $rows */
    public function importRows(array $rows): array
    {
        $session = AcademicSession::query()->where('is_current', true)->first();
        if (! $session) {
            return ['imported' => 0, 'errors' => [['row' => 0, 'field' => 'session', 'message' => 'Configure a current academic session before importing students.']]];
        }

        $imported = 0;
        $errors = [];

        DB::transaction(function () use ($rows, $session, &$imported, &$errors): void {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;
                try {
                    $class = $this->resolveClass($row['class_name']);
                    if (! $class) {
                        $errors[] = ['row' => $rowNumber, 'field' => 'class_name', 'message' => 'Class not found: '.$row['class_name']];
                        continue;
                    }

                    $student = Student::query()->create([
                        'admission_number' => sprintf('SKU-%s-%06d', now()->format('Y'), $this->sequence->next('student_admission')),
                        'first_name' => $row['first_name'],
                        'last_name' => $row['last_name'],
                        'gender' => strtolower($row['gender']),
                        'date_of_birth' => $row['date_of_birth'],
                        'admission_date' => $row['admission_date'],
                        'status' => 'active',
                    ]);

                    Enrollment::query()->create([
                        'student_id' => $student->getKey(),
                        'class_id' => $class->getKey(),
                        'academic_session_id' => $session->getKey(),
                        'status' => 'active',
                    ]);

                    $guardian = Guardian::query()->create([
                        'name' => $row['guardian_name'],
                        'phone' => $row['guardian_phone'],
                        'email' => $row['guardian_email'] ?: null,
                    ]);

                    $student->guardians()->attach($guardian->getKey(), [
                        'tenant_id' => $this->context->tenantId(),
                        'relationship' => 'Parent',
                        'preferred_contact' => true,
                        'billing_responsible' => false,
                        'authorized_pickup' => false,
                    ]);

                    $imported++;
                } catch (\Throwable $exception) {
                    $errors[] = ['row' => $rowNumber, 'field' => 'row', 'message' => 'Could not import this row.'];
                }
            }
        });

        return ['imported' => $imported, 'errors' => $errors];
    }

    /** @param array<string, string> $record */
    private function validateRow(array $record, int $rowNumber): array
    {
        $errors = [];
        foreach (['first_name', 'last_name', 'gender', 'date_of_birth', 'admission_date', 'class_name', 'guardian_name', 'guardian_phone'] as $field) {
            if ($record[$field] === '') {
                $errors[] = ['row' => $rowNumber, 'field' => $field, 'message' => 'This field is required.'];
            }
        }

        if ($record['gender'] !== '' && ! in_array(strtolower($record['gender']), ['male', 'female', 'other', 'prefer_not_to_say'], true)) {
            $errors[] = ['row' => $rowNumber, 'field' => 'gender', 'message' => 'Gender must be male, female, other, or prefer_not_to_say.'];
        }

        foreach (['date_of_birth', 'admission_date'] as $dateField) {
            if ($record[$dateField] !== '' && strtotime($record[$dateField]) === false) {
                $errors[] = ['row' => $rowNumber, 'field' => $dateField, 'message' => 'Use YYYY-MM-DD date format.'];
            }
        }

        if ($record['guardian_email'] !== '' && ! filter_var($record['guardian_email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['row' => $rowNumber, 'field' => 'guardian_email', 'message' => 'Guardian email is invalid.'];
        }

        return $errors;
    }

    /** @param list<string|null> $row */
    private function isBlankRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function resolveClass(string $label): ?SchoolClass
    {
        $label = trim($label);
        $classes = SchoolClass::query()->where('status', 'active')->get();

        $exact = $classes->first(function (SchoolClass $class) use ($label): bool {
            $full = trim($class->name.' '.$class->arm);

            return strcasecmp($full, $label) === 0 || strcasecmp($class->name, $label) === 0;
        });

        return $exact;
    }
}
