<?php

namespace App\Console\Commands;

use App\Models\PlatformBackupSnapshot;
use App\Models\Role;
use App\Models\TenantMembership;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class OpsGoLiveCheck extends Command
{
    protected $signature = 'ops:go-live-check
        {--strict : Fail if any blocking gate is incomplete}';

    protected $description = 'Evaluate MFA, mailer, backup, and security sign-off go-live gates';

    public function handle(): int
    {
        $gates = [];

        $privilegedRoleIds = Role::query()->where('privileged', true)->pluck('id');
        $missingMfa = TenantMembership::query()
            ->whereIn('role_id', $privilegedRoleIds)
            ->where('status', 'active')
            ->whereHas('user', fn ($q) => $q->whereNull('two_factor_confirmed_at'))
            ->count();

        $gates[] = [
            'gate' => 'mfa_enrollment',
            'status' => $missingMfa === 0 ? 'pass' : 'fail',
            'detail' => $missingMfa === 0
                ? 'All active privileged memberships have confirmed MFA'
                : "{$missingMfa} privileged membership(s) still missing MFA",
            'blocking' => true,
        ];

        $mailer = (string) config('mail.default');
        $from = (string) config('mail.from.address');
        $mailOk = $mailer !== 'log' && $mailer !== 'array' && filled($from) && ! str_contains($from, 'example.com');
        $gates[] = [
            'gate' => 'mail_delivery',
            'status' => $mailOk ? 'pass' : 'warn',
            'detail' => $mailOk
                ? "Mailer [{$mailer}] configured from {$from}"
                : "Mailer is [{$mailer}] / from [{$from}] — run `php artisan mail:smoke you@example.com` after SMTP is set",
            'blocking' => app()->environment('production'),
        ];

        $latestBackup = Schema::hasTable('platform_backup_snapshots')
            ? PlatformBackupSnapshot::query()->where('status', 'completed')->latest('completed_at')->first()
            : null;
        $backupFresh = $latestBackup && $latestBackup->completed_at && $latestBackup->completed_at->greaterThan(now()->subDays(2));
        $gates[] = [
            'gate' => 'backup_restore',
            'status' => $backupFresh ? 'pass' : 'fail',
            'detail' => $latestBackup
                ? 'Latest completed snapshot: '.$latestBackup->completed_at?->toIso8601String().' ('.$latestBackup->storage_path.')'
                : 'No completed backup snapshot found — run `php artisan backup:database`',
            'blocking' => true,
        ];

        $signOff = base_path('../docs/SECURITY_SIGN_OFF.md');
        if (! File::exists($signOff)) {
            $signOff = base_path('docs/SECURITY_SIGN_OFF.md');
        }
        if (! File::exists($signOff)) {
            $signOff = dirname(base_path()).'/docs/SECURITY_SIGN_OFF.md';
        }

        $signOffContent = File::exists($signOff) ? File::get($signOff) : '';
        $signed = (bool) preg_match('/^Decision:\s*\**Approved(?:-with-residual-risk)?\**/mi', $signOffContent);
        $gates[] = [
            'gate' => 'security_sign_off',
            'status' => $signed ? 'pass' : 'warn',
            'detail' => $signed
                ? 'SECURITY_SIGN_OFF.md marked Approved'
                : 'Complete docs/SECURITY_SIGN_OFF.md after pen-test / review',
            'blocking' => false,
        ];

        $this->table(['Gate', 'Status', 'Detail'], collect($gates)->map(fn (array $g) => [
            $g['gate'],
            strtoupper($g['status']),
            $g['detail'],
        ])->all());

        $blockingFails = collect($gates)->filter(fn (array $g) => $g['blocking'] && $g['status'] === 'fail');
        $blockingWarns = collect($gates)->filter(fn (array $g) => $g['blocking'] && $g['status'] === 'warn');

        if ($this->option('strict') && ($blockingFails->isNotEmpty() || $blockingWarns->isNotEmpty())) {
            $this->error('Go-live gates incomplete (strict mode).');

            return self::FAILURE;
        }

        if ($blockingFails->isNotEmpty()) {
            $this->warn('Blocking gates still open. See docs/GO_LIVE_OPS_RUNBOOK.md');
        } else {
            $this->info('No blocking failures detected for current environment.');
        }

        return self::SUCCESS;
    }
}
