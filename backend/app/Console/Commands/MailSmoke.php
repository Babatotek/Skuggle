<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class MailSmoke extends Command
{
    protected $signature = 'mail:smoke
        {email : Destination address for the smoke test}
        {--subject=Skuggle mail delivery smoke test : Email subject}';

    protected $description = 'Send a one-off smoke email to verify SMTP / mailer configuration';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $subject = (string) $this->option('subject');
        $mailer = (string) config('mail.default');

        $this->info("Mailer: {$mailer}");
        $this->info('From: '.config('mail.from.address'));
        $this->info("To: {$email}");

        try {
            Mail::raw(
                "Skuggle mail smoke test\n\nSent at ".now()->toIso8601String()."\nEnvironment: ".config('app.env')."\nMailer: {$mailer}\n",
                function ($message) use ($email, $subject): void {
                    $message->to($email)->subject($subject);
                },
            );
        } catch (Throwable $e) {
            $this->error('Mail smoke failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Smoke email accepted by the mailer. Confirm inbox / spam for delivery.');

        if ($mailer === 'log') {
            $this->warn('MAIL_MAILER is currently "log". Messages are written to the log, not SMTP.');
        }

        return self::SUCCESS;
    }
}
