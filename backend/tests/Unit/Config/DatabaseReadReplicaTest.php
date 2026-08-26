<?php

namespace Tests\Unit\Config;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DatabaseReadReplicaTest extends TestCase
{
    #[Test]
    public function mysql_connection_has_read_write_keys(): void
    {
        $config = require config_path('database.php');
        $mysql  = $config['connections']['mysql'];

        $this->assertArrayHasKey('write', $mysql,
            'mysql connection must define a write key for read/write splitting');
        $this->assertArrayHasKey('sticky', $mysql,
            'mysql connection must define sticky to prevent stale reads after writes');
    }

    #[Test]
    public function read_array_is_null_when_no_replica_env_vars_set(): void
    {
        // In test environment DB_READ_HOST is unset — read key should be null
        // so Laravel falls back to the write host (single-node mode)
        putenv('DB_READ_HOST=');
        putenv('DB_READ_HOST_2=');

        $config = require config_path('database.php');
        $read   = $config['connections']['mysql']['read'];

        // null means "no read array" = single-node, Laravel uses write for all
        $this->assertNull($read,
            'When no replica env vars are set, read key must be null (single-node fallback)');
    }

    #[Test]
    public function read_array_contains_one_entry_when_single_replica_configured(): void
    {
        putenv('DB_READ_HOST=replica-1.internal');
        putenv('DB_READ_HOST_2=');

        $config = require config_path('database.php');
        $read   = $config['connections']['mysql']['read'];

        $this->assertIsArray($read,
            'read key should be an array when DB_READ_HOST is set');
        $this->assertCount(1, $read,
            'one replica env var should produce one read entry');
        $this->assertSame('replica-1.internal', $read[0]['host']);
    }

    #[Test]
    public function read_array_contains_two_entries_when_two_replicas_configured(): void
    {
        putenv('DB_READ_HOST=replica-1.internal');
        putenv('DB_READ_HOST_2=replica-2.internal');

        $config = require config_path('database.php');
        $read   = $config['connections']['mysql']['read'];

        $this->assertIsArray($read);
        $this->assertCount(2, $read,
            'two replica env vars should produce two read entries for load-balancing');
        $this->assertSame('replica-1.internal', $read[0]['host']);
        $this->assertSame('replica-2.internal', $read[1]['host']);
    }

    #[Test]
    public function sticky_is_true_by_default(): void
    {
        // Remove the var entirely so env() uses the default
        putenv('DB_STICKY');

        $config = require config_path('database.php');
        $sticky = $config['connections']['mysql']['sticky'];

        $this->assertTrue((bool) $sticky,
            'sticky must default to true to prevent dirty reads after writes in the same request');
    }

    #[Test]
    public function env_example_documents_read_replica_vars(): void
    {
        $example = file_get_contents(base_path('.env.example'));

        $this->assertStringContainsString('DB_READ_HOST', $example,
            '.env.example must document DB_READ_HOST for read replica setup');
        $this->assertStringContainsString('DB_STICKY', $example,
            '.env.example must document DB_STICKY');
    }

    protected function tearDown(): void
    {
        putenv('DB_READ_HOST=');
        putenv('DB_READ_HOST_2=');
        putenv('DB_STICKY=');
        parent::tearDown();
    }
}
