<?php

namespace Tests\Feature\Public;

use App\Notifications\ContactInquiryNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ContactInquiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_contact_form_queues_branded_inquiry(): void
    {
        Notification::fake();
        config(['skuggle.mail.contact_to' => 'ops@skuggle.test']);

        $this->postJson('/api/v1/public/contact', [
            'fullName' => 'Ada Lovelace',
            'workEmail' => 'ada@school.edu',
            'schoolName' => 'Analytical Engine Academy',
            'phone' => '08001112222',
            'message' => 'We would like a demo next week.',
        ])->assertAccepted()
            ->assertJsonPath('data.message', fn ($message) => is_string($message) && str_contains($message, 'Demo request'));

        Notification::assertSentOnDemand(ContactInquiryNotification::class);
    }
}
