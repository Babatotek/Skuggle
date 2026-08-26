<?php

namespace Tests\Unit\Database;

use App\Domain\Tenancy\TenantContext;
use App\Models\LibraryResource;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NormalizeLibraryResourceSectionsTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function migration_creates_library_resource_sections_table(): void
    {
        $this->assertTrue(Schema::hasTable('library_resource_sections'));
    }

    #[Test]
    public function table_has_expected_columns(): void
    {
        foreach (['tenant_id', 'library_resource_id', 'section_key', 'title', 'content', 'sort_order', 'meta'] as $column) {
            $this->assertTrue(
                Schema::hasColumn('library_resource_sections', $column),
                "Missing column: {$column}"
            );
        }
    }

    #[Test]
    public function backfill_copies_json_sections_into_normalized_rows(): void
    {
        [$tenantId, $resourceId] = $this->seedResourceWithJsonSections([
            ['id' => 's1', 'title' => 'Intro', 'content' => 'Hello world'],
            ['id' => 's2', 'title' => 'Practice', 'content' => 'Solve x'],
        ]);

        // Simulate migration backfill for this resource
        DB::table('library_resource_sections')->insert([
            [
                'tenant_id' => $tenantId,
                'library_resource_id' => $resourceId,
                'section_key' => 's1',
                'title' => 'Intro',
                'content' => 'Hello world',
                'sort_order' => 0,
                'meta' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $tenantId,
                'library_resource_id' => $resourceId,
                'section_key' => 's2',
                'title' => 'Practice',
                'content' => 'Solve x',
                'sort_order' => 1,
                'meta' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $rows = DB::table('library_resource_sections')
            ->where('library_resource_id', $resourceId)
            ->orderBy('sort_order')
            ->get();

        $this->assertCount(2, $rows);
        $this->assertSame('s1', $rows[0]->section_key);
        $this->assertSame('Intro', $rows[0]->title);
        $this->assertSame('s2', $rows[1]->section_key);
    }

    #[Test]
    public function model_resolved_sections_prefers_normalized_rows(): void
    {
        [$tenantId, $resourceId] = $this->seedResourceWithJsonSections([
            ['id' => 'legacy', 'title' => 'Legacy', 'content' => 'old'],
        ]);

        DB::table('library_resource_sections')->insert([
            'tenant_id' => $tenantId,
            'library_resource_id' => $resourceId,
            'section_key' => 'norm',
            'title' => 'Normalized',
            'content' => 'new',
            'sort_order' => 0,
            'meta' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $context = app(TenantContext::class);
        $tenant = Tenant::query()->findOrFail($tenantId);
        $context->setPublicTenant($tenant);

        try {
            $resource = LibraryResource::query()->findOrFail($resourceId);
            $sections = $resource->resolvedSections();

            $this->assertCount(1, $sections);
            $this->assertSame('norm', $sections[0]['id']);
            $this->assertSame('Normalized', $sections[0]['title']);
        } finally {
            $context->clear();
        }
    }

    /**
     * @param  list<array{id: string, title: string, content: string}>  $sections
     * @return array{0: int, 1: int}
     */
    private function seedResourceWithJsonSections(array $sections): array
    {
        $tenantId = DB::table('tenants')->insertGetId([
            'public_id' => strtoupper(uniqid('01T')),
            'name' => 'Section School',
            'slug' => 'section-school-'.uniqid(),
            'code' => 'SC'.strtoupper(substr(uniqid(), -6)),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $userId = DB::table('users')->insertGetId([
            'public_id' => strtoupper(uniqid('01U')),
            'name' => 'Author',
            'email' => 'author-'.uniqid().'@example.com',
            'password' => bcrypt('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $resourceId = DB::table('library_resources')->insertGetId([
            'tenant_id' => $tenantId,
            'public_id' => strtoupper(uniqid('01R')),
            'slug' => 'resource-'.uniqid(),
            'title' => 'Algebra Basics',
            'resource_type' => 'lesson',
            'access_tier' => 'free',
            'source_label' => 'internal',
            'licence_name' => 'All rights reserved',
            'sections' => json_encode($sections, JSON_THROW_ON_ERROR),
            'created_by' => $userId,
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$tenantId, $resourceId];
    }
}
