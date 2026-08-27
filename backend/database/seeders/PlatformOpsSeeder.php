<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\PlatformApiCredential;
use App\Models\PlatformBackupSnapshot;
use App\Models\PlatformBroadcast;
use App\Models\PlatformInvoice;
use App\Models\PlatformSupportMessage;
use App\Models\PlatformSupportTicket;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds enterprise platform-ops demo data for HQ walkthroughs (local only).
 */
class PlatformOpsSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $school = Tenant::query()->where('slug', DemoUsersSeeder::DEMO_SCHOOL_SLUG)->first();
        $owner = User::query()->where('email', 'owner@skuggle.com')->first()
            ?? User::query()->where('email', DemoUsersSeeder::OWNER_EMAIL)->first();
        $admin = User::query()->where('email', 'admin@royalgateway.edu.ng')->first();

        if (! $school || ! $owner) {
            return;
        }

        $ticket = PlatformSupportTicket::query()->updateOrCreate(
            ['ticket_number' => 'SKG-DEMO-0001'],
            [
                'tenant_id' => $school->getKey(),
                'requester_user_id' => $admin?->getKey(),
                'requester_name' => 'Demo School Admin',
                'requester_email' => 'admin@royalgateway.edu.ng',
                'requester_role' => 'school_admin',
                'subject' => 'Result publish delay after bulk import',
                'category' => 'Gradebook & Results',
                'priority' => 'high',
                'status' => 'in_progress',
                'assigned_agent' => $owner->name,
                'assigned_user_id' => $owner->getKey(),
                'sla_minutes_remaining' => 95,
            ],
        );

        if ($ticket->messages()->count() === 0) {
            PlatformSupportMessage::query()->create([
                'ticket_id' => $ticket->getKey(),
                'author_user_id' => $admin?->getKey(),
                'sender_name' => 'Demo School Admin',
                'sender_type' => 'school',
                'body' => 'After importing 120 students, First Term bulk publish remains queued for more than 20 minutes.',
            ]);
            PlatformSupportMessage::query()->create([
                'ticket_id' => $ticket->getKey(),
                'author_user_id' => $owner->getKey(),
                'sender_name' => $owner->name,
                'sender_type' => 'support_agent',
                'body' => 'We are inspecting the report queue workers. Please confirm Horizon/queue workers are running on your demo host.',
            ]);
        }

        PlatformSupportTicket::query()->updateOrCreate(
            ['ticket_number' => 'SKG-DEMO-0002'],
            [
                'tenant_id' => $school->getKey(),
                'requester_name' => 'Mrs. Okonkwo',
                'requester_email' => 'bursar@royalgateway.edu.ng',
                'requester_role' => 'bursar',
                'subject' => 'Paystack webhook not marking fee as settled',
                'category' => 'Billing & Subscription',
                'priority' => 'urgent',
                'status' => 'open',
                'assigned_agent' => $owner->name,
                'assigned_user_id' => $owner->getKey(),
                'sla_minutes_remaining' => 42,
            ],
        );

        $subscription = Subscription::query()->withoutGlobalScopes()
            ->where('tenant_id', $school->getKey())
            ->with('plan')
            ->first();
        $plan = $subscription?->plan ?? Plan::query()->where('code', 'pilot')->first();

        if ($plan) {
            PlatformInvoice::query()->updateOrCreate(
                ['invoice_number' => 'INV-DEMO-202608-001'],
                [
                    'tenant_id' => $school->getKey(),
                    'subscription_id' => $subscription?->getKey(),
                    'plan_id' => $plan->getKey(),
                    'cycle' => 'monthly',
                    'amount_minor' => (int) $plan->price_minor,
                    'discount_minor' => 0,
                    'currency' => 'NGN',
                    'status' => ((int) $plan->price_minor) === 0 ? 'paid' : 'pending',
                    'gateway' => 'paystack',
                    'provider_reference' => ((int) $plan->price_minor) === 0 ? 'FREE-PILOT' : null,
                    'issued_on' => now()->subDays(3)->toDateString(),
                    'due_on' => now()->addDays(11)->toDateString(),
                    'paid_at' => ((int) $plan->price_minor) === 0 ? now()->subDays(3) : null,
                    'line_items' => [[
                        'description' => $plan->name.' subscription',
                        'amountMinor' => (int) $plan->price_minor,
                    ]],
                    'metadata' => ['period_key' => now()->format('Y-m'), 'demo' => true],
                ],
            );

            $growth = Plan::query()->where('code', 'growth')->first();
            if ($growth) {
                PlatformInvoice::query()->updateOrCreate(
                    ['invoice_number' => 'INV-DEMO-202607-014'],
                    [
                        'tenant_id' => $school->getKey(),
                        'subscription_id' => $subscription?->getKey(),
                        'plan_id' => $growth->getKey(),
                        'cycle' => 'monthly',
                        'amount_minor' => (int) $growth->price_minor,
                        'discount_minor' => 500000,
                        'currency' => 'NGN',
                        'status' => 'paid',
                        'gateway' => 'paystack',
                        'provider_reference' => 'PSK_DEMO_'.Str::upper(Str::random(8)),
                        'issued_on' => now()->subDays(35)->toDateString(),
                        'due_on' => now()->subDays(21)->toDateString(),
                        'paid_at' => now()->subDays(20),
                        'receipt_url' => '/platform/invoices/demo-receipt',
                        'line_items' => [[
                            'description' => 'Growth plan upgrade',
                            'amountMinor' => (int) $growth->price_minor,
                        ]],
                        'metadata' => ['period_key' => now()->subMonth()->format('Y-m'), 'demo' => true],
                    ],
                );
            }
        }

        PlatformBroadcast::query()->updateOrCreate(
            ['title' => 'Scheduled maintenance window — Sunday 02:00 WAT'],
            [
                'summary' => 'Brief platform maintenance for queue and storage upgrades.',
                'body' => "School admins,\n\nSkuggle will perform a short maintenance window on Sunday at 02:00 WAT. Attendance capture and result publish may pause for up to 20 minutes.\n\nNo action is required from your team.",
                'channel' => 'all',
                'audience' => 'school_admins',
                'status' => 'sent',
                'recipient_count' => Tenant::query()->where('type', 'school')->count(),
                'open_rate_percent' => 0,
                'published_at' => now()->subDays(2),
                'created_by' => $owner->getKey(),
            ],
        );

        PlatformBackupSnapshot::query()->updateOrCreate(
            ['label' => 'Nightly snapshot '.now()->subDay()->format('Y-m-d')],
            [
                'status' => 'completed',
                'trigger' => 'scheduled',
                'size_bytes' => 186_453_120,
                'storage_path' => 'backups/demo/nightly.sql.gz',
                'checksum' => hash('sha256', 'demo-backup-'.now()->format('Ymd')),
                'requested_by' => $owner->getKey(),
                'started_at' => now()->subDay()->setTime(2, 0),
                'completed_at' => now()->subDay()->setTime(2, 8),
                'message' => 'Scheduled logical dump completed.',
            ],
        );

        foreach ([
            ['Paystack Live Secret', 'paystack', 'live', 'sk_l••••9F2A'],
            ['Flutterwave Live Secret', 'flutterwave', 'live', 'FLW••••K1P'],
            ['Gemini Production Key', 'gemini', 'live', 'AIza••••7Qx'],
        ] as [$name, $provider, $env, $hint]) {
            PlatformApiCredential::query()->updateOrCreate(
                ['provider' => $provider, 'environment' => $env],
                [
                    'name' => $name,
                    'key_hint' => $hint,
                    'fingerprint' => hash('sha256', $provider.'-'.$env.'-demo'),
                    'status' => 'active',
                    'last_rotated_at' => now()->subDays(18),
                    'rotated_by' => $owner->getKey(),
                ],
            );
        }

        $this->command?->info('Platform operations demo data ready (tickets, invoices, broadcasts, backups, credential metadata).');
    }
}
