<?php

namespace Tests\Feature\PersonalWorkspace;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PersonalPlanTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Tenant $personalTenant;
    private array $headers;

    protected function setUp(): void
    {
        parent::setUp();
        $role = Role::query()->create(['name' => 'student', 'label' => 'Student', 'slug' => 'student-'.Str::random(5), 'privileged' => false]);
        $this->personalTenant = Tenant::query()->create(['name' => 'Personal', 'slug' => 'personal-'.Str::random(5), 'code' => 'MY'.Str::random(4), 'type' => 'individual', 'status' => 'active']);
        $this->user = User::factory()->create();
        TenantMembership::query()->create(['tenant_id' => $this->personalTenant->getKey(), 'user_id' => $this->user->getKey(), 'role_id' => $role->getKey(), 'status' => 'active', 'joined_at' => now()]);
        $token = $this->user->createToken('personal-plan-test')->plainTextToken;
        $this->headers = ['Authorization' => "Bearer {$token}", 'X-Tenant-Id' => $this->personalTenant->public_id];
    }

    public function test_user_can_create_list_complete_and_delete_personal_plan(): void
    {
        $created = $this->withHeaders($this->headers + ['Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/personal/plans', ['title' => ' Revise algebra ', 'dueDate' => '2026-09-01'])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Revise algebra')
            ->assertJsonPath('data.completed', false);

        $id = $created->json('data.id');
        $this->withHeaders($this->headers)->getJson('/api/v1/personal/plans')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $id);

        $this->withHeaders($this->headers + ['Idempotency-Key' => (string) Str::uuid()])
            ->patchJson("/api/v1/personal/plans/{$id}", ['completed' => true])
            ->assertOk()->assertJsonPath('data.completed', true);

        $this->withHeaders($this->headers + ['Idempotency-Key' => (string) Str::uuid()])
            ->deleteJson("/api/v1/personal/plans/{$id}")->assertNoContent();
    }

    public function test_school_workspace_cannot_access_personal_plans(): void
    {
        $school = Tenant::query()->create(['name' => 'School', 'slug' => 'school-'.Str::random(5), 'code' => 'SC'.Str::random(4), 'type' => 'school', 'status' => 'active']);
        $role = Role::query()->first();
        TenantMembership::query()->create(['tenant_id' => $school->getKey(), 'user_id' => $this->user->getKey(), 'role_id' => $role->getKey(), 'status' => 'active', 'joined_at' => now()]);

        $this->withHeaders(array_merge($this->headers, ['X-Tenant-Id' => $school->public_id]))
            ->getJson('/api/v1/personal/plans')
            ->assertForbidden()
            ->assertJsonPath('error.code', 'PERSONAL_WORKSPACE_REQUIRED');
    }
}
