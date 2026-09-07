<?php

namespace Tests\Architecture;

use App\Domain\Authorization\PermissionRegistry;
use Tests\TestCase;

final class WaveFourPermissionRegistryArchitectureTest extends TestCase
{
    public function test_route_permission_literals_are_registered_legacy_or_canonical_keys(): void
    {
        $source = file_get_contents(base_path('routes/api.php'));
        preg_match_all('/permission:([a-z0-9_.-]+)/', $source, $matches);
        foreach (array_unique($matches[1]) as $permission) {
            $this->assertNotNull(PermissionRegistry::canonicalFor($permission), 'Unknown route permission: '.$permission);
        }
    }

    public function test_alias_metadata_is_owned_versioned_and_has_a_removal_wave(): void
    {
        foreach (PermissionRegistry::aliasDefinitions() as $legacy => $metadata) {
            $this->assertNotEmpty($metadata['owner'], $legacy.' lacks an owner.');
            $this->assertGreaterThan(0, $metadata['introducedVersion']);
            $this->assertGreaterThan(PermissionRegistry::VERSION, $metadata['removalWave']);
            $this->assertCount(1, $metadata['targets'], $legacy.' may not expand implicitly.');
        }
    }

    public function test_school_super_admin_excludes_every_platform_alias(): void
    {
        $schoolSource = file_get_contents(app_path('Domain/Identity/SchoolRoles.php'));
        foreach (PermissionRegistry::definitions() as $key => $definition) {
            if (! str_starts_with($key, 'platform.')) {
                continue;
            }
            foreach ($definition['aliases'] as $alias) {
                $this->assertStringContainsString("'{$alias}'", $schoolSource);
            }
        }
    }
}
