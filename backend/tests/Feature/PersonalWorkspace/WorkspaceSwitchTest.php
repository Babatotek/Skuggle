<?php

namespace Tests\Feature\PersonalWorkspace;

use App\Domain\Tenancy\TenantContext;
use App\Models\Campus;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class WorkspaceSwitchTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    private function statefulJson(string $method, string $uri, array $data = [], array $headers = [])
    {
        $headers = array_merge([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000',
        ], $headers);

        return $this->json($method, $uri, $data, $headers);
    }

    public function test_switch_clears_academic_context_and_returns_destination_type(): void
    {
        $this->seedAccessControl();

        $personalRole = Role::query()->firstOrCreate(
            ['name' => 'teacher'],
            ['label' => 'Teacher', 'privileged' => false],
        );

        $personal = Tenant::query()->create([
            'name' => "Ada's Learning Space",
            'slug' => 'personal-'.Str::random(6),
            'code' => 'IND'.Str::upper(Str::random(4)),
            'type' => 'individual',
            'status' => 'active',
        ]);

        ['tenant' => $school, 'user' => $user] = $this->makeTenantUser('teacher', [
            'name' => 'Adunni Academy',
            'type' => 'school',
            'status' => 'active',
        ]);

        TenantMembership::query()->create([
            'tenant_id' => $personal->getKey(),
            'user_id' => $user->getKey(),
            'role_id' => $personalRole->getKey(),
            'status' => 'active',
            'joined_at' => now()->subDay(),
        ]);

        $campus = null;
        app(TenantContext::class)->set($school);
        try {
            $campus = Campus::query()->create([
                'name' => 'Main',
                'code' => 'MAIN',
                'status' => 'active',
            ]);
        } finally {
            app(TenantContext::class)->clear();
        }

        $this->actingAsTenantUser($user, $school)
            ->withSession([
                'tenant_public_id' => $school->public_id,
                'campus_public_id' => $campus->public_id,
                'academic_session_public_id' => 'session-stale',
                'term_public_id' => 'term-stale',
            ]);

        $this->statefulJson('POST', '/api/v1/auth/switch-workspace', [
            'tenantId' => $personal->public_id,
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.user.tenant.type', 'individual')
            ->assertJsonPath('data.user.tenant.id', $personal->public_id);

        $this->assertSame($personal->public_id, session('tenant_public_id'));
        $this->assertNull(session('campus_public_id'));
        $this->assertNull(session('academic_session_public_id'));
        $this->assertNull(session('term_public_id'));

        $this->statefulJson('POST', '/api/v1/auth/switch-workspace', [
            'tenantId' => $school->public_id,
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk()
            ->assertJsonPath('data.user.tenant.type', 'school')
            ->assertJsonPath('data.user.tenant.id', $school->public_id);
    }

    public function test_switch_rejects_workspaces_the_user_does_not_belong_to(): void
    {
        ['tenant' => $school, 'user' => $user] = $this->makeTenantUser('teacher');
        $other = Tenant::query()->create([
            'name' => 'Other School',
            'slug' => 'other-'.Str::random(6),
            'code' => 'OTH'.Str::upper(Str::random(4)),
            'type' => 'school',
            'status' => 'active',
        ]);

        $this->actingAsTenantUser($user, $school);

        $this->statefulJson('POST', '/api/v1/auth/switch-workspace', [
            'tenantId' => $other->public_id,
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'WORKSPACE_UNAVAILABLE');
    }
}
