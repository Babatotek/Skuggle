<?php

namespace App\Notifications;

use App\Mail\SkuggleBrandedMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class WelcomeToSkuggleNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): SkuggleBrandedMail
    {
        $frontend = rtrim((string) config('skuggle.frontend_url'), '/');
        $to = $notifiable->routeNotificationFor('mail', $this) ?: $notifiable->email;

        return (new SkuggleBrandedMail(
            mailSubject: 'Welcome to Skuggle',
            preheader: 'Your verified Skuggle workspace is ready.',
            eyebrow: 'Welcome to Skuggle',
            title: 'Your workspace is ready, '.($notifiable->name ?: 'welcome').'!',
            intro: 'Your email is verified and your secure learning workspace is ready. You can now configure your school, invite your team, and begin managing learning in one place.',
            buttonLabel: 'Open my workspace',
            buttonUrl: $frontend.'/login',
            details: [
                'Complete your school profile and branding.',
                'Invite staff, learners, and parents securely.',
                'Configure MFA from the school security settings whenever your policy requires it.',
            ],
            closing: 'Run your school. Grow every learner.',
        ))->to($to, $notifiable->name ?? null);
    }
}
