<?php

namespace Tests\Unit\Deploy;

use App\Support\MigrationSafetyClassifier;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MigrationSafetyClassifierTest extends TestCase
{
    #[Test]
    public function additive_up_method_is_safe(): void
    {
        $path = $this->writeMigration(<<<'PHP'
        <?php
        return new class {
            public function up(): void
            {
                Schema::create('widgets', function ($table) {
                    $table->id();
                    $table->string('name')->nullable();
                });
            }

            public function down(): void
            {
                Schema::dropIfExists('widgets');
            }
        };
        PHP);

        $report = (new MigrationSafetyClassifier)->classifyFile($path);

        $this->assertSame(MigrationSafetyClassifier::SAFE, $report['level']);
        $this->assertSame([], $report['hits']);
    }

    #[Test]
    public function drop_column_in_up_is_destructive(): void
    {
        $path = $this->writeMigration(<<<'PHP'
        <?php
        return new class {
            public function up(): void
            {
                Schema::table('users', function ($table) {
                    $table->dropColumn('legacy_flag');
                });
            }

            public function down(): void
            {
                Schema::table('users', function ($table) {
                    $table->boolean('legacy_flag')->nullable();
                });
            }
        };
        PHP);

        $report = (new MigrationSafetyClassifier)->classifyFile($path);

        $this->assertSame(MigrationSafetyClassifier::DESTRUCTIVE, $report['level']);
        $this->assertContains('dropColumn', $report['hits']);
    }

    #[Test]
    public function change_in_up_is_caution(): void
    {
        $path = $this->writeMigration(<<<'PHP'
        <?php
        return new class {
            public function up(): void
            {
                Schema::table('users', function ($table) {
                    $table->string('name', 191)->change();
                });
            }

            public function down(): void {}
        };
        PHP);

        $report = (new MigrationSafetyClassifier)->classifyFile($path);

        $this->assertSame(MigrationSafetyClassifier::CAUTION, $report['level']);
        $this->assertContains('change', $report['hits']);
    }

    #[Test]
    public function existing_repository_migrations_are_not_destructive_in_up(): void
    {
        $reports = (new MigrationSafetyClassifier)->classifyDirectory(database_path('migrations'));
        $this->assertNotEmpty($reports);

        $destructive = array_values(array_filter(
            $reports,
            fn (array $report) => $report['level'] === MigrationSafetyClassifier::DESTRUCTIVE
        ));

        $this->assertSame(
            [],
            array_column($destructive, 'name'),
            'New drop/rename work belongs in a later contract release, not in up() of a compatibility migration.'
        );
    }

    #[Test]
    public function safety_check_command_passes_for_current_schema(): void
    {
        $this->artisan('migrate:safety-check')->assertSuccessful();
    }

    private function writeMigration(string $source): string
    {
        $path = sys_get_temp_dir().DIRECTORY_SEPARATOR.'skuggle_mig_'.uniqid('', true).'.php';
        file_put_contents($path, $source);
        $this->beforeApplicationDestroyed(static fn () => @unlink($path));

        return $path;
    }
}
