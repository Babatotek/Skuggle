<?php

namespace App\Domain\Assessments;

enum SmartmarkConfidenceBand: string
{
    case High = 'HIGH_CONFIDENCE';
    case Medium = 'MEDIUM_CONFIDENCE';
    case Low = 'LOW_CONFIDENCE';
    case Unreadable = 'UNREADABLE';
    case Unmatched = 'UNMATCHED';

    public function requiresHumanReview(): bool
    {
        return $this !== self::High;
    }

    public function label(): string
    {
        return match ($this) {
            self::High => 'High confidence',
            self::Medium => 'Medium confidence',
            self::Low => 'Low confidence',
            self::Unreadable => 'Unreadable',
            self::Unmatched => 'Unmatched student',
        };
    }
}
