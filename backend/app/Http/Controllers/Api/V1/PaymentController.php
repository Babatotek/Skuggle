<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('perPage', 20), 1), 100);
        $paginator = PaymentTransaction::query()->latest()->paginate($perPage);

        return ApiResponse::success([
            'data' => collect($paginator->items())->map(fn (PaymentTransaction $item) => $this->present($item)),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => ['required', 'string', 'max:40'],
            'amount_minor' => ['required', 'integer', 'min:1'],
            'currency' => ['required', 'string', 'size:3'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
            'metadata' => ['nullable', 'array'],
        ]);

        $idempotencyKey = trim((string) ($request->header('Idempotency-Key') ?: ($data['idempotency_key'] ?? '')));
        if ($idempotencyKey === '') {
            return ApiResponse::error('IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key is required.', 422);
        }

        $existing = PaymentTransaction::query()->where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return ApiResponse::success($this->present($existing));
        }

        $payment = PaymentTransaction::query()->create([
            'provider' => $data['provider'],
            'provider_reference' => strtoupper($data['provider']).'-'.Str::ulid(),
            'idempotency_key' => $idempotencyKey,
            'amount_minor' => $data['amount_minor'],
            'currency' => strtoupper($data['currency']),
            'status' => 'pending',
            'metadata' => $data['metadata'] ?? null,
        ]);

        return ApiResponse::success($this->present($payment), [], 201);
    }

    public function webhook(string $provider, Request $request): JsonResponse
    {
        $secret = (string) env('PAYMENT_WEBHOOK_SECRET', '');
        $signature = (string) $request->header('X-Webhook-Secret', '');
        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        if ($secret === '' || $signature === '' || ! hash_equals($expected, $signature)) {
            return ApiResponse::error('WEBHOOK_UNAUTHORIZED', 'Invalid webhook signature.', 401);
        }

        $data = $request->validate([
            'provider_reference' => ['required', 'string', 'max:180'],
            'status' => ['nullable', 'string', 'max:32'],
        ]);

        $payment = DB::transaction(function () use ($provider, $data): ?PaymentTransaction {
            $payment = PaymentTransaction::query()
                ->withoutGlobalScopes()
                ->where('provider', $provider)
                ->where('provider_reference', $data['provider_reference'])
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                return null;
            }

            if ($payment->status !== 'succeeded') {
                $payment->update([
                    'status' => 'succeeded',
                    'paid_at' => now(),
                ]);
            }

            return $payment->fresh();
        });

        if (! $payment) {
            return ApiResponse::error('PAYMENT_NOT_FOUND', 'Payment reference was not found.', 404);
        }

        return ApiResponse::success($this->present($payment));
    }

    private function present(PaymentTransaction $payment): array
    {
        return [
            'id' => $payment->public_id,
            'provider' => $payment->provider,
            'providerReference' => $payment->provider_reference,
            'amountMinor' => (int) $payment->amount_minor,
            'currency' => $payment->currency,
            'status' => $payment->status,
            'paidAt' => $payment->paid_at?->toIso8601String(),
            'createdAt' => $payment->created_at?->toIso8601String(),
        ];
    }
}
