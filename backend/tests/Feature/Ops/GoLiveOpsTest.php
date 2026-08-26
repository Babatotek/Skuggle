<?php

namespace Tests\Feature\Ops;

use App\Models\PlatformBackupSnapshot;
use App\Models\User;
use App\Notifications\TenantInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class GoLiveOpsTest extends TestCase
{
    use RefreshDatabase;

    public function test_mail_smoke_accepts_log_mailer(): void
    {
        $exit = Artisan::call('mail:smoke', ['email' => 'ops@example.com']);

        $this->assertSame(0, $exit);
        $this->assertStringContainsString('Smoke email accepted', Artisan::output());
    }

    public function test_ops_go_live_check_runs(): void
    {
        $exit = Artisan::call('ops:go-live-check');

        $this->assertSame(0, $exit);
        $this->assertStringContainsString('mfa_enrollment', Artisan::output());
    }

    public function test_backup_database_registers_snapshot_on_sqlite(): void
    {
        config(['database.default' => 'sqlite']);

        $exit = Artisan::call('backup:database', ['--trigger' => 'manual']);

        $this->assertSame(0, $exit);
        $this->assertDatabaseCount('platform_backup_snapshots', 1);
        $this->assertNotNull(PlatformBackupSnapshot::query()->where('status', 'completed')->first());
    }

    public function test_invitation_notification_can_be_sent(): void
    {
        Notification::fake();

        Notification::route('mail', 'teacher@example.com')->notify(new TenantInvitationNotification(
            schoolName: 'Royal Gateway Academy',
            roleLabel: 'Teacher',
            registrationLink: 'https://app.example/join?invite=abc',
            expiresAt: now()->addDays(7)->toDayDateTimeString(),
        ));

        Notification::assertSentOnDemand(TenantInvitationNotification::class);
    }

    public function test_mfa_privileged_status_command_runs(): void
    {
        User::factory()->create(['email' => 'owner@example.com']);

        $exit = Artisan::call('mfa:privileged-status');

        $this->assertSame(0, $exit);
    }
}
