<?php

namespace Tests\Feature\Authorization;

use App\Domain\Authorization\PermissionRegistry;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Database\Seeders\ReferenceAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class RoleAssignmentPersonaParityTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_personas_have_exact_legacy_to_assignment_capability_parity(): void
    {
        config(['skuggle.iam.role_assignments.mode' => 'OFF']);
        $this->seed(ReferenceAccessSeeder::class);
        $school = $this->tenant('school');
        $platform = $this->tenant('platform');
        $results = [];

        foreach (['platform_super_admin', 'school_super_admin', 'school_admin', 'principal', 'teacher', 'examination_officer', 'bursar', 'parent', 'student'] as $persona) {
            $role = Role::query()->where('name', $persona)->firstOrFail()->load('permissions');
            $membership = TenantMembership::query()->create([
                'tenant_id' => $persona === 'platform_super_admin' ? $platform->id : $school->id,
                'user_id' => User::factory()->create()->id,
                'role_id' => $role->id,
                'status' => 'active',
            ]);
            $assignment = RoleAssignment::query()->create([
                'tenant_membership_id' => $membership->id,
                'role_id' => $role->id,
                'scope_type' => 'TENANT',
                'scope_key' => 'TENANT',
                'status' => RoleAssignment::ACTIVE,
                'source' => RoleAssignment::LEGACY_PRIMARY,
                'is_primary' => true,
            ]);
            $legacy = $this->canonical($role);
            $assigned = $this->canonical($assignment->role()->with('permissions')->firstOrFail());
            $results[$persona] = $legacy === $assigned ? 'MATCH' : 'MISMATCH';
            $this->assertSame($legacy, $assigned, "Capability parity failed for {$persona}");
        }

        $this->assertSame(array_fill_keys(array_keys($results), 'MATCH'), $results);
    }

    private function canonical(Role $role): array
    {
        $capabilities = $role->permissions->pluck('name')->map(fn (string $name) => PermissionRegistry::canonicalFor($name))->filter()->unique()->sort()->values()->all();

        return $capabilities;
    }

    private function tenant(string $type): Tenant
    {
        return Tenant::query()->create([
            'name' => str($type)->title().' parity',
            'slug' => $type.'-parity-'.Str::lower(Str::random(6)),
            'code' => Str::upper(Str::random(8)),
            'type' => $type,
            'status' => 'active',
        ]);
    }
}
