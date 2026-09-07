<?php

namespace App\Models;

use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $status
 * @property string $source
 * @property string $scope_type
 * @property string $scope_key
 * @property int|null $scope_id
 * @property int $tenant_membership_id
 * @property int $role_id
 * @property string $public_id
 * @property bool $is_primary
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property Role|null $role
 */
class RoleAssignment extends Model
{
    use HasPublicId;

    public const ACTIVE = 'ACTIVE';

    public const REVOKED = 'REVOKED';

    public const LEGACY_PRIMARY = 'LEGACY_PRIMARY';

    public const DIRECT = 'DIRECT';

    protected $guarded = ['id'];

    protected $hidden = ['id', 'tenant_membership_id', 'role_id', 'assigned_by'];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_primary' => 'boolean'];
    }

    public function membership(): BelongsTo
    {
        return $this->belongsTo(TenantMembership::class, 'tenant_membership_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function scopeEffective(Builder $query, $at = null): Builder
    {
        $at ??= now();

        return $query->where('status', self::ACTIVE)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $at))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', $at));
    }

    public function isEffective(): bool
    {
        $now = now();

        return $this->status === self::ACTIVE && (! $this->starts_at || $this->starts_at->lte($now)) && (! $this->ends_at || $this->ends_at->gt($now));
    }
}
