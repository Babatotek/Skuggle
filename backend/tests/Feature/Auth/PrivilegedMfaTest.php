<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class PrivilegedMfaTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_privileged_mfa_is_optional_by_default(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin');

        $response = $this->actingAsTenantUser($user, $tenant)
            ->getJson('/api/v1/auth/me');

        $response->assertOk();
        $this->assertFalse($response->json('data.user.mfaPolicyEnabled'));
        $this->assertFalse($response->json('data.user.mfaRequired'));
    }

    public function test_school_admin_can_enable_privileged_mfa_policy(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin');

        $this->actingAsTenantUser($user, $tenant)
            ->withHeader('Idempotency-Key', 'enable-mfa-policy')
            ->putJson('/api/v1/auth/mfa/policy', ['requireForPrivilegedRoles' => true])
            ->assertOk()
            ->assertJsonPath('data.policyEnabled', true);

        $response = $this->actingAsTenantUser($user, $tenant)->getJson('/api/v1/auth/mfa');

        $response->assertOk();
        $this->assertTrue($response->json('data.privileged'));
        $this->assertTrue($response->json('data.required'));
    }

    public function test_privileged_role_without_mfa_is_blocked_only_when_school_policy_is_enabled(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin');

        $this->actingAsTenantUser($user, $tenant)
            ->withHeader('Idempotency-Key', 'enable-mfa-policy-for-gate')
            ->putJson('/api/v1/auth/mfa/policy', ['requireForPrivilegedRoles' => true])
            ->assertOk();

        $this->actingAsTenantUser($user, $tenant)
            ->withHeader('Idempotency-Key', 'mfa-enrollment-test')
            ->putJson('/api/v1/custom-fields/student', ['definitions' => []])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'MFA_ENROLLMENT_REQUIRED');
    }

    public function test_non_privileged_role_is_not_required_mfa(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('teacher');

        $response = $this->actingAsTenantUser($user, $tenant)
            ->getJson('/api/v1/auth/mfa');

        $response->assertOk();
        $this->assertFalse($response->json('data.required'));
    }
}
