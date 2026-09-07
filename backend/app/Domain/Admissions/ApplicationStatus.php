<?php

namespace App\Domain\Admissions;

enum ApplicationStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case Screening = 'screening';
    case Screened = 'screened';
    case Waitlisted = 'waitlisted';
    case Offered = 'offered';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';
    case Enrolled = 'enrolled';

    /** @return list<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::Submitted, self::Withdrawn],
            self::Submitted => [self::Screening, self::Rejected, self::Withdrawn],
            self::Screening => [self::Screened, self::Waitlisted, self::Rejected, self::Withdrawn],
            self::Screened => [self::Offered, self::Waitlisted, self::Rejected],
            self::Waitlisted => [self::Offered, self::Rejected, self::Withdrawn],
            self::Offered => [self::Accepted, self::Declined, self::Withdrawn],
            self::Accepted => [self::Enrolled, self::Withdrawn],
            self::Declined, self::Rejected, self::Withdrawn, self::Enrolled => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }
}
