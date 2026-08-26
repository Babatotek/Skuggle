<?php

namespace Tests\Feature\Security;

use App\Domain\Tenancy\TenantContext;
use App\Http\Middleware\EnforceTenantQuota;
use App\Models\AiRequest;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class AiQuotaAndIdempotencyTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_ai_daily_quota_is_enforced(): void
    {
        ['tenant' => $tenant, 'user' => $user, 'membership' => $membership] = $this->makeTenantUser('teacher', [
            'quota_limits' => ['ai_requests_per_day' => 1, 'students' => 1000, 'storage_bytes' => 1000],
        ]);

        $context = app(TenantContext::class);
        $context->set($tenant, $membership);
        try {
            AiRequest::query()->create([
                'user_id' => $user->getKey(),
                'provider' => 'none',
                'operation' => 'library_assistant',
                'status' => 'completed',
                'prompt_hash' => hash('sha256', 'x'),
                'model' => 'none',
            ]);
        } finally {
            $context->clear();
        }

        $context->set($tenant, $membership);
        try {
            $middleware = app(EnforceTenantQuota::class);
            $request = Request::create('/api/v1/library/resources/x/assistant', 'POST');
            $request->setUserResolver(fn () => $user);

            $response = $middleware->handle($request, fn () => response('ok'), 'ai_requests_per_day');
            $this->assertSame(429, $response->getStatusCode());
        } finally {
            $context->clear();
        }
    }

    public function test_idempotency_key_is_required_for_registration(): void
    {
        $response = $this->postJson('/api/v1/individuals/register', [
            'name' => 'Learner One',
            'email' => 'learner@example.com',
            'password' => 'Password1!abc',
            'passwordConfirmation' => 'Password1!abc',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'IDEMPOTENCY_KEY_REQUIRED');
    }

    public function test_idempotency_replay_returns_same_response(): void
    {
        $this->seedAccessControl();
        // Ensure student/parent roles exist for individual registration.
        foreach (['student', 'parent'] as $roleName) {
            Role::query()->firstOrCreate(
                ['name' => $roleName],
                ['label' => $roleName, 'privileged' => false],
            );
        }

        $payload = [
            'accountType' => 'parent',
            'firstName' => 'Learner',
            'lastName' => 'Two',
            'email' => 'learner2@example.com',
            'password' => 'Password1!abc',
            'passwordConfirmation' => 'Password1!abc',
        ];
        $headers = ['Idempotency-Key' => 'idempotency-replay-key-01'];

        $first = $this->postJson('/api/v1/individuals/register', $payload, $headers);
        $second = $this->postJson('/api/v1/individuals/register', $payload, $headers);

        $first->assertSuccessful();
        $second->assertSuccessful();
        $this->assertSame($first->getContent(), $second->getContent());
        $this->assertSame('true', $second->headers->get('X-Idempotent-Replay'));
    }
}
