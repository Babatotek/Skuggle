<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

/**
 * Password policy must stay aligned with the UI (8+ mixed/number/symbol) in every environment.
 */
class PasswordRuleProbeTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_eight_char_password_registers_personal_space(): void
    {
        $this->seedAccessControl();
        Role::query()->firstOrCreate(['name' => 'teacher'], ['label' => 'Teacher', 'privileged' => false]);

        $this->postJson('/api/v1/individuals/register', [
            'accountType' => 'teacher',
            'firstName' => 'Debug',
            'lastName' => 'User',
            'email' => 'eight.personal.'.uniqid().'@example.com',
            'password' => 'Pass123!',
            'passwordConfirmation' => 'Pass123!',
        ], ['Idempotency-Key' => 'eight-char-personal-'.uniqid()])
            ->assertCreated()
            ->assertJsonPath('data.workspace', 'personal');
    }

    public function test_seven_char_password_is_rejected_for_personal_space(): void
    {
        $this->seedAccessControl();
        Role::query()->firstOrCreate(['name' => 'teacher'], ['label' => 'Teacher', 'privileged' => false]);

        $this->postJson('/api/v1/individuals/register', [
            'accountType' => 'teacher',
            'firstName' => 'Debug',
            'lastName' => 'User',
            'email' => 'seven.personal.'.uniqid().'@example.com',
            'password' => 'Pass12!',
            'passwordConfirmation' => 'Pass12!',
        ], ['Idempotency-Key' => 'seven-char-personal-'.uniqid()])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password'], 'error.fields');
    }

    public function test_eight_char_password_registers_school_space(): void
    {
        $this->seedAccessControl();

        $this->postJson('/api/v1/schools/register', [
            'schoolName' => 'Eight Char Academy',
            'adminName' => 'School Owner',
            'adminEmail' => 'eight.school.'.uniqid().'@example.com',
            'password' => 'Pass123!',
            'password_confirmation' => 'Pass123!',
        ], ['Idempotency-Key' => 'eight-char-school-'.uniqid()])
            ->assertCreated()
            ->assertJsonPath('data.requiresVerification', true);

        $this->assertDatabaseHas('tenants', ['name' => 'Eight Char Academy', 'type' => 'school']);
    }

    public function test_seven_char_password_is_rejected_for_school_space(): void
    {
        $this->seedAccessControl();

        $this->postJson('/api/v1/schools/register', [
            'schoolName' => 'Seven Char Academy',
            'adminName' => 'School Owner',
            'adminEmail' => 'seven.school.'.uniqid().'@example.com',
            'password' => 'Pass12!',
            'password_confirmation' => 'Pass12!',
        ], ['Idempotency-Key' => 'seven-char-school-'.uniqid()])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password'], 'error.fields');
    }
}
