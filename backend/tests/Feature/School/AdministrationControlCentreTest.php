<?php

namespace Tests\Feature\School;

use App\Domain\School\SchoolModuleCatalog;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class AdministrationControlCentreTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_all_administrative_record_modules_isolate_reads_and_updates_and_audit_writes(): void
    {
        ['tenant' => $a, 'user' => $adminA] = $this->makeTenantUser('school_super_admin');
        ['tenant' => $b, 'user' => $adminB] = $this->makeTenantUser('school_super_admin');
        foreach (['workflows', 'automation', 'integrations', 'security-settings', 'auth-policies', 'system-config', 'attendance-notifications', 'biometrics', 'houses'] as $module) {
            $payload = [];
            foreach (SchoolModuleCatalog::get($module)['fields'] as $field) {
                $payload[$field['key']] = 'Tenant A configuration';
            }
            $created = $this->actingAsTenantUser($adminA, $a)
                ->withHeader('Idempotency-Key', (string) Str::uuid())
                ->postJson('/api/v1/school-modules/'.$module, ['title' => 'Tenant A configuration', 'payload' => $payload])
                ->assertCreated();
            $id = $created->json('data.id');
            $this->actingAsTenantUser($adminB, $b)->getJson('/api/v1/school-modules/'.$module)
                ->assertOk()->assertJsonPath('data.meta.total', 0);
            $this->actingAsTenantUser($adminB, $b)->withHeader('Idempotency-Key', (string) Str::uuid())
                ->patchJson('/api/v1/school-modules/'.$module.'/'.$id, ['title' => 'Cross tenant write'])->assertNotFound();
            $this->actingAsTenantUser($adminA, $a)->withHeader('Idempotency-Key', (string) Str::uuid())
                ->patchJson('/api/v1/school-modules/'.$module.'/'.$id, ['title' => 'Updated configuration'])->assertOk()
                ->assertJsonPath('data.payload', $payload);
        }
        $this->assertDatabaseHas('audit_logs', ['tenant_id' => $a->getKey(), 'action' => 'school_module.updated']);
    }

    public function test_integration_inventory_rejects_credentials_in_undeclared_payload_fields(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_super_admin');
        $this->actingAsTenantUser($admin, $tenant)->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/school-modules/integrations', ['title' => 'Provider', 'payload' => ['apiKey' => 'must-not-persist']])
            ->assertUnprocessable();
        $this->assertDatabaseMissing('school_module_records', ['title' => 'Provider']);

        $created = $this->actingAsTenantUser($admin, $tenant)->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/school-modules/integrations', ['title' => 'Legacy provider', 'payload' => ['name' => 'Legacy provider']])
            ->assertCreated();
        $id = $created->json('data.id');
        // Simulate data persisted by the old permissive endpoint in this test database.
        DB::table('school_module_records')->where('tenant_id', $tenant->getKey())->where('public_id', $id)
            ->update(['payload' => json_encode(['name' => 'Legacy provider', 'apiKey' => 'legacy-private-value'])]);
        $this->actingAsTenantUser($admin, $tenant)->getJson('/api/v1/school-modules/integrations')
            ->assertOk()->assertDontSee('legacy-private-value')->assertJsonPath('data.data.0.payload.name', 'Legacy provider');
        $this->actingAsTenantUser($admin, $tenant)->withHeader('Idempotency-Key', (string) Str::uuid())
            ->patchJson('/api/v1/school-modules/integrations/'.$id, ['title' => 'Renamed provider'])
            ->assertOk()->assertDontSee('legacy-private-value');
        $audit = AuditLog::query()->where('action', 'school_module.updated')->firstOrFail();
        $this->assertStringNotContainsString('legacy-private-value', json_encode([$audit->before_values, $audit->after_values]));
    }

    public function test_delegated_admin_cannot_use_direct_configuration_apis_without_grants(): void
    {
        ['tenant' => $tenant, 'user' => $admin] = $this->makeTenantUser('school_admin');
        foreach (['workflows', 'automation', 'integrations', 'security-settings', 'auth-policies', 'system-config'] as $module) {
            $this->actingAsTenantUser($admin, $tenant)->getJson('/api/v1/school-modules/'.$module)->assertForbidden();
            $this->actingAsTenantUser($admin, $tenant)->withHeader('Idempotency-Key', (string) Str::uuid())
                ->postJson('/api/v1/school-modules/'.$module, ['title' => 'Denied'])->assertForbidden();
        }
        $this->actingAsTenantUser($admin, $tenant)->getJson('/api/v1/school/memberships')->assertOk();
        foreach (['profile', 'campuses', 'sessions', 'terms', 'classes', 'subjects'] as $resource) {
            $this->actingAsTenantUser($admin, $tenant)->withHeader('Idempotency-Key', (string) Str::uuid())
                ->postJson('/api/v1/school-structure/'.$resource, ['name' => 'Denied'])->assertForbidden();
        }
    }

    public function test_campus_updates_are_tenant_isolated_and_audited_with_before_and_after_values(): void
    {
        ['tenant' => $a, 'user' => $adminA] = $this->makeTenantUser('school_super_admin');
        ['tenant' => $b, 'user' => $adminB] = $this->makeTenantUser('school_super_admin');
        $created = $this->actingAsTenantUser($adminA, $a)->withHeader('Idempotency-Key', (string) Str::uuid())
            ->postJson('/api/v1/school-structure/campuses', ['name' => 'North Campus', 'code' => 'NC'])->assertCreated();
        $id = $created->json('data.id');
        $this->actingAsTenantUser($adminB, $b)->withHeader('Idempotency-Key', (string) Str::uuid())
            ->patchJson('/api/v1/school-structure/campuses/'.$id, ['name' => 'Cross tenant'])->assertNotFound();
        $this->actingAsTenantUser($adminA, $a)->withHeader('Idempotency-Key', (string) Str::uuid())
            ->patchJson('/api/v1/school-structure/campuses/'.$id, ['name' => 'Main Campus'])->assertOk();
        $audit = AuditLog::query()->where('action', 'school_structure.updated')->where('resource_id', $id)->firstOrFail();
        $this->assertSame('North Campus', $audit->before_values['name']);
        $this->assertSame('Main Campus', $audit->after_values['name']);
        $this->assertSame($a->getKey(), $audit->tenant_id);
    }
}
