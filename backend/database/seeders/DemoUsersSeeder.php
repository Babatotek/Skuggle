<?php

namespace Database\Seeders;

use App\Domain\Tenancy\TenantContext;
use App\Models\Campus;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Local/XAMPP demo accounts only. Do not run on Hostinger production.
 */
class DemoUsersSeeder extends Seeder
{
    public const OWNER_EMAIL = 'owner@skuggle.test';

    public const OWNER_PASSWORD = 'SkuggleOwner!2026';

    public const DEMO_PASSWORD = 'SkuggleDemo!2026';

    public const DEMO_SCHOOL_SLUG = 'demo-tenant';

    public const DEMO_TENANT_EMAIL = 'admin@demotenant.test';

    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->error('DemoUsersSeeder refused to run in production.');

            return;
        }
        $this->call(ReferenceAccessSeeder::class);
        $this->seedPlans();

        $platform = Tenant::query()->updateOrCreate(
            ['slug' => 'skuggle-platform'],
            [
                'name' => 'Skuggle Platform',
                'code' => 'SKU-PLATFORM',
                'type' => 'platform',
                'status' => 'active',
                'subscription_plan' => 'platform',
                'subscription_status' => 'active',
                'subscription_started_at' => now(),
                'quota_limits' => ['users' => 100, 'students' => 0, 'storage_bytes' => 1073741824, 'ai_requests_per_day' => 1000],
                'quota_usage' => ['users' => 1, 'students' => 0, 'storage_bytes' => 0],
            ],
        );

        $school = Tenant::query()->updateOrCreate(
            ['slug' => self::DEMO_SCHOOL_SLUG],
            [
                'name' => 'DemoTenant',
                'code' => 'DEMO-TENANT',
                'type' => 'school',
                'status' => 'active',
                'subscription_plan' => 'pilot',
                'subscription_status' => 'active',
                'subscription_started_at' => now(),
                'quota_limits' => ['users' => 250, 'students' => 1000, 'storage_bytes' => 5368709120, 'ai_requests_per_day' => 250],
                'quota_usage' => ['users' => 0, 'students' => 0, 'storage_bytes' => 0],
                'settings' => [
                    'contact' => ['email' => self::DEMO_TENANT_EMAIL, 'phone' => '08000000000'],
                    'profile' => ['school_type' => 'private', 'school_level' => 'secondary'],
                    'branding' => [
                        'primary_color' => '#4F46E5',
                        'display_name' => 'DemoTenant School',
                    ],
                    'is_demo' => true,
                ],
            ],
        );

        // Only one demo school — deactivate any legacy extra school tenants.
        Tenant::query()
            ->where('type', 'school')
            ->where('slug', '!=', self::DEMO_SCHOOL_SLUG)
            ->where(function ($query) {
                $query->where('slug', 'like', 'demo-%')
                    ->orWhere('slug', 'demo-greenfield-academy');
            })
            ->update(['status' => 'inactive']);

        $this->upsertMembership(
            $platform,
            self::OWNER_EMAIL,
            'Tosin — Platform Owner',
            self::OWNER_PASSWORD,
            'platform_super_admin',
        );

        // Single demonstration school — one login per school role for full walkthrough.
        $schoolAccounts = [
            [self::DEMO_TENANT_EMAIL, 'DemoTenant Administrator', 'school_admin'],
            ['admin@royalgateway.edu.ng', 'Demo School Admin', 'school_admin'],
            ['principal@royalgateway.edu.ng', 'Mrs. Adeyemi', 'principal'],
            ['adewale.o@royalgateway.edu.ng', 'Mr. Adewale', 'teacher'],
            ['bursar@royalgateway.edu.ng', 'Mrs. Okonkwo', 'bursar'],
            ['exams@royalgateway.edu.ng', 'Mr. Danladi', 'examination_officer'],
            ['bello.folashade@gmail.com', 'Mrs. Bello', 'parent'],
            ['nathan.bello@student.royalgateway.edu.ng', 'Nathan Bello', 'student'],
            ['owner@skuggle.com', 'Tosin — Platform Owner', 'platform_super_admin'],
        ];

        foreach ($schoolAccounts as [$email, $name, $role]) {
            $tenantForAccount = $role === 'platform_super_admin' ? $platform : $school;
            $password = $role === 'platform_super_admin' ? self::OWNER_PASSWORD : self::DEMO_PASSWORD;
            $this->upsertMembership($tenantForAccount, $email, $name, $password, $role);
        }

        $context = app(TenantContext::class);
        $context->set($school);
        try {
            Campus::query()->firstOrCreate(
                ['tenant_id' => $school->getKey(), 'code' => 'MAIN'],
                ['name' => 'Main Campus', 'status' => 'active', 'public_id' => (string) Str::ulid()],
            );

            $pilot = Plan::query()->where('code', 'pilot')->first();
            if ($pilot) {
                Subscription::query()->withoutGlobalScopes()->updateOrCreate(
                    [
                        'tenant_id' => $school->getKey(),
                        'plan_id' => $pilot->getKey(),
                    ],
                    [
                        'status' => 'active',
                        'starts_at' => now()->subDays(10),
                        'current_period_ends_at' => now()->addMonth(),
                        'public_id' => (string) Str::ulid(),
                    ],
                );
            }
        } finally {
            $context->clear();
        }

        $this->call(DemoTenantDataSeeder::class);
        $this->call(PlatformOpsSeeder::class);

        $this->command?->info('Local database fixture ready: DemoTenant.');
        $this->command?->table(
            ['Role', 'Email', 'Password'],
            [
                ['platform_super_admin', self::OWNER_EMAIL, self::OWNER_PASSWORD],
                ['platform_super_admin (alias)', 'owner@skuggle.com', self::OWNER_PASSWORD],
                ['DemoTenant school_admin', self::DEMO_TENANT_EMAIL, self::DEMO_PASSWORD],
                ['school_admin', 'admin@royalgateway.edu.ng', self::DEMO_PASSWORD],
                ['principal', 'principal@royalgateway.edu.ng', self::DEMO_PASSWORD],
                ['teacher', 'adewale.o@royalgateway.edu.ng', self::DEMO_PASSWORD],
                ['bursar', 'bursar@royalgateway.edu.ng', self::DEMO_PASSWORD],
                ['examination_officer', 'exams@royalgateway.edu.ng', self::DEMO_PASSWORD],
                ['parent', 'bello.folashade@gmail.com', self::DEMO_PASSWORD],
                ['student', 'nathan.bello@student.royalgateway.edu.ng', self::DEMO_PASSWORD],
            ],
        );
    }

    private function seedPlans(): void
    {
        $plans = [
            [
                'code' => 'pilot',
                'name' => 'Pilot',
                'price_minor' => 0,
                'limits' => ['users' => 25, 'students' => 200, 'storage_bytes' => 1073741824, 'ai_requests_per_day' => 50],
                'features' => ['core_sis', 'attendance', 'assessments', 'library_basic'],
            ],
            [
                'code' => 'growth',
                'name' => 'Growth',
                'price_minor' => 4500000,
                'limits' => ['users' => 100, 'students' => 1000, 'storage_bytes' => 10737418240, 'ai_requests_per_day' => 250],
                'features' => ['core_sis', 'attendance', 'assessments', 'library', 'finance', 'reports', 'ai_tools'],
            ],
            [
                'code' => 'enterprise',
                'name' => 'Enterprise',
                'price_minor' => 15000000,
                'limits' => ['users' => 500, 'students' => 5000, 'storage_bytes' => 107374182400, 'ai_requests_per_day' => 2000],
                'features' => ['core_sis', 'attendance', 'assessments', 'library', 'finance', 'reports', 'ai_tools', 'multi_campus', 'priority_support'],
            ],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(
                ['code' => $plan['code']],
                [
                    'name' => $plan['name'],
                    'price_minor' => $plan['price_minor'],
                    'currency' => 'NGN',
                    'billing_interval' => 'monthly',
                    'limits' => $plan['limits'],
                    'features' => $plan['features'],
                    'active' => true,
                ],
            );
        }
    }

    private function upsertMembership(
        Tenant $tenant,
        string $email,
        string $name,
        string $password,
        string $roleName,
    ): void {
        $role = Role::query()->where('name', $roleName)->firstOrFail();

        $user = User::query()->updateOrCreate(
            ['email' => mb_strtolower($email)],
            [
                'name' => $name,
                'status' => 'active',
                'email_verified_at' => now(),
                // Plain text: User model `hashed` cast hashes once.
                'password' => $password,
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ],
        );

        TenantMembership::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->getKey(),
                'user_id' => $user->getKey(),
            ],
            [
                'role_id' => $role->getKey(),
                'status' => 'active',
                'joined_at' => now(),
            ],
        );
    }
}
