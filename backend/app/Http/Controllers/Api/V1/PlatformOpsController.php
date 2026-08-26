<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\PlatformApiCredential;
use App\Models\PlatformBackupSnapshot;
use App\Models\PlatformBroadcast;
use App\Models\PlatformInvoice;
use App\Models\PlatformSupportMessage;
use App\Models\PlatformSupportTicket;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\AuditLogger;
use App\Services\DatabaseBackupService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlatformOpsController extends Controller
{
    public function tickets(Request $request): JsonResponse
    {
        $query = PlatformSupportTicket::query()->with(['tenant:id,public_id,name,code', 'messages'])->latest('updated_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('ticket_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('requester_email', 'like', "%{$search}%")
                    ->orWhere('requester_name', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate(min(max($request->integer('perPage', 30), 1), 100));

        return ApiResponse::success([
            'summary' => [
                'open' => PlatformSupportTicket::query()->whereIn('status', ['open', 'in_progress', 'waiting_on_school'])->count(),
                'urgent' => PlatformSupportTicket::query()->where('priority', 'urgent')->whereNotIn('status', ['resolved', 'closed'])->count(),
                'resolved' => PlatformSupportTicket::query()->where('status', 'resolved')->count(),
                'avgSlaMinutes' => (int) round((float) PlatformSupportTicket::query()->whereNotIn('status', ['resolved', 'closed'])->avg('sla_minutes_remaining')),
            ],
            'data' => collect($paginator->items())->map(fn (PlatformSupportTicket $ticket) => $this->presentTicket($ticket)),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    public function showTicket(PlatformSupportTicket $ticket): JsonResponse
    {
        $ticket->load(['tenant:id,public_id,name,code', 'messages']);

        return ApiResponse::success(['ticket' => $this->presentTicket($ticket, true)]);
    }

    public function storeTicket(Request $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'tenantId' => ['nullable', 'string'],
            'requesterName' => ['required', 'string', 'max:180'],
            'requesterEmail' => ['required', 'email:rfc', 'max:254'],
            'requesterRole' => ['nullable', 'string', 'max:80'],
            'subject' => ['required', 'string', 'max:220'],
            'category' => ['required', 'string', 'max:64'],
            'priority' => ['nullable', Rule::in(['urgent', 'high', 'medium', 'low'])],
            'body' => ['required', 'string', 'max:10000'],
        ]);

        $tenant = ! empty($data['tenantId'])
            ? Tenant::query()->where('public_id', $data['tenantId'])->first()
            : null;

        $ticket = DB::transaction(function () use ($data, $tenant, $request): PlatformSupportTicket {
            $ticket = PlatformSupportTicket::query()->create([
                'ticket_number' => 'SKG-'.now()->format('ymd').'-'.Str::upper(Str::random(5)),
                'tenant_id' => $tenant?->getKey(),
                'requester_user_id' => null,
                'requester_name' => $data['requesterName'],
                'requester_email' => mb_strtolower($data['requesterEmail']),
                'requester_role' => $data['requesterRole'] ?? 'school_admin',
                'subject' => $data['subject'],
                'category' => $data['category'],
                'priority' => $data['priority'] ?? 'medium',
                'status' => 'open',
                'assigned_agent' => $request->user()->name,
                'assigned_user_id' => $request->user()->getKey(),
                'sla_minutes_remaining' => ($data['priority'] ?? 'medium') === 'urgent' ? 60 : 240,
            ]);

            PlatformSupportMessage::query()->create([
                'ticket_id' => $ticket->getKey(),
                'author_user_id' => null,
                'sender_name' => $data['requesterName'],
                'sender_type' => 'school',
                'body' => $data['body'],
            ]);

            return $ticket->load(['tenant:id,public_id,name,code', 'messages']);
        });

        $audit->record('platform.ticket.created', $ticket);

        return ApiResponse::success(['ticket' => $this->presentTicket($ticket, true)], [], 201);
    }

    public function replyTicket(Request $request, PlatformSupportTicket $ticket, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
            'status' => ['nullable', Rule::in(['open', 'in_progress', 'waiting_on_school', 'resolved', 'closed'])],
        ]);

        $message = PlatformSupportMessage::query()->create([
            'ticket_id' => $ticket->getKey(),
            'author_user_id' => $request->user()->getKey(),
            'sender_name' => $request->user()->name,
            'sender_type' => 'support_agent',
            'body' => $data['body'],
        ]);

        $ticket->forceFill([
            'status' => $data['status'] ?? 'waiting_on_school',
            'assigned_agent' => $request->user()->name,
            'assigned_user_id' => $request->user()->getKey(),
            'first_response_at' => $ticket->first_response_at ?? now(),
            'resolved_at' => ($data['status'] ?? null) === 'resolved' ? now() : $ticket->resolved_at,
        ])->save();

        $audit->record('platform.ticket.replied', $ticket);
        $ticket->load(['tenant:id,public_id,name,code', 'messages']);

        return ApiResponse::success([
            'ticket' => $this->presentTicket($ticket, true),
            'message' => $this->presentMessage($message),
        ]);
    }

    public function resolveTicket(Request $request, PlatformSupportTicket $ticket, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'satisfactionRating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $ticket->forceFill([
            'status' => 'resolved',
            'resolved_at' => now(),
            'sla_minutes_remaining' => 0,
            'satisfaction_rating' => $data['satisfactionRating'] ?? 5,
        ])->save();

        PlatformSupportMessage::query()->create([
            'ticket_id' => $ticket->getKey(),
            'author_user_id' => $request->user()->getKey(),
            'sender_name' => 'System',
            'sender_type' => 'system',
            'body' => 'Ticket marked resolved by '.$request->user()->name.'.',
        ]);

        $audit->record('platform.ticket.resolved', $ticket);
        $ticket->load(['tenant:id,public_id,name,code', 'messages']);

        return ApiResponse::success(['ticket' => $this->presentTicket($ticket, true)]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $query = PlatformInvoice::query()->with(['tenant:id,public_id,name,code', 'plan:id,public_id,code,name'])->latest('issued_on');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('provider_reference', 'like', "%{$search}%")
                    ->orWhereHas('tenant', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->paginate(min(max($request->integer('perPage', 30), 1), 100));
        $paid = PlatformInvoice::query()->where('status', 'paid')->sum('amount_minor');
        $pending = PlatformInvoice::query()->whereIn('status', ['pending', 'overdue'])->sum('amount_minor');

        return ApiResponse::success([
            'summary' => [
                'collectedMinor' => (int) $paid,
                'outstandingMinor' => (int) $pending,
                'invoiceCount' => PlatformInvoice::query()->count(),
                'currency' => 'NGN',
            ],
            'data' => collect($paginator->items())->map(fn (PlatformInvoice $invoice) => $this->presentInvoice($invoice)),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ]);
    }

    public function markInvoicePaid(Request $request, PlatformInvoice $invoice, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'providerReference' => ['nullable', 'string', 'max:180'],
            'gateway' => ['nullable', 'string', 'max:40'],
        ]);

        $invoice->forceFill([
            'status' => 'paid',
            'paid_at' => now(),
            'provider_reference' => $data['providerReference'] ?? ($invoice->provider_reference ?: 'MANUAL-'.Str::upper(Str::random(10))),
            'gateway' => $data['gateway'] ?? $invoice->gateway,
            'receipt_url' => $invoice->receipt_url ?: '/platform/invoices/'.$invoice->public_id.'/receipt',
        ])->save();

        $audit->record('platform.invoice.paid', $invoice);
        $invoice->load(['tenant:id,public_id,name,code', 'plan:id,public_id,code,name']);

        return ApiResponse::success(['invoice' => $this->presentInvoice($invoice)]);
    }

    public function remindInvoice(PlatformInvoice $invoice, AuditLogger $audit): JsonResponse
    {
        if (in_array($invoice->status, ['paid', 'canceled'], true)) {
            return ApiResponse::error('INVOICE_NOT_REMINDABLE', 'Only pending or overdue invoices can be reminded.', 422);
        }

        $invoice->forceFill([
            'metadata' => array_merge($invoice->metadata ?? [], [
                'last_reminded_at' => now()->toIso8601String(),
                'reminder_count' => (int) data_get($invoice->metadata, 'reminder_count', 0) + 1,
            ]),
        ])->save();

        $audit->record('platform.invoice.reminded', $invoice);

        return ApiResponse::success([
            'invoice' => $this->presentInvoice($invoice->load(['tenant:id,public_id,name,code', 'plan:id,public_id,code,name'])),
            'message' => 'Payment reminder queued for school administrators.',
        ]);
    }

    public function generateInvoices(Request $request, AuditLogger $audit): JsonResponse
    {
        $created = 0;
        $subscriptions = Subscription::query()
            ->withoutGlobalScopes()
            ->with(['plan', 'tenant'])
            ->whereIn('status', ['active', 'trialing'])
            ->get();

        foreach ($subscriptions as $subscription) {
            if (! $subscription->tenant || ! $subscription->plan) {
                continue;
            }

            $periodKey = now()->format('Y-m');
            $exists = PlatformInvoice::query()
                ->where('tenant_id', $subscription->tenant_id)
                ->where('subscription_id', $subscription->getKey())
                ->where('metadata->period_key', $periodKey)
                ->exists();

            if ($exists) {
                continue;
            }

            PlatformInvoice::query()->create([
                'invoice_number' => 'INV-'.now()->format('Ym').'-'.Str::upper(Str::random(6)),
                'tenant_id' => $subscription->tenant_id,
                'subscription_id' => $subscription->getKey(),
                'plan_id' => $subscription->plan_id,
                'cycle' => $subscription->plan->billing_interval ?? 'monthly',
                'amount_minor' => (int) $subscription->plan->price_minor,
                'discount_minor' => 0,
                'currency' => $subscription->plan->currency ?: 'NGN',
                'status' => ((int) $subscription->plan->price_minor) === 0 ? 'paid' : 'pending',
                'gateway' => 'paystack',
                'issued_on' => now()->toDateString(),
                'due_on' => now()->addDays(14)->toDateString(),
                'paid_at' => ((int) $subscription->plan->price_minor) === 0 ? now() : null,
                'line_items' => [[
                    'description' => $subscription->plan->name.' subscription',
                    'amountMinor' => (int) $subscription->plan->price_minor,
                ]],
                'metadata' => ['period_key' => $periodKey],
            ]);
            $created++;
        }

        $audit->record('platform.invoices.generated', null, [], ['created' => $created]);

        return ApiResponse::success(['created' => $created]);
    }

    public function broadcasts(): JsonResponse
    {
        $items = PlatformBroadcast::query()->latest('created_at')->limit(50)->get()
            ->map(fn (PlatformBroadcast $broadcast) => $this->presentBroadcast($broadcast));

        return ApiResponse::success(['data' => $items]);
    }

    public function storeBroadcast(Request $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:220'],
            'body' => ['required', 'string', 'max:20000'],
            'channel' => ['nullable', Rule::in(['in_app', 'email', 'sms', 'all'])],
            'audience' => ['nullable', Rule::in(['all_schools', 'school_admins', 'teachers', 'trial_accounts'])],
            'publish' => ['nullable', 'boolean'],
        ]);

        $publish = (bool) ($data['publish'] ?? true);
        $audience = $data['audience'] ?? 'all_schools';

        $tenants = Tenant::query()
            ->where('type', 'school')
            ->when($audience === 'trial_accounts', fn ($q) => $q->where('status', 'trial'))
            ->when($audience !== 'trial_accounts', fn ($q) => $q->whereIn('status', ['active', 'trial']))
            ->get(['id', 'public_id', 'name']);

        $broadcast = DB::transaction(function () use ($data, $publish, $audience, $tenants, $request): PlatformBroadcast {
            $broadcast = PlatformBroadcast::query()->create([
                'title' => $data['title'],
                'summary' => Str::limit(strip_tags($data['body']), 160),
                'body' => $data['body'],
                'channel' => $data['channel'] ?? 'all',
                'audience' => $audience,
                'status' => $publish ? 'sent' : 'draft',
                'recipient_count' => $publish ? $tenants->count() : 0,
                'open_rate_percent' => 0,
                'published_at' => $publish ? now() : null,
                'created_by' => $request->user()->getKey(),
            ]);

            if ($publish) {
                $audienceRoles = match ($audience) {
                    'school_admins' => ['school_admin', 'admin'],
                    'teachers' => ['teacher'],
                    default => ['all'],
                };

                /** @var TenantContext $tenantContext */
                $tenantContext = app(TenantContext::class);
                $previous = $tenantContext->hasTenant() ? $tenantContext->tenant() : null;

                foreach ($tenants as $tenant) {
                    $tenantContext->setPublicTenant($tenant);
                    Announcement::query()->create([
                        'title' => $data['title'],
                        'body' => $data['body'],
                        'audience' => $audienceRoles,
                        'status' => 'published',
                        'created_by' => $request->user()->getKey(),
                        'published_at' => now(),
                    ]);
                }

                if ($previous) {
                    $tenantContext->setPublicTenant($previous);
                } else {
                    $tenantContext->clear();
                }
            }

            return $broadcast;
        });

        $audit->record('platform.broadcast.created', $broadcast);

        return ApiResponse::success(['broadcast' => $this->presentBroadcast($broadcast)], [], 201);
    }

    public function backups(): JsonResponse
    {
        $items = PlatformBackupSnapshot::query()->latest('created_at')->limit(30)->get()
            ->map(fn (PlatformBackupSnapshot $snapshot) => $this->presentBackup($snapshot));

        return ApiResponse::success(['data' => $items]);
    }

    public function createBackup(Request $request, AuditLogger $audit, DatabaseBackupService $backups): JsonResponse
    {
        try {
            $result = $backups->create($request->user(), 'manual');
        } catch (\Throwable $e) {
            return ApiResponse::error('BACKUP_FAILED', $e->getMessage(), 500);
        }

        $audit->record('platform.backup.created', $result['snapshot']);

        return ApiResponse::success(['backup' => $this->presentBackup($result['snapshot'])], [], 201);
    }

    public function apiCredentials(): JsonResponse
    {
        $items = PlatformApiCredential::query()->latest('updated_at')->get()
            ->map(fn (PlatformApiCredential $credential) => $this->presentCredential($credential));

        return ApiResponse::success(['data' => $items]);
    }

    public function rotateApiCredential(Request $request, PlatformApiCredential $credential, AuditLogger $audit): JsonResponse
    {
        $hint = '••••'.Str::upper(Str::random(4));
        $credential->forceFill([
            'key_hint' => $hint,
            'fingerprint' => hash('sha256', Str::random(40).microtime(true)),
            'last_rotated_at' => now(),
            'rotated_by' => $request->user()->getKey(),
            'status' => 'active',
        ])->save();

        $audit->record('platform.credential.rotated', $credential);

        return ApiResponse::success([
            'credential' => $this->presentCredential($credential),
            'message' => 'Credential metadata rotated. Update the real secret in server environment configuration.',
        ]);
    }

    private function presentTicket(PlatformSupportTicket $ticket, bool $withMessages = false): array
    {
        $payload = [
            'id' => $ticket->public_id,
            'ticketNumber' => $ticket->ticket_number,
            'schoolId' => $ticket->tenant?->public_id,
            'schoolName' => $ticket->tenant?->name ?? 'Unassigned',
            'schoolCode' => $ticket->tenant?->code,
            'requesterName' => $ticket->requester_name,
            'requesterRole' => $ticket->requester_role,
            'requesterEmail' => $ticket->requester_email,
            'subject' => $ticket->subject,
            'category' => $ticket->category,
            'priority' => $ticket->priority,
            'status' => $ticket->status,
            'assignedAgent' => $ticket->assigned_agent,
            'slaMinutesRemaining' => (int) $ticket->sla_minutes_remaining,
            'satisfactionRating' => $ticket->satisfaction_rating,
            'createdAt' => $ticket->created_at?->toIso8601String(),
            'updatedAt' => $ticket->updated_at?->toIso8601String(),
            'messageCount' => $ticket->relationLoaded('messages') ? $ticket->messages->count() : $ticket->messages()->count(),
        ];

        if ($withMessages) {
            $payload['messages'] = $ticket->messages->map(fn (PlatformSupportMessage $message) => $this->presentMessage($message))->values();
        }

        return $payload;
    }

    private function presentMessage(PlatformSupportMessage $message): array
    {
        return [
            'id' => $message->public_id,
            'sender' => $message->sender_name,
            'senderType' => $message->sender_type,
            'content' => $message->body,
            'timestamp' => $message->created_at?->toIso8601String(),
            'attachments' => $message->attachments ?? [],
        ];
    }

    private function presentInvoice(PlatformInvoice $invoice): array
    {
        return [
            'id' => $invoice->public_id,
            'invoiceNumber' => $invoice->invoice_number,
            'schoolId' => $invoice->tenant?->public_id,
            'schoolName' => $invoice->tenant?->name,
            'schoolCode' => $invoice->tenant?->code,
            'plan' => $invoice->plan?->name,
            'planCode' => $invoice->plan?->code,
            'cycle' => $invoice->cycle,
            'amountMinor' => (int) $invoice->amount_minor,
            'discountMinor' => (int) $invoice->discount_minor,
            'currency' => $invoice->currency,
            'status' => $invoice->status,
            'issueDate' => $invoice->issued_on?->toDateString(),
            'dueDate' => $invoice->due_on?->toDateString(),
            'paidDate' => $invoice->paid_at?->toDateString(),
            'gateway' => $invoice->gateway,
            'reference' => $invoice->provider_reference,
            'receiptUrl' => $invoice->receipt_url,
            'lineItems' => $invoice->line_items ?? [],
        ];
    }

    private function presentBroadcast(PlatformBroadcast $broadcast): array
    {
        return [
            'id' => $broadcast->public_id,
            'title' => $broadcast->title,
            'summary' => $broadcast->summary,
            'body' => $broadcast->body,
            'channel' => $broadcast->channel,
            'audience' => $broadcast->audience,
            'status' => $broadcast->status,
            'recipientCount' => (int) $broadcast->recipient_count,
            'openRatePercent' => (int) $broadcast->open_rate_percent,
            'publishedAt' => $broadcast->published_at?->toIso8601String(),
            'createdAt' => $broadcast->created_at?->toIso8601String(),
        ];
    }

    private function presentBackup(PlatformBackupSnapshot $snapshot): array
    {
        return [
            'id' => $snapshot->public_id,
            'label' => $snapshot->label,
            'status' => $snapshot->status,
            'trigger' => $snapshot->trigger,
            'sizeBytes' => $snapshot->size_bytes,
            'startedAt' => $snapshot->started_at?->toIso8601String(),
            'completedAt' => $snapshot->completed_at?->toIso8601String(),
            'message' => $snapshot->message,
        ];
    }

    private function presentCredential(PlatformApiCredential $credential): array
    {
        return [
            'id' => $credential->public_id,
            'name' => $credential->name,
            'provider' => $credential->provider,
            'environment' => $credential->environment,
            'keyHint' => $credential->key_hint,
            'status' => $credential->status,
            'lastRotatedAt' => $credential->last_rotated_at?->toIso8601String(),
        ];
    }
}
