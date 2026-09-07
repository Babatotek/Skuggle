<?php

namespace App\Domain\Admissions;

enum DecisionType: string
{
    case Offered = 'offered';
    case Waitlisted = 'waitlisted';
    case Rejected = 'rejected';
}
