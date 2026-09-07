<?php

namespace Tests\Architecture;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class WaveZeroSecurityArchitectureTest extends TestCase
{
    public function test_production_frontend_has_no_hard_coded_localhost_network_calls(): void
    {
        $root = dirname(__DIR__, 3).DIRECTORY_SEPARATOR.'src';
        $violations = [];
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root)) as $file) {
            if (! $file->isFile() || ! preg_match('/\.(?:ts|tsx|js|jsx)$/', $file->getFilename())) {
                continue;
            }
            $contents = file_get_contents($file->getPathname());
            if (preg_match('/(?:fetch|axios)\s*\([^\n]*(?:127\.0\.0\.1|localhost|:7364)/i', $contents)) {
                $violations[] = $file->getPathname();
            }
        }
        $this->assertSame([], $violations, 'Production localhost network calls: '.implode(', ', $violations));
    }

    public function test_p0_resource_families_have_tests_or_explicit_exceptions(): void
    {
        $map = json_decode(file_get_contents(__DIR__.'/resource-authorization-map.json'), true, flags: JSON_THROW_ON_ERROR);
        foreach ($map['families'] as $family) {
            if ($family['priority'] !== 'P0') {
                continue;
            }
            $this->assertTrue($family['tests'] !== [] || isset($family['exception']), $family['resource'].' lacks release evidence.');
        }
    }

    public function test_mapped_tenant_routes_keep_tenant_middleware(): void
    {
        $map = json_decode(file_get_contents(__DIR__.'/resource-authorization-map.json'), true, flags: JSON_THROW_ON_ERROR);
        $actual = collect(Route::getRoutes()->getRoutes())->keyBy(fn ($route) => $route->uri());
        foreach ($map['families'] as $family) {
            foreach ($family['routes'] as $uri) {
                if (! $actual->has($uri) || str_contains($uri, '/webhooks/')) {
                    continue;
                }
                $this->assertContains('tenant', $actual[$uri]->gatherMiddleware(), $uri.' lost tenant middleware.');
            }
        }
    }

    public function test_all_tenant_owned_api_routes_declare_tenant_context(): void
    {
        $globalPrefixes = ['api/v1/public/', 'api/v1/auth/', 'api/v1/fortify/', 'api/v1/webhooks/', 'api/v1/platform/', 'api/v1/schools/register', 'api/v1/individuals/register'];
        $globalExact = ['api/v1/invites/{token}', 'api/v1/invites/{token}/accept'];
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $uri = $route->uri();
            if (! str_starts_with($uri, 'api/v1/') || in_array($uri, $globalExact, true) || collect($globalPrefixes)->contains(fn (string $prefix) => str_starts_with($uri, $prefix))) {
                continue;
            }
            $this->assertContains('tenant', $route->gatherMiddleware(), $uri.' must declare tenant context or a reviewed global exception.');
        }
    }
}
