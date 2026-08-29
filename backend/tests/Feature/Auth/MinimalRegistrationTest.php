<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class MinimalRegistrationTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_minor_student_registers_with_required_guardian_details(): void
    {
        $this->seedAccessControl();
        Role::query()->firstOrCreate(['name' => 'student'], ['label' => 'Student', 'privileged' => false]);

        $this->postJson('/api/v1/individuals/register', [
            'accountType' => 'student',
            'firstName' => 'New',
            'lastName' => 'Learner',
            'email' => 'new.learner@example.com',
            'birthDate' => now()->subYears(14)->toDateString(),
            'guardianName' => 'Parent Learner',
            'guardianEmail' => 'parent.learner@example.com',
            'password' => 'StrongPassword1!',
            'passwordConfirmation' => 'StrongPassword1!',
        ], ['Idempotency-Key' => 'minimal-student-registration'])
            ->assertCreated()
            ->assertJsonPath('data.workspace', 'personal');
    }

    public function test_minor_student_cannot_register_without_guardian_details(): void
    {
        $this->seedAccessControl();
        Role::query()->firstOrCreate(['name' => 'student'], ['label' => 'Student', 'privileged' => false]);

        $this->postJson('/api/v1/individuals/register', [
            'accountType' => 'student', 'firstName' => 'Minor', 'lastName' => 'Learner',
            'email' => 'minor@example.com', 'birthDate' => now()->subYears(14)->toDateString(),
            'password' => 'StrongPassword1!', 'passwordConfirmation' => 'StrongPassword1!',
        ], ['Idempotency-Key' => 'minor-without-guardian'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['guardianName', 'guardianEmail'], 'error.fields');
    }

    public function test_school_can_register_with_essential_account_details_only(): void
    {
        $this->seedAccessControl();

        $this->postJson('/api/v1/schools/register', [
            'schoolName' => 'New Academy',
            'adminName' => 'School Owner',
            'adminEmail' => 'owner@new-academy.example',
            'password' => 'StrongPassword1!',
            'password_confirmation' => 'StrongPassword1!',
        ], ['Idempotency-Key' => 'minimal-school-registration'])
            ->assertCreated()
            ->assertJsonPath('data.requiresVerification', true);

        $this->assertDatabaseHas('tenants', ['name' => 'New Academy', 'type' => 'school']);
    }
}
