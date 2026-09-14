<?php

namespace Tests\Unit\Support;

use App\Support\SchoolCode;
use Tests\TestCase;

class SchoolCodeTest extends TestCase
{
    public function test_derives_initials_from_school_name(): void
    {
        $this->assertSame('FGGS', SchoolCode::fromName('Fiwasaye Girls Grammer School'));
        $this->assertSame('RGA', SchoolCode::fromName('Royal Gateway Academy'));
        $this->assertSame('FGGS', SchoolCode::fromName('The Fiwasaye Girls Grammar School'));
    }
}
