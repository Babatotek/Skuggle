<?php

namespace App\Domain\Admissions;

enum CycleStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Closed = 'closed';
}
