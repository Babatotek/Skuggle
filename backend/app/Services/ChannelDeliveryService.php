<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;

final class ChannelDeliveryService
{
    public function send(string $channel, string $to, string $body): array
    {
        return match ($channel) {
            'sms' => $this->sms($to, $body),
            'whatsapp' => $this->whatsapp($to, $body),
            default => throw new ApiException('CHANNEL_UNSUPPORTED', 'Unsupported delivery channel.', 422),
        };
    }

    private function sms(string $to, string $body): array
    {
        $provider = (string) config('skuggle.messaging.sms.provider');
        if ($provider !== 'termii') {
            throw new ApiException('SMS_NOT_CONFIGURED', 'Configure the SMS provider before sending.', 503);
        }
        $key = (string) config('skuggle.messaging.sms.termii.api_key');
        if ($key === '') {
            throw new ApiException('SMS_NOT_CONFIGURED', 'Termii credentials are missing.', 503);
        }
        $r = Http::timeout(30)->retry(2, 500)->post(rtrim((string) config('skuggle.messaging.sms.termii.base_url'), '/').'/api/sms/send', ['api_key' => $key, 'to' => $to, 'from' => config('skuggle.messaging.sms.sender'), 'sms' => $body, 'type' => 'plain', 'channel' => 'generic']);
        if (! $r->successful()) {
            throw new ApiException('SMS_PROVIDER_FAILED', 'The SMS provider rejected the message.', 502);
        }

        return ['provider' => 'termii', 'reference' => (string) ($r->json('message_id') ?? $r->json('request_id') ?? '')];
    }

    private function whatsapp(string $to, string $body): array
    {
        $token = (string) config('skuggle.messaging.whatsapp.token');
        $phoneId = (string) config('skuggle.messaging.whatsapp.phone_number_id');
        if ($token === '' || $phoneId === '') {
            throw new ApiException('WHATSAPP_NOT_CONFIGURED', 'WhatsApp Cloud API credentials are missing.', 503);
        }
        $r = Http::timeout(30)->retry(2, 500)->withToken($token)->post('https://graph.facebook.com/'.config('skuggle.messaging.whatsapp.graph_version').'/'.$phoneId.'/messages', ['messaging_product' => 'whatsapp', 'recipient_type' => 'individual', 'to' => $to, 'type' => 'text', 'text' => ['preview_url' => false, 'body' => $body]]);
        if (! $r->successful()) {
            throw new ApiException('WHATSAPP_PROVIDER_FAILED', 'WhatsApp rejected the message.', 502);
        }

        return ['provider' => 'meta', 'reference' => (string) $r->json('messages.0.id')];
    }
}
