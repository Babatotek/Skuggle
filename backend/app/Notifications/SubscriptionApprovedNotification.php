<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class SubscriptionApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $planName,
        public readonly ?string $renewalDate = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $details = ["Your {$this->planName} features and limits are now active."];
        if ($this->renewalDate) {
            $details[] = "Your next renewal date is {$this->renewalDate}.";
        }

        return (new MailMessage)
            ->subject("Your Skuggle {$this->planName} subscription is approved")
            ->view('emails.skuggle', [
                'preheader' => "Your {$this->planName} subscription has been approved.",
                'eyebrow' => 'Subscription approved',
                'title' => 'You are all set!',
                'intro' => "Good news, {$notifiable->name}. Your Skuggle {$this->planName} subscription has been approved and activated.",
                'buttonLabel' => 'View subscription',
                'buttonUrl' => rtrim((string) config('skuggle.frontend_url'), '/').'/app/subscription',
                'details' => $details,
                'closing' => 'Thank you for choosing Skuggle for your learning community.',
            ]);
    }
}
