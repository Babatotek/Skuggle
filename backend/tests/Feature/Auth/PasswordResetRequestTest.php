<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_registered_email_receives_reset_link(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => strtoupper($user->email)])
            ->assertOk()
            ->assertJsonPath('data.message', 'A password reset link has been sent. Check your inbox and spam folder.');
    }

    public function test_unknown_email_returns_clear_error(): void
    {
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'missing@example.test'])
            ->assertNotFound()
            ->assertJsonPath('error.code', 'EMAIL_NOT_FOUND');
    }
}
