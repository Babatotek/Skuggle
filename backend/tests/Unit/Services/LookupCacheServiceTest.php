<?php

namespace Tests\Unit\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\Tenant;
use App\Services\LookupCacheService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LookupCacheServiceTest extends TestCase
{
    private LookupCacheService $service;

    private TenantContext $context;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up a fake tenant context
        $this->context = app(TenantContext::class);

        // Build a minimal Tenant stub using a real Tenant model without DB
        $tenant = new Tenant;
        $tenant->forceFill(['id' => 42]);
        $this->context->setPublicTenant($tenant);

        $this->service = new LookupCacheService($this->context);
    }

    protected function tearDown(): void
    {
        $this->context->clear();
        parent::tearDown();
    }

    // -----------------------------------------------------------------------
    // Key generation
    // -----------------------------------------------------------------------

    #[Test]
    public function curriculum_key_is_tenant_scoped(): void
    {
        $key = $this->service->curriculumKey();

        $this->assertStringContainsString('42', $key, 'Cache key must include tenant ID');
        $this->assertStringContainsString('curriculum', $key, 'Cache key must identify curriculum');
    }

    #[Test]
    public function subjects_key_is_tenant_scoped(): void
    {
        $key = $this->service->subjectsKey();

        $this->assertStringContainsString('42', $key);
        $this->assertStringContainsString('subjects', $key);
    }

    #[Test]
    public function classes_key_is_tenant_scoped(): void
    {
        $key = $this->service->classesKey();

        $this->assertStringContainsString('42', $key);
        $this->assertStringContainsString('classes', $key);
    }

    #[Test]
    public function different_tenants_produce_different_keys(): void
    {
        $key42 = $this->service->curriculumKey();

        // Switch to tenant 99
        $tenant99 = new Tenant;
        $tenant99->forceFill(['id' => 99]);
        $this->context->setPublicTenant($tenant99);
        $service99 = new LookupCacheService($this->context);

        $key99 = $service99->curriculumKey();

        $this->assertNotSame($key42, $key99, 'Different tenants must have different cache keys');
    }

    // -----------------------------------------------------------------------
    // TTLs
    // -----------------------------------------------------------------------

    #[Test]
    public function curriculum_ttl_defaults_to_300_seconds(): void
    {
        Config::set('skuggle.cache_ttl.curriculum', 300);
        $this->assertSame(300, $this->service->curriculumTtl());
    }

    #[Test]
    public function curriculum_ttl_is_configurable_via_env(): void
    {
        Config::set('skuggle.cache_ttl.curriculum', 600);
        $this->assertSame(600, $this->service->curriculumTtl());
        Config::set('skuggle.cache_ttl.curriculum', 300);
    }

    // -----------------------------------------------------------------------
    // remember / forget
    // -----------------------------------------------------------------------

    #[Test]
    public function remember_curriculum_caches_callback_result(): void
    {
        $callCount = 0;
        $callback = function () use (&$callCount): array {
            $callCount++;

            return ['levels' => [], 'classes' => [], 'subjects' => []];
        };

        $first = $this->service->rememberCurriculum($callback);
        $second = $this->service->rememberCurriculum($callback);

        $this->assertSame(1, $callCount, 'Callback should only be called once — second call hits cache');
        $this->assertSame($first, $second, 'Both calls should return identical data');
    }

    #[Test]
    public function forget_curriculum_clears_cache(): void
    {
        $callCount = 0;
        $callback = function () use (&$callCount): array {
            $callCount++;

            return ['data' => $callCount];
        };

        $this->service->rememberCurriculum($callback);
        $this->service->forgetCurriculum();
        $this->service->rememberCurriculum($callback);

        $this->assertSame(2, $callCount, 'After forgetCurriculum(), callback must be called again');
    }

    #[Test]
    public function forget_all_clears_all_lookup_caches(): void
    {
        $counts = ['curriculum' => 0, 'subjects' => 0, 'classes' => 0];

        $this->service->rememberCurriculum(function () use (&$counts): array {
            $counts['curriculum']++;

            return [];
        });
        $this->service->rememberSubjects(function () use (&$counts): array {
            $counts['subjects']++;

            return [];
        });
        $this->service->rememberClasses(function () use (&$counts): array {
            $counts['classes']++;

            return [];
        });

        $this->service->forgetAll();

        $this->service->rememberCurriculum(function () use (&$counts): array {
            $counts['curriculum']++;

            return [];
        });
        $this->service->rememberSubjects(function () use (&$counts): array {
            $counts['subjects']++;

            return [];
        });
        $this->service->rememberClasses(function () use (&$counts): array {
            $counts['classes']++;

            return [];
        });

        $this->assertSame(2, $counts['curriculum'], 'forgetAll() must bust curriculum cache');
        $this->assertSame(2, $counts['subjects'], 'forgetAll() must bust subjects cache');
        $this->assertSame(2, $counts['classes'], 'forgetAll() must bust classes cache');
    }

    // -----------------------------------------------------------------------
    // Integration: cache store is the array driver in tests (no real Redis needed)
    // -----------------------------------------------------------------------

    #[Test]
    public function uses_laravel_cache_facade(): void
    {
        Cache::shouldReceive('remember')->once()->andReturn([]);

        $this->service->rememberCurriculum(fn () => []);
    }
}
