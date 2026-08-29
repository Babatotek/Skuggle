<?php

namespace App\Notifications;

use App\Mail\SkuggleBrandedMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class ContactInquiryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array{fullName: string, workEmail: string, schoolName?: string|null, phone?: string|null, message?: string|null}  $inquiry
     */
    public function __construct(
        public readonly array $inquiry,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): SkuggleBrandedMail
    {
        $name = $this->inquiry['fullName'];
        $email = $this->inquiry['workEmail'];
        $school = trim((string) ($this->inquiry['schoolName'] ?? '')) ?: 'Not provided';
        $phone = trim((string) ($this->inquiry['phone'] ?? '')) ?: 'Not provided';
        $message = trim((string) ($this->inquiry['message'] ?? '')) ?: 'No message included.';
        $to = $notifiable->routeNotificationFor('mail', $this);

        return (new SkuggleBrandedMail(
            mailSubject: "New Skuggle demo request from {$name}",
            preheader: "{$name} requested a Skuggle demo.",
            eyebrow: 'Contact / demo request',
            title: 'New demo request',
            intro: "{$name} submitted the public contact form and asked to see Skuggle in action.",
            buttonLabel: 'Reply to requester',
            buttonUrl: 'mailto:'.rawurlencode($email),
            details: [
                "Name: {$name}",
                "Work email: {$email}",
                "School: {$school}",
                "Phone: {$phone}",
                "Message: {$message}",
            ],
            closing: 'Respond within one business day to keep the sales conversation warm.',
            replyToAddress: $email,
            replyToName: $name,
        ))->to($to);
    }
}
