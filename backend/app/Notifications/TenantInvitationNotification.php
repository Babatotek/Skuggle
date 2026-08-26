<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $schoolName,
        public readonly string $roleLabel,
        public readonly string $registrationLink,
        public readonly string $expiresAt,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("You're invited to {$this->schoolName} on Skuggle")
            ->greeting('Hello')
            ->line("You have been invited to join {$this->schoolName} as {$this->roleLabel}.")
            ->line("This invitation expires on {$this->expiresAt}.")
            ->action('Accept invitation', $this->registrationLink)
            ->line('If you were not expecting this email, you can ignore it.');
    }
}
