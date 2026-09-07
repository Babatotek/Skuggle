<?php

namespace App\Models;

use App\Domain\Authorization\RoleAssignmentService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class TenantMembership extends Model
{
    protected $guarded = ['id'];

    protected static function booted(): void
    {
        static::saved(function (self $membership): void {
            $mode = strtoupper((string) config('skuggle.iam.role_assignments.mode', 'SHADOW'));
            if ($membership->role_id && $mode !== 'OFF' && Schema::hasTable('role_assignments')) {
                $assignment = app(RoleAssignmentService::class)->syncLegacyPrimary($membership, auth()->user());
                $membership->setRelation('roleAssignments', collect([$assignment->load('role.permissions')]));
            }
        });
    }

    protected function casts(): array
    {
        return ['joined_at' => 'datetime'];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function roleAssignments(): HasMany
    {
        return $this->hasMany(RoleAssignment::class);
    }

    public function permissionNames(): array
    {
        return $this->role?->permissions?->pluck('name')->values()->all() ?? [];
    }
}
