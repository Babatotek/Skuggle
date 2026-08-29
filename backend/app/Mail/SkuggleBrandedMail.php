<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class SkuggleBrandedMail extends Mailable
{
    use SerializesModels;

    /**
     * @param  list<string>  $details
     */
    public function __construct(
        public readonly string $mailSubject,
        public readonly string $preheader,
        public readonly string $eyebrow,
        public readonly string $title,
        public readonly string $intro,
        public readonly string $buttonLabel,
        public readonly string $buttonUrl,
        public readonly array $details,
        public readonly string $closing,
        public readonly ?string $replyToAddress = null,
        public readonly ?string $replyToName = null,
    ) {}

    public function envelope(): Envelope
    {
        $replyTo = [];
        if ($this->replyToAddress) {
            $replyTo[] = new Address($this->replyToAddress, $this->replyToName ?: '');
        }

        return new Envelope(
            subject: $this->mailSubject,
            replyTo: $replyTo,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.skuggle',
            with: [
                'preheader' => $this->preheader,
                'eyebrow' => $this->eyebrow,
                'title' => $this->title,
                'intro' => $this->intro,
                'buttonLabel' => $this->buttonLabel,
                'buttonUrl' => $this->buttonUrl,
                'details' => $this->details,
                'closing' => $this->closing,
                'logoPath' => self::logoPath(),
            ],
        );
    }

    public static function logoPath(): string
    {
        $white = resource_path('images/email/skuggle-logo-white.png');
        if (is_file($white)) {
            return $white;
        }

        return resource_path('images/email/skuggle-logo.png');
    }
}
