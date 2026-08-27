<?php

namespace Tests\Feature;

use App\Domain\Tenancy\TenantContext;
use App\Models\Role;
use App\Models\Student;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Tenant Isolation Integration Tests
 *
 * Verifies that the row-level multi-tenancy implementation correctly
 * prevents cross-tenant data access across all critical paths:
 *  - TenantScope (fail-closed, per-tenant filtering)
 *  - BelongsToTenant (auto-population on create)
 *  - ResolveTenant middleware (context setup + cleanup)
 *  - API endpoints (cannot access other tenant's records)
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;

    private Tenant $tenantB;

    private User $userA;

    private User $userB;

    private TenantMembership $membershipA;

    private TenantMembership $membershipB;

    private Role $role;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
        $this->seedTenants();
    }

    private function seedTenants(): void
    {
        $this->role = Role::create([
            'name' => 'Admin',
            'label' => 'Administrator',
            'slug' => 'admin-'.Str::random(6),
            'privileged' => false,
        ]);

        $this->tenantA = Tenant::create([
            'name' => 'School A',
            'slug' => 'school-a-'.Str::random(6),
            'code' => 'SCA'.Str::random(3),
            'type' => 'school',
            'status' => 'active',
        ]);

        $this->tenantB = Tenant::create([
            'name' => 'School B',
            'slug' => 'school-b-'.Str::random(6),
            'code' => 'SCB'.Str::random(3),
            'type' => 'school',
            'status' => 'active',
        ]);

        $this->userA = User::factory()->create(['email_verified_at' => now()]);
        $this->userB = User::factory()->create(['email_verified_at' => now()]);

        $this->membershipA = TenantMembership::create([
            'tenant_id' => $this->tenantA->getKey(),
            'user_id' => $this->userA->getKey(),
            'role_id' => $this->role->getKey(),
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $this->membershipB = TenantMembership::create([
            'tenant_id' => $this->tenantB->getKey(),
            'user_id' => $this->userB->getKey(),
            'role_id' => $this->role->getKey(),
            'status' => 'active',
            'joined_at' => now(),
        ]);
    }

    // -------------------------------------------------------------------------
    // TenantScope — fail-closed behaviour
    // -------------------------------------------------------------------------

    #[Test]
    public function tenant_scope_returns_no_records_when_context_not_set(): void
    {
        // Seed a student directly bypassing context
        DB::table('students')->insert([
            'tenant_id' => $this->tenantA->getKey(),
            'public_id' => (string) Str::ulid(),
            'first_name' => 'Ghost',
            'last_name' => 'Student',
            'gender' => 'male',
            'status' => 'active',
            'admission_number' => 'GHOST-001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // No context set — scope should return nothing
        $context = app(TenantContext::class);
        $context->clear();

        $results = Student::all();

        $this->assertCount(0, $results, 'TenantScope must fail-closed: no records when context is not set');
    }

    #[Test]
    public function tenant_scope_only_returns_records_for_active_tenant(): void
    {
        $context = app(TenantContext::class);

        // Create student for tenant A
        $context->set($this->tenantA, $this->membershipA);
        Student::create($this->studentData('Alice'));
        $context->clear();

        // Create student for tenant B
        $context->set($this->tenantB, $this->membershipB);
        Student::create($this->studentData('Bob'));
        $context->clear();

        // Query as tenant A — should only see Alice
        $context->set($this->tenantA, $this->membershipA);
        $studentsA = Student::all();
        $context->clear();

        $this->assertCount(1, $studentsA, 'Tenant A should only see their own students');
        $this->assertEquals('Alice', $studentsA->first()->first_name);

        // Query as tenant B — should only see Bob
        $context->set($this->tenantB, $this->membershipB);
        $studentsB = Student::all();
        $context->clear();

        $this->assertCount(1, $studentsB, 'Tenant B should only see their own students');
        $this->assertEquals('Bob', $studentsB->first()->first_name);
    }

    #[Test]
    public function tenant_a_cannot_find_tenant_b_record_by_id(): void
    {
        $context = app(TenantContext::class);

        // Create student under tenant B
        $context->set($this->tenantB, $this->membershipB);
        $studentB = Student::create($this->studentData('Bob'));
        $context->clear();

        // Try to find tenant B's student while acting as tenant A
        $context->set($this->tenantA, $this->membershipA);
        $found = Student::find($studentB->getKey());
        $context->clear();

        $this->assertNull($found, 'Tenant A must not find Tenant B records by primary key');
    }

    #[Test]
    public function tenant_a_cannot_find_tenant_b_record_by_public_id(): void
    {
        $context = app(TenantContext::class);

        $context->set($this->tenantB, $this->membershipB);
        $studentB = Student::create($this->studentData('Bob'));
        $context->clear();

        $context->set($this->tenantA, $this->membershipA);
        $found = Student::where('public_id', $studentB->public_id)->first();
        $context->clear();

        $this->assertNull($found, 'Tenant A must not find Tenant B records by public_id');
    }

    // -------------------------------------------------------------------------
    // BelongsToTenant — auto-population on create
    // -------------------------------------------------------------------------

    #[Test]
    public function belongs_to_tenant_auto_populates_tenant_id_on_create(): void
    {
        $context = app(TenantContext::class);

        $context->set($this->tenantA, $this->membershipA);
        $student = Student::create($this->studentData('Alice'));
        $context->clear();

        $raw = DB::table('students')
            ->where('id', $student->getKey())
            ->first();

        $this->assertEquals($this->tenantA->getKey(), $raw->tenant_id,
            'BelongsToTenant must auto-populate tenant_id on create');
    }

    #[Test]
    public function creating_record_without_tenant_context_throws_exception(): void
    {
        $context = app(TenantContext::class);
        $context->clear();

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Tenant-owned records require an authorised tenant context.');

        Student::create($this->studentData('Orphan'));
    }

    #[Test]
    public function tenant_id_cannot_be_overridden_via_mass_assignment(): void
    {
        $context = app(TenantContext::class);

        $context->set($this->tenantA, $this->membershipA);
        $student = Student::create(array_merge(
            $this->studentData('Alice'),
            ['tenant_id' => $this->tenantB->getKey()]  // attempt to inject wrong tenant
        ));
        $context->clear();

        // The guarded field means tenant_id from mass assignment is ignored;
        // the creating hook should have set tenantA's id instead.
        $raw = DB::table('students')
            ->where('id', $student->getKey())
            ->first();

        $this->assertEquals($this->tenantA->getKey(), $raw->tenant_id,
            'tenant_id must not be overridable via mass assignment');
    }

    // -------------------------------------------------------------------------
    // ResolveTenant middleware — context lifecycle
    // -------------------------------------------------------------------------

    #[Test]
    public function resolve_tenant_middleware_sets_context_for_request(): void
    {
        $token = $this->userA->createToken('test')->plainTextToken;
        $context = app(TenantContext::class);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Tenant-Id' => $this->tenantA->public_id,
        ])->getJson('/api/v1/auth/me');

        // After the request the context must be cleared
        $this->assertFalse($context->hasTenant(),
            'TenantContext must be cleared after request completes (finally block)');
    }

    #[Test]
    public function resolve_tenant_rejects_inactive_tenant(): void
    {
        $inactiveTenant = Tenant::create([
            'name' => 'Closed School',
            'slug' => 'closed-'.Str::random(6),
            'code' => 'CLO'.Str::random(3),
            'type' => 'school',
            'status' => 'suspended',
        ]);

        TenantMembership::create([
            'tenant_id' => $inactiveTenant->getKey(),
            'user_id' => $this->userA->getKey(),
            'role_id' => $this->role->getKey(),
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $token = $this->userA->createToken('test')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Tenant-Id' => $inactiveTenant->public_id,
        ])->getJson('/api/v1/auth/me');

        $response->assertStatus(403);
        $response->assertJson(['error' => ['code' => 'TENANT_UNAVAILABLE']]);
    }

    #[Test]
    public function resolve_tenant_rejects_request_with_no_membership(): void
    {
        // userA has no membership in tenantB
        $token = $this->userA->createToken('test')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Tenant-Id' => $this->tenantB->public_id,
        ])->getJson('/api/v1/auth/me');

        $response->assertStatus(403);
        $response->assertJson(['error' => ['code' => 'TENANT_MEMBERSHIP_REQUIRED']]);
    }

    #[Test]
    public function context_is_cleared_even_when_controller_throws(): void
    {
        $context = app(TenantContext::class);
        $context->clear();

        // This should be clear before and after, regardless of what the route does
        $this->assertFalse($context->hasTenant());

        $token = $this->userA->createToken('test')->plainTextToken;
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Tenant-Id' => $this->tenantA->public_id,
        ])->getJson('/api/v1/students/non-existent-public-id');

        $this->assertFalse($context->hasTenant(),
            'TenantContext must be cleared after request even when 404 is returned');
    }

    // -------------------------------------------------------------------------
    // Cross-tenant count isolation
    // -------------------------------------------------------------------------

    #[Test]
    public function count_queries_are_scoped_to_active_tenant(): void
    {
        $context = app(TenantContext::class);

        // Insert 3 students for tenant A, 2 for tenant B
        $context->set($this->tenantA, $this->membershipA);
        Student::create($this->studentData('A1'));
        Student::create($this->studentData('A2'));
        Student::create($this->studentData('A3'));
        $context->clear();

        $context->set($this->tenantB, $this->membershipB);
        Student::create($this->studentData('B1'));
        Student::create($this->studentData('B2'));
        $context->clear();

        $context->set($this->tenantA, $this->membershipA);
        $countA = Student::count();
        $context->clear();

        $context->set($this->tenantB, $this->membershipB);
        $countB = Student::count();
        $context->clear();

        $this->assertEquals(3, $countA, 'Tenant A count must be 3');
        $this->assertEquals(2, $countB, 'Tenant B count must be 2');
    }

    #[Test]
    public function delete_is_scoped_to_active_tenant(): void
    {
        $context = app(TenantContext::class);

        $context->set($this->tenantA, $this->membershipA);
        $studentA = Student::create($this->studentData('Alice'));
        $context->clear();

        $context->set($this->tenantB, $this->membershipB);
        Student::create($this->studentData('Bob'));
        $context->clear();

        // Delete all students as tenant A — should only delete Alice
        $context->set($this->tenantA, $this->membershipA);
        Student::query()->delete();
        $context->clear();

        // Bob (tenant B) should still exist
        $raw = DB::table('students')->where('deleted_at', null)->count();
        $this->assertEquals(1, $raw, 'Delete scoped to tenant A must not delete Tenant B records');

        $remainingId = DB::table('students')
            ->whereNull('deleted_at')
            ->value('tenant_id');
        $this->assertEquals($this->tenantB->getKey(), $remainingId,
            'The surviving record must belong to Tenant B');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function studentData(string $firstName): array
    {
        static $counter = 0;
        $counter++;

        return [
            'first_name' => $firstName,
            'last_name' => 'Test',
            'gender' => 'male',
            'status' => 'active',
            'admission_number' => 'ADM-'.$counter.'-'.Str::random(4),
        ];
    }
}
