<?php

namespace Tests\Feature\Tenancy;

use App\Domain\Tenancy\TenantContext;
use App\Domain\Tenancy\TenantJobEnvelope;
use App\Http\Middleware\ResolveTenant;
use App\Support\TenantCacheKey;
use App\Support\TenantStoragePath;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use LogicException;
use RuntimeException;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class WaveThreeTenantContextTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_context_is_immutable_until_explicitly_cleared(): void
    {
        $a = $this->makeTenantUser();
        $b = $this->makeTenantUser();
        $context = app(TenantContext::class);
        $context->set($a['tenant'], $a['membership'], 'correlation-a');

        $this->expectException(LogicException::class);
        $context->set($b['tenant'], $b['membership'], 'correlation-b');
    }

    public function test_job_envelope_restores_and_clears_sequential_tenant_contexts(): void
    {
        $a = $this->makeTenantUser();
        $b = $this->makeTenantUser();
        $context = app(TenantContext::class);

        foreach ([$a, $b] as $index => $fixture) {
            $context->clear();
            $context->set($fixture['tenant'], $fixture['membership'], 'job-'.$index);
            $payload = TenantJobEnvelope::fromContext($context)->toArray();
            $context->clear();

            TenantJobEnvelope::fromArray($payload)->activate($context);
            $this->assertSame($fixture['tenant']->getKey(), $context->tenantId());
            $this->assertSame($fixture['membership']->getKey(), $context->membershipId());
            $context->clear();
            $this->assertFalse($context->hasTenant());
        }
    }

    public function test_job_envelope_rejects_a_revoked_membership(): void
    {
        $fixture = $this->makeTenantUser();
        $context = app(TenantContext::class);
        $context->set($fixture['tenant'], $fixture['membership'], 'job-revoked');
        $payload = TenantJobEnvelope::fromContext($context)->toArray();
        $context->clear();
        $fixture['membership']->update(['status' => 'revoked']);

        $this->expectException(RuntimeException::class);
        TenantJobEnvelope::fromArray($payload)->activate($context);
    }

    public function test_cache_and_storage_namespaces_are_tenant_specific(): void
    {
        $a = $this->makeTenantUser();
        $b = $this->makeTenantUser();
        $context = app(TenantContext::class);
        $keys = [];
        $paths = [];

        foreach ([$a, $b] as $fixture) {
            $context->clear();
            $context->set($fixture['tenant'], $fixture['membership'], 'namespace-test');
            $keys[] = app(TenantCacheKey::class)->make('students.list', ['term' => 1]);
            $paths[] = app(TenantStoragePath::class)->private('students', 'document-1', 'record.pdf');
        }

        $this->assertNotSame($keys[0], $keys[1]);
        $this->assertNotSame($paths[0], $paths[1]);
        $this->assertStringContainsString(':v2:', $keys[0]);
        $this->assertStringContainsString('/private/', $paths[0]);
    }

    public function test_header_cannot_override_authenticated_session_tenant(): void
    {
        $a = $this->makeTenantUser();
        $b = $this->makeTenantUser();
        $b['membership']->update(['user_id' => $a['user']->getKey()]);

        $request = Request::create('/api/v1/auth/me', 'GET', server: ['HTTP_X_TENANT_ID' => (string) $b['tenant']->public_id]);
        $session = app('session')->driver();
        $session->put('tenant_public_id', $a['tenant']->public_id);
        $request->setLaravelSession($session);
        $request->setUserResolver(fn () => $a['user']);

        $response = app(ResolveTenant::class)->handle($request, fn () => response()->json(['unexpected' => true]));

        $this->assertSame(403, $response->getStatusCode());
        $this->assertStringContainsString('TENANT_CONTEXT_MISMATCH', (string) $response->getContent());
    }
}
