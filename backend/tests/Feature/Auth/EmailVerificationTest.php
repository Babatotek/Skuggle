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

    public function test_unverified_user_cannot_login(): void
    {
        Notification::fake();
        ['user' => $user] = $this->makeTenantUser('teacher', [], [
            'email_verified_at' => null,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'EMAIL_UNVERIFIED')
            ->assertJsonPath('error.fields.email.0', $user->email);

        $this->assertGuest();
    }

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
        $location = (string) $response->headers->get('Location');
        $this->assertStringContainsString('verified=success', $location);
        $this->assertStringContainsString('school=', $location);
        $this->assertStringContainsString('schoolName=', $location);
        $this->assertGuest();
        $this->assertNull(session('tenant_public_id'));
        Notification::assertSentTo($user, WelcomeToSkuggleNotification::class);
    }

    public function test_verification_email_link_uses_mail_link_origin(): void
    {
        config(['skuggle.mail_link_url' => 'http://mail-link.test', 'app.url' => 'http://app-internal.test']);

        $user = new User(['name' => 'Link Check', 'email' => 'link.check@example.test']);
        $user->public_id = '01TESTPUBLICID0000000000001';

        $html = (new VerifyEmailNotification)->toMail($user)->render();
        $this->assertStringContainsString('http://mail-link.test/email/verify/', $html);
        $this->assertStringNotContainsString('http://app-internal.test/email/verify/', $html);
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

    public function test_public_resend_by_email_sends_notification_without_login(): void
    {
        Notification::fake();

        ['user' => $user] = $this->makeTenantUser('school_admin', [], [
            'email_verified_at' => null,
        ]);

        $this->postJson('/api/v1/auth/email/resend', [
            'email' => $user->email,
        ])->assertOk();

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
