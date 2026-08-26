<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function plans(): JsonResponse
    {
        $plans = Plan::query()->where('active', true)->orderBy('price_minor')->get()->map(fn (Plan $plan) => [
            'id' => $plan->public_id,
            'code' => $plan->code,
            'name' => $plan->name,
            'priceMinor' => (int) $plan->price_minor,
            'currency' => $plan->currency,
            'billingInterval' => $plan->billing_interval,
            'limits' => $plan->limits,
            'features' => $plan->features,
        ]);

        return ApiResponse::success($plans);
    }

    public function show(TenantContext $context): JsonResponse
    {
        $subscription = Subscription::query()
            ->with('plan')
            ->where('tenant_id', $context->tenantId())
            ->whereIn('status', ['active', 'trialing', 'past_due'])
            ->latest('starts_at')
            ->first();

        if (! $subscription) {
            return ApiResponse::success(null);
        }

        return ApiResponse::success([
            'id' => $subscription->public_id,
            'status' => $subscription->status,
            'startsAt' => $subscription->starts_at?->toIso8601String(),
            'trialEndsAt' => $subscription->trial_ends_at?->toIso8601String(),
            'currentPeriodEndsAt' => $subscription->current_period_ends_at?->toIso8601String(),
            'cancelledAt' => $subscription->cancelled_at?->toIso8601String(),
            'plan' => $subscription->plan ? [
                'id' => $subscription->plan->public_id,
                'code' => $subscription->plan->code,
                'name' => $subscription->plan->name,
                'limits' => $subscription->plan->limits,
                'features' => $subscription->plan->features,
            ] : null,
        ]);
    }
}
