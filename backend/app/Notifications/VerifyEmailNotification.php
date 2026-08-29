<?php

namespace App\Notifications;

use App\Mail\SkuggleBrandedMail;
use Illuminate\Auth\Notifications\VerifyEmail;

/**
 * Sent synchronously so shared hosting / local setups without a queue worker
 * still deliver the verification link immediately after registration.
 */
final class VerifyEmailNotification extends VerifyEmail
{
    public function toMail($notifiable): SkuggleBrandedMail
    {
        $url = $this->verificationUrl($notifiable);

        return (new SkuggleBrandedMail(
            mailSubject: 'Verify your Skuggle account',
            preheader: 'Verify your email address to activate your secure Skuggle workspace.',
            eyebrow: 'Account verification',
            title: 'One last step, '.($notifiable->name ?: 'welcome').'!',
            intro: 'Your Skuggle account has been created. Confirm your email address to protect your account and open your workspace.',
            buttonLabel: 'Verify email address',
            buttonUrl: $url,
            details: [
                'This secure link expires in '.config('auth.verification.expire', 60).' minutes.',
                'If you did not create this account, no action is required.',
            ],
            closing: 'We are delighted to help your school run smoothly and every learner grow.',
        ))->to($notifiable->getEmailForVerification(), $notifiable->name ?: null);
    }
}
