<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\AssessmentType;
use App\Models\Tenant;

final class AssessmentSettings
{
    /** @return array<string, mixed> */
    public static function defaults(): array
    {
        return [
            'moderationRequired' => true,
            'multiStageModeration' => true,
            'defaultDuration' => 60,
            'caStructure' => ['ca1' => 10, 'ca2' => 10, 'exam' => 80],
            'weighting' => ['continuous-assessment' => 20, 'exam' => 80],
            'markingRules' => ['partialCredit' => true, 'absentScore' => null],
            'cbtDefaults' => [
                'randomQuestions' => false,
                'randomOptions' => false,
                'attemptLimit' => 1,
                'resumePolicy' => 'allow',
                'feedbackPolicy' => 'score',
                'latePolicy' => 'reject',
                'navigationRestricted' => false,
            ],
            'smartmarkDefaults' => [
                'highThreshold' => (float) config('skuggle.ocr.review_threshold', 92),
                'mediumThreshold' => (float) config('skuggle.ocr.medium_threshold', 75),
                'lowThreshold' => (float) config('skuggle.ocr.low_threshold', 50),
                'autoProposeHigh' => true,
                'preferGeometric' => (bool) config('skuggle.ocr.prefer_geometric', true),
            ],
            'questionBankDefaults' => ['requireReview' => true, 'defaultDifficulty' => 'medium'],
            'paperTemplates' => ['includeLogo' => true, 'includeQr' => true],
            'aiAssistance' => ['questionGeneration' => true, 'theoryMarking' => true],
            'notifications' => [
                'teacherScheduled' => true,
                'teacherMarkingDue' => true,
                'officerExceptions' => true,
                'studentAvailable' => true,
            ],
        ];
    }

    /** @return array<string, mixed> */
    public static function forTenant(?Tenant $tenant = null): array
    {
        $tenant ??= app(TenantContext::class)->tenant();
        $stored = is_array($tenant->settings['assessment'] ?? null) ? $tenant->settings['assessment'] : [];

        return array_replace_recursive(self::defaults(), $stored);
    }

    public static function seedTypes(Tenant $tenant): void
    {
        if (AssessmentType::query()->where('tenant_id', $tenant->getKey())->exists()) {
            return;
        }
        $defaults = [
            ['continuous-assessment', 'Continuous Assessment', 20, 10, ['paper', 'manual', 'cbt']],
            ['quiz', 'Quiz', 10, 5, ['cbt', 'paper', 'manual']],
            ['test', 'Test', 20, 10, ['paper', 'manual', 'cbt', 'smartmark']],
            ['mid-term-test', 'Mid-Term Test', 40, 20, ['paper', 'cbt', 'smartmark']],
            ['exam', 'Examination', 60, 40, ['paper', 'cbt', 'smartmark']],
            ['assignment', 'Assignment', 20, 10, ['manual', 'project']],
            ['project', 'Project', 30, 10, ['project', 'manual']],
            ['practical', 'Practical', 20, 10, ['project', 'oral']],
            ['oral', 'Oral', 10, 5, ['oral']],
            ['presentation', 'Presentation', 20, 5, ['oral', 'project']],
        ];
        foreach ($defaults as $index => [$code, $name, $max, $weight, $delivery]) {
            AssessmentType::query()->create([
                'code' => $code,
                'name' => $name,
                'default_maximum_score' => $max,
                'default_weight' => $weight,
                'allowed_delivery' => $delivery,
                'moderation_required' => ! in_array($code, ['quiz', 'assignment'], true),
                'resit_allowed' => in_array($code, ['exam', 'mid-term-test'], true),
                'result_contribution' => $code !== 'quiz',
                'is_active' => true,
                'position' => $index + 1,
            ]);
        }
    }
}
