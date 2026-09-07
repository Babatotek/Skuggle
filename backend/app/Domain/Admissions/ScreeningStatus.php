<?php

namespace App\Domain\Admissions;

enum ScreeningStatus: string
{
    case Scheduled = 'scheduled';
    case Passed = 'passed';
    case Failed = 'failed';
}
