<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class PrivilegedMfaTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_privileged_role_without_mfa_is_blocked_on_mutating_routes(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin');

        $response = $this->actingAsTenantUser($user, $tenant)
            ->postJson('/api/v1/students', [
                'firstName' => 'Chioma',
                'lastName' => 'Eze',
                'gender' => 'female',
                'dateOfBirth' => '2015-01-01',
                'admissionDate' => now()->toDateString(),
                'classId' => '01INVALIDCLASSID000000',
                'guardians' => json_encode([['name' => 'Parent', 'relationship' => 'mother', 'phone' => '08000000000']]),
            ], ['Idempotency-Key' => 'test-idempotency-key-01']);

        $response->assertStatus(403);
        $this->assertSame('MFA_REQUIRED', $response->json('error.code'));
    }

    public function test_privileged_role_can_read_without_mfa(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin');

        $response = $this->actingAsTenantUser($user, $tenant)
            ->getJson('/api/v1/auth/me');

        $response->assertOk();
        $this->assertTrue($response->json('data.user.mfaRequired'));
    }

    public function test_non_privileged_role_is_not_blocked_without_mfa(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('teacher');

        $response = $this->actingAsTenantUser($user, $tenant)
            ->getJson('/api/v1/auth/mfa');

        $response->assertOk();
        $this->assertFalse($response->json('data.required'));
    }
}
