<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_health_live_endpoint_is_ok(): void
    {
        $response = $this->getJson('/live');

        $response->assertOk();
        $response->assertJsonPath('status', 'alive');
    }
}
