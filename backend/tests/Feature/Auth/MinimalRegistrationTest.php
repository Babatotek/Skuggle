<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
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
            'password' => 'Pass123!',
            'passwordConfirmation' => 'Pass123!',
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
            'password' => 'Pass123!', 'passwordConfirmation' => 'Pass123!',
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
            'password' => 'Pass123!',
            'password_confirmation' => 'Pass123!',
        ], ['Idempotency-Key' => 'minimal-school-registration'])
            ->assertCreated()
            ->assertJsonPath('data.requiresVerification', true);

        $this->assertDatabaseHas('tenants', ['name' => 'New Academy', 'type' => 'school']);
    }

    public function test_verified_school_admin_logs_into_the_requested_school_workspace(): void
    {
        Notification::fake();
        $this->seedAccessControl();

        $this->postJson('/api/v1/schools/register', [
            'schoolName' => 'Flow Academy',
            'adminName' => 'Flow Owner',
            'adminEmail' => 'owner@flow-academy.example',
            'password' => 'Pass123!',
            'password_confirmation' => 'Pass123!',
        ], ['Idempotency-Key' => 'school-onboarding-flow'])
            ->assertCreated();

        $user = User::query()->where('email', 'owner@flow-academy.example')->firstOrFail();
        $user->markEmailAsVerified();
        $school = Tenant::query()->where('name', 'Flow Academy')->firstOrFail();

        $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/',
        ])->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Pass123!',
            'tenant' => $school->slug,
        ])
            ->assertOk()
            ->assertJsonPath('data.user.role', 'school_admin')
            ->assertJsonPath('data.user.tenant.type', 'school')
            ->assertJsonPath('data.user.tenant.id', $school->public_id);
    }
}
