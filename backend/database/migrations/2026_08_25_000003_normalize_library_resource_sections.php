<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Normalize library_resources.sections (LONGTEXT JSON) into a dedicated table.
 *
 * Why: loading multi-100KB JSON blobs on every resource list/show inflates memory
 * and prevents indexing individual section titles. The JSON column is retained
 * temporarily for dual-read compatibility; drop it in a later migration after
 * application code fully uses the relation.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_resource_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('library_resource_id')->constrained('library_resources')->cascadeOnDelete();
            $table->string('section_key', 120);
            $table->string('title', 220);
            $table->longText('content');
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(
                ['library_resource_id', 'section_key'],
                'library_resource_sections_resource_key_uq'
            );
            $table->index(
                ['tenant_id', 'library_resource_id', 'sort_order'],
                'library_resource_sections_tenant_resource_order_idx'
            );
        });

        $this->backfillFromJson();
    }

    public function down(): void
    {
        Schema::dropIfExists('library_resource_sections');
    }

    private function backfillFromJson(): void
    {
        if (! Schema::hasColumn('library_resources', 'sections')) {
            return;
        }

        DB::table('library_resources')
            ->select(['id', 'tenant_id', 'sections'])
            ->orderBy('id')
            ->chunkById(100, function ($rows): void {
                $inserts = [];
                $now = now();

                foreach ($rows as $row) {
                    $sections = json_decode((string) $row->sections, true);
                    if (! is_array($sections) || $sections === []) {
                        continue;
                    }

                    foreach (array_values($sections) as $index => $section) {
                        if (! is_array($section)) {
                            continue;
                        }

                        $key = (string) ($section['id'] ?? ('section-'.($index + 1)));
                        $title = (string) ($section['title'] ?? 'Untitled');
                        $content = (string) ($section['content'] ?? '');

                        $meta = $section;
                        unset($meta['id'], $meta['title'], $meta['content']);

                        $inserts[] = [
                            'tenant_id' => $row->tenant_id,
                            'library_resource_id' => $row->id,
                            'section_key' => mb_substr($key, 0, 120),
                            'title' => mb_substr($title, 0, 220),
                            'content' => $content,
                            'sort_order' => $index,
                            'meta' => $meta === [] ? null : json_encode($meta, JSON_THROW_ON_ERROR),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                if ($inserts !== []) {
                    foreach (array_chunk($inserts, 200) as $chunk) {
                        DB::table('library_resource_sections')->insert($chunk);
                    }
                }
            });
    }
};
