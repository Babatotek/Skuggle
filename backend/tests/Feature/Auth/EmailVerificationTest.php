<?php

namespace Tests\Feature\Auth;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_unverified_user_cannot_access_verified_routes(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin', [], [
            'email_verified_at' => null,
        ]);

        $response = $this->actingAsTenantUser($user, $tenant)
            ->getJson('/api/v1/students');

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'EMAIL_UNVERIFIED');
    }

    public function test_signed_verification_link_marks_email_verified(): void
    {
        ['user' => $user] = $this->makeTenantUser('school_admin', [], [
            'email_verified_at' => null,
        ]);

        $url = URL::temporarySignedRoute(
            'skuggle.verification.verify',
            now()->addMinutes(60),
            ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
        );

        $response = $this->get($url);

        $response->assertRedirect();
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->assertStringContainsString('status=success', (string) $response->headers->get('Location'));
    }

    public function test_resend_verification_sends_notification(): void
    {
        Notification::fake();

        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_admin', [], [
            'email_verified_at' => null,
        ]);

        $response = $this->actingAsTenantUser($user, $tenant)
            ->postJson('/api/v1/auth/email/verification-notification');

        $response->assertOk();
        Notification::assertSentTo($user, VerifyEmail::class);
    }
}
