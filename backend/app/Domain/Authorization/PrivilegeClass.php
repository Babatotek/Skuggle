<?php

namespace App\Domain\Authorization;

enum PrivilegeClass: string
{
    case STANDARD = 'STANDARD';
    case SENSITIVE = 'SENSITIVE';
    case PRIVILEGED = 'PRIVILEGED';
    case PLATFORM_CRITICAL = 'PLATFORM_CRITICAL';
}
