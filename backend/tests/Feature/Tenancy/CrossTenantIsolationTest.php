<?php

namespace Tests\Feature\Tenancy;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class CrossTenantIsolationTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_user_cannot_view_student_from_another_tenant(): void
    {
        ['tenant' => $tenantA, 'user' => $userA] = $this->makeTenantUser('teacher');
        ['tenant' => $tenantB] = $this->makeTenantUser('teacher');

        $studentB = $this->makeStudentForTenant($tenantB);

        $response = $this->actingAsTenantUser($userA, $tenantA)
            ->getJson('/api/v1/students/'.$studentB->public_id);

        $response->assertNotFound();
    }

    public function test_student_list_only_includes_current_tenant(): void
    {
        ['tenant' => $tenantA, 'user' => $userA] = $this->makeTenantUser('teacher');
        ['tenant' => $tenantB] = $this->makeTenantUser('teacher');

        $this->makeStudentForTenant($tenantA, ['first_name' => 'TenantA']);
        $this->makeStudentForTenant($tenantB, ['first_name' => 'TenantB']);

        $response = $this->actingAsTenantUser($userA, $tenantA)
            ->getJson('/api/v1/students');

        $response->assertOk();
        $names = collect($response->json('data.data'))->pluck('fullName')->implode(' ');
        $this->assertStringContainsString('TenantA', $names);
        $this->assertStringNotContainsString('TenantB', $names);
    }
}
