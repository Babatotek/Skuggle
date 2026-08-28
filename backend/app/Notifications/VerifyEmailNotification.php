<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

final class VerifyEmailNotification extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    public function toMail($notifiable): MailMessage
    {
        $url = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify your Skuggle account')
            ->view('emails.skuggle', [
                'preheader' => 'Verify your email address to activate your secure Skuggle workspace.',
                'eyebrow' => 'Account verification',
                'title' => 'One last step, '.($notifiable->name ?: 'welcome').'!',
                'intro' => 'Your Skuggle account has been created. Confirm your email address to protect your account and open your workspace.',
                'buttonLabel' => 'Verify email address',
                'buttonUrl' => $url,
                'details' => [
                    'This secure link expires in '.config('auth.verification.expire', 60).' minutes.',
                    'If you did not create this account, no action is required.',
                ],
                'closing' => 'We are delighted to help your school run smoothly and every learner grow.',
            ]);
    }
}
