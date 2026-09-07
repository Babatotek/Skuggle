<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\SchoolClass;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

final class AdmissionNumberGenerator
{
    public const DEFAULT_PATTERN = '{SCHOOL_CODE}/{YEAR}/{CLASS}/{SEQUENCE:4}';

    public function __construct(
        private readonly TenantContext $context,
        private readonly TenantSequence $sequence,
    ) {}

    public function pattern(?Tenant $tenant = null): string
    {
        $tenant ??= $this->context->tenant();

        return (string) data_get($tenant->settings, 'registration.admission_number_pattern', self::DEFAULT_PATTERN);
    }

    public function preview(?string $classPublicId = null, ?string $admissionType = null, ?string $campusCode = null): string
    {
        return $this->generate($classPublicId, $admissionType, $campusCode, preview: true);
    }

    public function generate(?string $classPublicId = null, ?string $admissionType = null, ?string $campusCode = null, bool $preview = false): string
    {
        $tenant = $this->context->tenant();
        $pattern = $this->pattern($tenant);
        $sequence = $preview ? $this->peekNextSequence() : $this->sequence->next('student_admission');

        $classLabel = 'GEN';
        if ($classPublicId) {
            $class = SchoolClass::query()->where('public_id', $classPublicId)->first();
            if ($class) {
                $classLabel = strtoupper(preg_replace('/\s+/', '', trim($class->name.$class->arm)) ?: 'GEN');
            }
        }

        $replacements = [
            '{SCHOOL_CODE}' => strtoupper((string) ($tenant->code ?: 'SKG')),
            '{YEAR}' => now()->format('Y'),
            '{SESSION}' => now()->format('Y'),
            '{CLASS}' => $classLabel,
            '{CAMPUS}' => strtoupper((string) ($campusCode ?: 'MAIN')),
            '{ADMISSION_TYPE}' => strtoupper((string) ($admissionType ?: 'NEW')),
        ];

        $result = strtr($pattern, $replacements);

        return preg_replace_callback('/\{SEQUENCE(?::(\d+))?\}/', function (array $matches) use ($sequence): string {
            $width = isset($matches[1]) ? (int) $matches[1] : 6;

            return str_pad((string) $sequence, $width, '0', STR_PAD_LEFT);
        }, $result) ?? $result;
    }

    private function peekNextSequence(): int
    {
        $row = DB::table('tenant_sequences')
            ->where('tenant_id', $this->context->tenantId())
            ->where('name', 'student_admission')
            ->first();

        return $row ? (int) $row->next_value : 1;
    }
}
