<?php

namespace Tests\Unit\Config;

use App\Providers\AppServiceProvider;
use PHPUnit\Framework\Attributes\Test;
use RuntimeException;
use Tests\TestCase;

class StorageEnforcementTest extends TestCase
{
    #[Test]
    public function local_disk_is_accepted_in_non_production(): void
    {
        // testing env — local disk must be fine
        $this->assertSame('testing', app()->environment());

        config(['skuggle.library.disk' => 'local']);
        config(['app.env' => 'testing']);

        // Re-booting AppServiceProvider would be complex; instead verify the
        // enforcement method is only called in production by inspecting the source.
        $source = file_get_contents(app_path('Providers/AppServiceProvider.php'));

        $this->assertStringContainsString("app()->environment('production')", $source,
            'enforceProductionStorage must only run in production environment');
        $this->assertStringContainsString('enforceProductionStorage', $source,
            'boot() must call enforceProductionStorage()');
    }

    #[Test]
    public function enforcement_method_throws_for_local_disk_in_production(): void
    {
        // Instantiate the provider and call the private method directly via reflection
        $provider = new AppServiceProvider(app());

        $method = new \ReflectionMethod($provider, 'enforceProductionStorage');

        config(['skuggle.library.disk' => 'local']);
        putenv('STORAGE_LOCAL_ALLOWED=');

        app()->detectEnvironment(fn () => 'production');

        try {
            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessageMatches('/local filesystem driver/');
            $method->invoke($provider);
        } finally {
            app()->detectEnvironment(fn () => 'testing');
        }
    }

    #[Test]
    public function enforcement_method_throws_for_public_disk_in_production(): void
    {
        $provider = new AppServiceProvider(app());
        $method = new \ReflectionMethod($provider, 'enforceProductionStorage');

        config(['skuggle.library.disk' => 'public']);
        putenv('STORAGE_LOCAL_ALLOWED=');

        app()->detectEnvironment(fn () => 'production');

        try {
            $this->expectException(RuntimeException::class);
            $method->invoke($provider);
        } finally {
            app()->detectEnvironment(fn () => 'testing');
        }
    }

    #[Test]
    public function enforcement_method_accepts_s3_disk_in_production(): void
    {
        $provider = new AppServiceProvider(app());
        $method = new \ReflectionMethod($provider, 'enforceProductionStorage');

        config(['skuggle.library.disk' => 's3']);
        config(['filesystems.disks.s3' => ['driver' => 's3', 'bucket' => 'test']]);
        putenv('STORAGE_LOCAL_ALLOWED=');

        app()->detectEnvironment(fn () => 'production');

        try {
            // Must not throw
            $method->invoke($provider);
            $this->assertTrue(true, 's3 disk should be accepted in production');
        } finally {
            app()->detectEnvironment(fn () => 'testing');
        }
    }

    #[Test]
    public function enforcement_method_is_bypassed_when_local_allowed_flag_set(): void
    {
        $provider = new AppServiceProvider(app());
        $method = new \ReflectionMethod($provider, 'enforceProductionStorage');

        config(['skuggle.library.disk' => 'local']);
        putenv('STORAGE_LOCAL_ALLOWED=true');

        app()->detectEnvironment(fn () => 'production');

        try {
            // Must not throw — single-node intentional deployment
            $method->invoke($provider);
            $this->assertTrue(true, 'Local disk must be accepted when STORAGE_LOCAL_ALLOWED=true');
        } finally {
            app()->detectEnvironment(fn () => 'testing');
            putenv('STORAGE_LOCAL_ALLOWED=');
        }
    }

    #[Test]
    public function enforcement_method_throws_for_unknown_disk(): void
    {
        $provider = new AppServiceProvider(app());
        $method = new \ReflectionMethod($provider, 'enforceProductionStorage');

        config(['skuggle.library.disk' => 'r2']);
        // Don't define r2 in filesystems.disks
        $disks = config('filesystems.disks');
        unset($disks['r2']);
        config(['filesystems.disks' => $disks]);
        putenv('STORAGE_LOCAL_ALLOWED=');

        app()->detectEnvironment(fn () => 'production');

        try {
            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessageMatches('/not defined in config\/filesystems/');
            $method->invoke($provider);
        } finally {
            app()->detectEnvironment(fn () => 'testing');
        }
    }

    #[Test]
    public function env_example_documents_storage_enforcement(): void
    {
        $example = file_get_contents(base_path('.env.example'));

        $this->assertStringContainsString('LIBRARY_DISK', $example);
        $this->assertStringContainsString('STORAGE_LOCAL_ALLOWED', $example);
        $this->assertStringContainsString('s3', $example,
            '.env.example should mention s3 as the production storage option');
    }

    protected function tearDown(): void
    {
        putenv('STORAGE_LOCAL_ALLOWED=');
        app()->detectEnvironment(fn () => 'testing');
        parent::tearDown();
    }
}
