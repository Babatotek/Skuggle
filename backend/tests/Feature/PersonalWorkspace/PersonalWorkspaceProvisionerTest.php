<?php

namespace Tests\Feature\PersonalWorkspace;

use App\Domain\Tenancy\TenantContext;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantMembership;
use App\Models\User;
use App\Services\PersonalWorkspaceProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class PersonalWorkspaceProvisionerTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_ensure_for_creates_individual_membership_once(): void
    {
        $this->seedAccessControl();
        Role::query()->firstOrCreate(['name' => 'student'], ['label' => 'Student', 'privileged' => false]);

        $user = User::factory()->create(['name' => 'Ada Okafor', 'email' => 'ada@example.com']);
        $provisioner = app(PersonalWorkspaceProvisioner::class);

        $first = $provisioner->ensureFor($user, 'teacher');
        $second = $provisioner->ensureFor($user, 'teacher');

        $this->assertTrue($first->is($second));
        $this->assertSame('individual', $first->tenant->type);
        $this->assertSame(1, TenantMembership::query()->where('user_id', $user->getKey())->count());
    }

    public function test_invite_accept_also_provisions_my_skuggle(): void
    {
        $this->seedAccessControl();
        Role::query()->firstOrCreate(['name' => 'student'], ['label' => 'Student', 'privileged' => false]);

        ['tenant' => $school, 'user' => $admin, 'role' => $teacherRole] = $this->makeTenantUser('teacher', [
            'type' => 'school',
            'status' => 'active',
        ]);

        $token = TenantInvitation::issueToken();
        $context = app(TenantContext::class);
        $context->set($school);
        try {
            TenantInvitation::query()->create([
                'email' => 'invitee@example.com',
                'role_id' => $teacherRole->getKey(),
                'token_hash' => TenantInvitation::hashToken($token),
                'status' => 'pending',
                'expires_at' => now()->addDay(),
                'invited_by' => $admin->getKey(),
            ]);
        } finally {
            $context->clear();
        }

        $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000',
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/api/v1/invites/{$token}/accept", [
            'name' => 'Invitee Teacher',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'email' => 'invitee@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('data.joined', true);

        $user = User::query()->where('email', 'invitee@example.com')->firstOrFail();
        $types = $user->memberships()->with('tenant')->get()->pluck('tenant.type')->sort()->values()->all();
        $this->assertSame(['individual', 'school'], $types);
    }
}
