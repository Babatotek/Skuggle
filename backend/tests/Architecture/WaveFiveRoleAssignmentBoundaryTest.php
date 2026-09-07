<?php

namespace Tests\Architecture;

use Tests\TestCase;

final class WaveFiveRoleAssignmentBoundaryTest extends TestCase
{
    public function test_architecture_guard_approves_only_the_controlled_assignment_write_boundary(): void
    {
        $guard = file_get_contents(base_path('../scripts/architecture-guard.mjs'));

        $this->assertIsString($guard);
        $this->assertStringContainsString("['backend/app/Domain/Authorization/RoleAssignmentService.php'", $guard);
        $this->assertStringContainsString('count: 2', $guard);
        $this->assertStringContainsString('Wave 5 requires one controlled assignment mutation boundary', $guard);
        $this->assertStringContainsString('approvedDomainWrites.get(file)?.count ?? 0', $guard);
        $this->assertSame(1, substr_count($guard, 'approvedDomainWrites.get(file)?.count'));
    }
}
