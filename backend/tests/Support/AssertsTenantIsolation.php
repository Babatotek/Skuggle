<?php

namespace Tests\Support;

use Illuminate\Testing\TestResponse;

trait AssertsTenantIsolation
{
    /**
     * Reusable BOLA contract for a tenant-owned endpoint family.
     * Callbacks must issue the request for the named scenario and return TestResponse.
     *
     * @param  array{authorized: callable(): TestResponse, unauthorized: callable(): TestResponse, foreign: callable(): TestResponse, inactive: callable(): TestResponse, missing: callable(): TestResponse, override: callable(): TestResponse}  $requests
     */
    protected function assertTenantIsolationMatrix(array $requests): void
    {
        $requests['authorized']()->assertSuccessful();
        $requests['unauthorized']()->assertForbidden();
        $requests['foreign']()->assertNotFound();
        $requests['inactive']()->assertForbidden();
        $requests['missing']()->assertNotFound();
        $override = $requests['override']();
        $this->assertContains($override->status(), [403, 404], 'A payload/header tenant override must fail safely.');
    }

    protected function assertSafeAuthorizationFailure(TestResponse $response): void
    {
        $this->assertContains($response->status(), [403, 404]);
        $response->assertDontSee('SQLSTATE')->assertDontSee('Stack trace')->assertDontSee('vendor/');
    }
}
