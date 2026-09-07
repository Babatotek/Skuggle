<?php

namespace App\Services\Admissions;

use App\Domain\Admissions\ApplicationStatus;
use App\Exceptions\ApiException;
use App\Models\AdmissionApplication;
use App\Models\AdmissionCycle;
use App\Models\SchoolClass;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

final class AdmissionImportService
{
    private const REQUIRED_HEADERS = ['first_name', 'last_name'];

    private const OPTIONAL_HEADERS = [
        'middle_name', 'gender', 'date_of_birth', 'nationality', 'guardian_name',
        'guardian_phone', 'guardian_email', 'class',
    ];

    public function __construct(private readonly AuditLogger $audit) {}

    /** @return array{imported:int,applicationIds:list<string>} */
    public function import(UploadedFile $file, User $actor): array
    {
        $rows = $this->parse($file);
        $cycle = AdmissionCycle::query()->where('status', 'active')->first();
        $classes = SchoolClass::query()->get()->flatMap(function (SchoolClass $class): array {
            $name = trim($class->name);
            $nameWithArm = trim($class->name.' '.$class->arm);

            return [mb_strtolower($name) => $class, mb_strtolower($nameWithArm) => $class];
        });

        return DB::transaction(function () use ($rows, $cycle, $classes, $actor): array {
            $ids = [];
            foreach ($rows as $row) {
                $class = $row['class'] !== '' ? $classes->get(mb_strtolower($row['class'])) : null;
                if ($row['class'] !== '' && ! $class) {
                    throw new ApiException('ADMISSION_IMPORT_INVALID', "Class not found: {$row['class']}.", 422);
                }

                $application = AdmissionApplication::query()->create([
                    'admission_cycle_id' => $cycle?->getKey(),
                    'requested_class_id' => $class?->getKey(),
                    'reference' => 'APP-'.now()->format('Ym').'-'.Str::upper(Str::random(8)),
                    'status' => ApplicationStatus::Submitted,
                    'first_name' => $row['first_name'],
                    'middle_name' => $row['middle_name'] ?: null,
                    'last_name' => $row['last_name'],
                    'gender' => $row['gender'] ?: null,
                    'date_of_birth' => $row['date_of_birth'] ?: null,
                    'nationality' => $row['nationality'] ?: null,
                    'guardian_name' => $row['guardian_name'] ?: null,
                    'guardian_phone' => $row['guardian_phone'] ?: null,
                    'guardian_email' => $row['guardian_email'] ? mb_strtolower($row['guardian_email']) : null,
                    'submitted_at' => now(),
                    'status_changed_at' => now(),
                    'created_by' => $actor->getKey(),
                    'updated_by' => $actor->getKey(),
                ]);
                $application->history()->create([
                    'from_status' => null,
                    'to_status' => ApplicationStatus::Submitted,
                    'reason' => 'Application imported',
                    'changed_by' => $actor->getKey(),
                    'changed_at' => now(),
                ]);
                $this->audit->record('admissions.application.imported', $application, [], []);
                $ids[] = $application->public_id;
            }

            return ['imported' => count($ids), 'applicationIds' => $ids];
        });
    }

    /** @return list<array<string, string>> */
    private function parse(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            throw new ApiException('ADMISSION_IMPORT_UNREADABLE', 'The CSV file could not be read.', 422);
        }

        try {
            $headers = array_map(
                static fn (mixed $value): string => strtolower(trim((string) $value)),
                fgetcsv($handle) ?: [],
            );
            $missing = array_diff(self::REQUIRED_HEADERS, $headers);
            if ($missing !== []) {
                throw new ApiException('ADMISSION_IMPORT_INVALID', 'Missing CSV columns: '.implode(', ', $missing).'.', 422);
            }

            $indexes = array_flip($headers);
            $rows = [];
            $rowNumber = 1;
            while (($values = fgetcsv($handle)) !== false) {
                $rowNumber++;
                if (count($rows) >= 500) {
                    throw new ApiException('ADMISSION_IMPORT_LIMIT', 'A single import is limited to 500 applications.', 422);
                }
                if (collect($values)->every(static fn (mixed $value): bool => trim((string) $value) === '')) {
                    continue;
                }

                $row = [];
                foreach ([...self::REQUIRED_HEADERS, ...self::OPTIONAL_HEADERS] as $header) {
                    $row[$header] = isset($indexes[$header]) ? trim((string) ($values[$indexes[$header]] ?? '')) : '';
                }
                $validator = Validator::make($row, [
                    'first_name' => ['required', 'string', 'max:100'],
                    'middle_name' => ['nullable', 'string', 'max:100'],
                    'last_name' => ['required', 'string', 'max:100'],
                    'gender' => ['nullable', 'in:male,female,other,prefer_not_to_say'],
                    'date_of_birth' => ['nullable', 'date', 'before:today'],
                    'nationality' => ['nullable', 'string', 'max:80'],
                    'guardian_name' => ['nullable', 'string', 'max:190'],
                    'guardian_phone' => ['nullable', 'string', 'max:40'],
                    'guardian_email' => ['nullable', 'email', 'max:190'],
                    'class' => ['nullable', 'string', 'max:190'],
                ]);
                if ($validator->fails()) {
                    throw new ApiException(
                        'ADMISSION_IMPORT_INVALID',
                        "CSV row {$rowNumber} is invalid.",
                        422,
                        $validator->errors()->toArray(),
                    );
                }
                $rows[] = $row;
            }
        } finally {
            fclose($handle);
        }

        if ($rows === []) {
            throw new ApiException('ADMISSION_IMPORT_EMPTY', 'The CSV file contains no applications.', 422);
        }

        return $rows;
    }
}
