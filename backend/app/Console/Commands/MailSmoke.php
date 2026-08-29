<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\ContactInquiryNotification;
use App\Notifications\SubscriptionApprovedNotification;
use App\Notifications\VerifyEmailNotification;
use App\Notifications\WelcomeToSkuggleNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Throwable;

class MailSmoke extends Command
{
    protected $signature = 'mail:smoke
        {email : Destination address for the smoke test}
        {--subject=Skuggle mail delivery smoke test : Email subject}
        {--templates : Also send branded registration, contact, and subscription templates}';

    protected $description = 'Send a one-off smoke email to verify SMTP / mailer configuration';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $subject = (string) $this->option('subject');
        $mailer = (string) config('mail.default');

        $this->info("Mailer: {$mailer}");
        $this->info('From: '.config('mail.from.address'));
        $this->info("To: {$email}");
        $this->info('Host: '.config('mail.mailers.smtp.host').':'.config('mail.mailers.smtp.port'));
        $this->info('Scheme: '.(config('mail.mailers.smtp.scheme') ?: '(none)'));

        try {
            Mail::raw(
                "Skuggle mail smoke test\n\nSent at ".now()->toIso8601String()."\nEnvironment: ".config('app.env')."\nMailer: {$mailer}\n",
                function ($message) use ($email, $subject): void {
                    $message->to($email)->subject($subject);
                },
            );
            $this->info('Smoke email accepted by the mailer.');

            if ($this->option('templates')) {
                $this->sendPresetTemplates($email);
            }
        } catch (Throwable $e) {
            $this->error('Mail smoke failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Confirm inbox / spam for delivery.');

        if ($mailer === 'log') {
            $this->warn('MAIL_MAILER is currently "log". Messages are written to the log, not SMTP.');
        }

        return self::SUCCESS;
    }

    private function sendPresetTemplates(string $email): void
    {
        $user = new User([
            'name' => 'SMTP Smoke Tester',
            'email' => $email,
        ]);
        $user->public_id = '01SMOKETESTPUBLICID000000000';
        $user->email_verified_at = null;

        $this->line('Sending VerifyEmailNotification…');
        $user->notifyNow(new VerifyEmailNotification);
        sleep(2);

        $this->line('Sending WelcomeToSkuggleNotification…');
        $user->notifyNow(new WelcomeToSkuggleNotification);
        sleep(2);

        $this->line('Sending SubscriptionApprovedNotification…');
        $user->notifyNow(new SubscriptionApprovedNotification('Enterprise', now()->addMonth()->toFormattedDateString()));
        sleep(2);

        $this->line('Sending ContactInquiryNotification…');
        Notification::route('mail', $email)->notifyNow(new ContactInquiryNotification([
            'fullName' => 'SMTP Smoke Tester',
            'workEmail' => $email,
            'schoolName' => 'Royal Gateway Academy',
            'phone' => '+234 800 000 0000',
            'message' => 'This is a Hostinger SMTP smoke test for the public contact / demo form.',
        ]));

        $this->info('Preset templates accepted: verify, welcome, subscription, contact.');
    }
}
