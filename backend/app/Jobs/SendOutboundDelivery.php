<?php

namespace App\Jobs;

use App\Domain\Tenancy\TenantContext;
use App\Domain\Tenancy\TenantJobEnvelope;
use App\Models\OutboundDelivery;
use App\Services\ChannelDeliveryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SendOutboundDelivery implements ShouldQueue
{
    use Dispatchable,InteractsWithQueue,Queueable,SerializesModels;

    public int $tries = 4;

    public array $backoff = [30, 120, 600];

    /** @param array<string, int|string|null> $tenantEnvelope */
    public function __construct(public int $deliveryId, public array $tenantEnvelope, public string $body)
    {
        $this->onQueue('communications');
    }

    public function handle(ChannelDeliveryService $service, TenantContext $context): void
    {
        try {
            TenantJobEnvelope::fromArray($this->tenantEnvelope)->activate($context);
            $delivery = OutboundDelivery::query()->findOrFail($this->deliveryId);
            if (in_array($delivery->status, ['sent', 'delivered'], true)) {
                return;
            }$delivery->increment('attempts');
            $result = $service->send($delivery->channel, $delivery->destination, $this->body);
            $delivery->update(['status' => 'sent', 'provider' => $result['provider'], 'provider_reference' => $result['reference'], 'sent_at' => now(), 'error_message' => null]);
        } catch (\Throwable $e) {
            OutboundDelivery::query()->whereKey($this->deliveryId)->update(['status' => $this->attempts() >= $this->tries ? 'failed' : 'retrying', 'error_message' => mb_substr($e->getMessage(), 0, 1000)]);
            throw $e;
        } finally {
            $context->clear();
        }
    }
}
