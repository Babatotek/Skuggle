<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Console\Command;

class MfaPrivilegedStatus extends Command
{
    protected $signature = 'mfa:privileged-status
        {--strict : Exit with failure if any privileged membership lacks confirmed MFA}';

    protected $description = 'Report privileged users who still need MFA enrollment';

    public function handle(): int
    {
        $privilegedRoleIds = Role::query()->where('privileged', true)->pluck('id');

        $rows = TenantMembership::query()
            ->with(['user:id,public_id,name,email,two_factor_confirmed_at', 'tenant:id,name,code', 'role:id,name,label'])
            ->whereIn('role_id', $privilegedRoleIds)
            ->where('status', 'active')
            ->get()
            ->map(function (TenantMembership $membership): array {
                /** @var User|null $user */
                $user = $membership->user;

                return [
                    'email' => $user?->email,
                    'name' => $user?->name,
                    'role' => $membership->role?->name,
                    'tenant' => $membership->tenant?->code,
                    'mfa' => $user?->two_factor_confirmed_at ? 'confirmed' : 'missing',
                ];
            })
            ->sortBy(['mfa', 'email'])
            ->values();

        $missing = $rows->where('mfa', 'missing')->values();

        $this->table(['Email', 'Name', 'Role', 'Tenant', 'MFA'], $rows->map(fn (array $row) => [
            $row['email'],
            $row['name'],
            $row['role'],
            $row['tenant'],
            $row['mfa'],
        ])->all());

        $this->newLine();
        $this->info('Privileged memberships: '.$rows->count());
        $this->info('MFA confirmed: '.$rows->where('mfa', 'confirmed')->count());
        $this->warn('MFA missing: '.$missing->count());

        if ($this->option('strict') && $missing->isNotEmpty()) {
            $this->error('Strict mode: privileged MFA enrollment is incomplete.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
