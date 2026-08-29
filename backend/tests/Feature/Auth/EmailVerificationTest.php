<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ContactInquiryNotification;
use App\Notifications\SubscriptionApprovedNotification;
use App\Notifications\VerifyEmailNotification;
use App\Notifications\WelcomeToSkuggleNotification;
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
        Notification::fake();
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
        Notification::assertSentTo($user, WelcomeToSkuggleNotification::class);
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
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_transactional_email_templates_are_branded_and_actionable(): void
    {
        $user = new User(['name' => 'Demo Client', 'email' => 'client@example.test']);
        $user->public_id = '01TESTPUBLICID0000000000000';

        $verification = (new VerifyEmailNotification)->toMail($user)->render();
        $welcome = (new WelcomeToSkuggleNotification)->toMail($user)->render();
        $subscription = (new SubscriptionApprovedNotification('Enterprise', '30 September 2026'))->toMail($user)->render();
        $contact = (new ContactInquiryNotification([
            'fullName' => 'Demo Client',
            'workEmail' => 'client@example.test',
            'schoolName' => 'Demo School',
            'phone' => '08000000000',
            'message' => 'Please book a demo.',
        ]))->toMail($user)->render();

        foreach ([$verification, $welcome, $subscription, $contact] as $html) {
            $this->assertStringContainsString('Skuggle', $html);
            $this->assertStringContainsString('alt="Skuggle"', $html);
            $this->assertTrue(
                str_contains($html, 'cid:')
                    || str_contains($html, 'data:image')
                    || str_contains($html, 'skuggle-logo.png'),
                'Expected embedded or linked Skuggle logo in email HTML.',
            );
            $this->assertStringContainsString('One identity. Every learning space.', $html);
        }
    }
}
