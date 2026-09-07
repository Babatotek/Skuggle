<?php

namespace Tests\Feature\Authorization;

use App\Domain\Authorization\AuthorizationShadowEvaluator;
use App\Domain\Authorization\CanonicalAuthorizationEvaluator;
use App\Domain\Authorization\PermissionRegistry;
use App\Domain\Authorization\PrivilegeClass;
use App\Domain\Tenancy\TenantContext;
use App\Models\Permission;
use App\Services\PermissionRegistrySynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class CanonicalPermissionRegistryTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_registry_is_unique_valid_and_fully_described(): void
    {
        $definitions = PermissionRegistry::definitions();
        $this->assertCount(56, $definitions);
        $this->assertCount(count($definitions), array_unique(array_keys($definitions)));
        foreach ($definitions as $key => $definition) {
            $this->assertMatchesRegularExpression('/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/', $key);
            $this->assertNotEmpty($definition['domain']);
            $this->assertNotEmpty($definition['resource']);
            $this->assertNotEmpty($definition['action']);
            $this->assertNotEmpty($definition['description']);
            $this->assertNotEmpty($definition['owner']);
            $this->assertNotNull(PrivilegeClass::tryFrom($definition['privilege']));
        }
    }

    public function test_aliases_are_unique_explicit_and_target_known_capabilities(): void
    {
        $aliases = PermissionRegistry::aliasDefinitions();
        $this->assertCount(40, $aliases);
        foreach ($aliases as $legacy => $metadata) {
            $this->assertStringNotContainsString('*', $legacy);
            $this->assertCount(1, $metadata['targets']);
            $this->assertArrayHasKey($metadata['targets'][0], PermissionRegistry::definitions());
            $this->assertNotEmpty($metadata['owner']);
            $this->assertSame(24, $metadata['removalWave']);
        }
    }

    public function test_database_sync_is_additive_idempotent_and_preserves_unknown_rows_and_grants(): void
    {
        $fixture = $this->makeTenantUser();
        $legacyId = Permission::query()->where('name', 'students.view')->value('id');
        $fixture['role']->permissions()->syncWithoutDetaching([$legacyId]);
        $unknown = Permission::query()->create(['name' => 'custom.local.permission', 'description' => 'Customer-owned']);
        $service = app(PermissionRegistrySynchronizer::class);
        $existingCanonical = Permission::query()->whereIn('name', array_keys(PermissionRegistry::definitions()))->count();

        $first = $service->sync();
        $second = $service->sync();

        $this->assertSame(count(PermissionRegistry::definitions()) - $existingCanonical, $first['created']);
        $this->assertSame(0, $second['created']);
        $this->assertDatabaseHas('permissions', ['id' => $unknown->getKey(), 'name' => 'custom.local.permission']);
        $this->assertContains(['key' => 'custom.local.permission', 'classification' => 'MANUAL/CUSTOM'], $second['unknown']);
        $this->assertTrue($fixture['role']->permissions()->whereKey($legacyId)->exists());
        $this->assertFalse($fixture['role']->permissions()->where('name', 'students.profile.view')->exists());
    }

    public function test_evaluator_supports_legacy_and_direct_canonical_grants_and_denies_wrong_tenant(): void
    {
        $fixture = $this->makeTenantUser();
        $other = $this->makeTenantUser();
        $context = app(TenantContext::class);
        $context->set($fixture['tenant'], $fixture['membership'], 'authz-evaluator');
        $legacy = Permission::query()->where('name', 'students.view')->firstOrFail();
        $fixture['role']->permissions()->syncWithoutDetaching([$legacy->getKey()]);
        $evaluator = app(CanonicalAuthorizationEvaluator::class);

        $this->assertTrue($evaluator->allows($fixture['membership']->load('tenant', 'role.permissions'), 'students.profile.view'));
        $this->assertFalse($evaluator->allows($fixture['membership'], 'students.profile.update'));
        $this->assertFalse($evaluator->allows($other['membership']->load('tenant', 'role.permissions'), 'students.profile.view'));

        app(PermissionRegistrySynchronizer::class)->sync();
        $direct = Permission::query()->where('name', 'attendance.student.view')->firstOrFail();
        $fixture['role']->permissions()->syncWithoutDetaching([$direct->getKey()]);
        $evaluator->forget();
        $this->assertTrue($evaluator->allows($fixture['membership']->load('tenant', 'role.permissions'), 'attendance.student.view'));
    }

    public function test_school_membership_cannot_satisfy_platform_capability(): void
    {
        $fixture = $this->makeTenantUser('school_super_admin');
        $context = app(TenantContext::class);
        $context->set($fixture['tenant'], $fixture['membership'], 'platform-boundary');
        $this->assertFalse(app(CanonicalAuthorizationEvaluator::class)->allows($fixture['membership']->load('tenant', 'role.permissions'), 'platform.tenant.manage'));
    }

    public function test_repeated_evaluation_adds_no_database_query_after_membership_bootstrap(): void
    {
        $fixture = $this->makeTenantUser();
        $permission = Permission::query()->where('name', 'students.view')->firstOrFail();
        $fixture['role']->permissions()->syncWithoutDetaching([$permission->getKey()]);
        $membership = $fixture['membership']->load('tenant', 'role.permissions');
        $context = app(TenantContext::class);
        $context->set($fixture['tenant'], $membership, 'query-count');
        $evaluator = app(CanonicalAuthorizationEvaluator::class);
        DB::flushQueryLog();
        DB::enableQueryLog();

        for ($i = 0; $i < 10; $i++) {
            $this->assertTrue($evaluator->allows($membership, 'students.profile.view'));
        }

        $this->assertCount(0, DB::getQueryLog());
    }

    public function test_shadow_reports_parity_and_blocks_privileged_mismatches(): void
    {
        $fixture = $this->makeTenantUser();
        $context = app(TenantContext::class);
        $context->set($fixture['tenant'], $fixture['membership'], 'shadow-test');
        $view = Permission::query()->where('name', 'students.view')->firstOrFail();
        $medical = Permission::query()->where('name', 'students.medical.view')->firstOrFail();
        $fixture['role']->permissions()->syncWithoutDetaching([$view->getKey(), $medical->getKey()]);
        $membership = $fixture['membership']->load('tenant', 'role.permissions');
        $shadow = app(AuthorizationShadowEvaluator::class);

        $this->assertSame('ALLOW_ALLOW', $shadow->compare($membership, 'students.view', 'students.profile.view')['category']);
        $this->assertSame('DENY_DENY', $shadow->compare($membership, 'attendance.approve', 'attendance.student.approve')['category']);
        $membership->status = 'revoked';
        $mismatch = $shadow->compare($membership, 'students.medical.view', 'students.medical.view');
        $this->assertSame('LEGACY_ALLOW_CANONICAL_DENY', $mismatch['category']);
        $this->assertTrue($mismatch['blocksEnforcement']);

        app(PermissionRegistrySynchronizer::class)->sync();
        $canonical = Permission::query()->where('name', 'school.settings.update')->firstOrFail();
        $fixture['role']->permissions()->syncWithoutDetaching([$canonical->getKey()]);
        app(CanonicalAuthorizationEvaluator::class)->forget();
        $membership->status = 'active';
        $membership->setRelation('role', $fixture['role']->load('permissions'));
        $escalation = $shadow->compare($membership, 'settings.configure', 'school.settings.update');
        $this->assertSame('LEGACY_DENY_CANONICAL_ALLOW', $escalation['category']);
        $this->assertTrue($escalation['blocksEnforcement']);
    }

    public function test_authenticated_payload_distinguishes_capabilities_from_legacy_permissions(): void
    {
        $fixture = $this->makeTenantUser();
        $permission = Permission::query()->where('name', 'students.view')->firstOrFail();
        $fixture['role']->permissions()->syncWithoutDetaching([$permission->getKey()]);

        $response = $this->actingAsTenantUser($fixture['user'], $fixture['tenant'])
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.access.registryVersion', PermissionRegistry::VERSION);
        $this->assertContains('students.view', $response->json('data.user.access.legacyPermissions'));
        $this->assertContains('students.profile.view', $response->json('data.user.access.capabilities'));
    }
}
