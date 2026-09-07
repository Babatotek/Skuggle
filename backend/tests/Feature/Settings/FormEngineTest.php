<?php

namespace Tests\Feature\Settings;

use App\Models\FieldDefinition;
use App\Models\FormDefinition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class FormEngineTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_admin_can_list_configurable_forms(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $response = $this->actingAsTenantUser($user, $tenant)
            ->getJson('/api/v1/forms');

        $response->assertOk();
        $response->assertJsonPath('data.groups.0.category', 'people');
        $response->assertJsonFragment(['key' => 'student.enrolment', 'name' => 'Student Enrolment']);
    }

    public function test_admin_can_add_field_from_template(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $response = $this->actingAsTenantUser($user, $tenant)
            ->postJson('/api/v1/forms/student.enrolment/fields', [
                'templateKey' => 'nin',
                'sectionKey' => 'government',
                'required' => true,
            ], ['Idempotency-Key' => (string) Str::uuid()]);

        $response->assertOk();
        $response->assertJsonPath('data.field.key', 'nin');

        $this->assertDatabaseHas('field_definitions', [
            'tenant_id' => $tenant->id,
            'field_key' => 'nin',
        ]);
    }

    public function test_admin_can_create_custom_field(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $response = $this->actingAsTenantUser($user, $tenant)
            ->postJson('/api/v1/forms/student.enrolment/fields', [
                'label' => 'House',
                'answerType' => 'choose_one',
                'options' => ['Red', 'Blue', 'Green'],
                'sectionKey' => 'additional',
                'required' => false,
            ], ['Idempotency-Key' => (string) Str::uuid()]);

        $response->assertOk();
        $response->assertJsonPath('data.field.label', 'House');
    }

    public function test_custom_field_values_are_tenant_isolated(): void
    {
        ['tenant' => $tenantA, 'user' => $userA] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );
        ['tenant' => $tenantB] = $this->makeTenantUser('school_super_admin');

        $this->actingAsTenantUser($userA, $tenantA)
            ->postJson('/api/v1/forms/student.enrolment/fields', [
                'templateKey' => 'nin',
                'sectionKey' => 'government',
            ], ['Idempotency-Key' => (string) Str::uuid()]);

        $this->assertSame(1, FieldDefinition::query()->where('tenant_id', $tenantA->id)->where('field_key', 'nin')->count());
        $this->assertSame(0, FieldDefinition::query()->where('tenant_id', $tenantB->id)->count());
    }

    public function test_legacy_custom_fields_api_still_works(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $response = $this->actingAsTenantUser($user, $tenant)
            ->putJson('/api/v1/custom-fields/student', [
                'fields' => [[
                    'key' => 'lga',
                    'label' => 'Local Government Area',
                    'type' => 'text',
                    'required' => true,
                    'section' => 'Government Information',
                ]],
            ], ['Idempotency-Key' => (string) Str::uuid()]);

        $response->assertOk();
        $response->assertJsonPath('data.fields.0.key', 'lga');

        $this->assertDatabaseHas('field_definitions', [
            'tenant_id' => $tenant->id,
            'field_key' => 'lga',
        ]);
    }

    public function test_student_registration_requires_configured_custom_fields(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $this->actingAsTenantUser($user, $tenant)
            ->postJson('/api/v1/forms/student.enrolment/fields', [
                'templateKey' => 'nin',
                'sectionKey' => 'government',
                'required' => true,
            ], ['Idempotency-Key' => (string) Str::uuid()]);

        $response = $this->actingAsTenantUser($user, $tenant)
            ->postJson('/api/v1/students', [
                'firstName' => 'Chioma',
                'lastName' => 'Eze',
                'gender' => 'female',
                'dateOfBirth' => '2015-01-01',
                'admissionDate' => now()->toDateString(),
                'classId' => '01INVALIDCLASSID000000',
                'guardians' => json_encode([['name' => 'Parent', 'relationship' => 'mother', 'phone' => '08000000000']]),
                'customFields' => [],
            ], ['Idempotency-Key' => 'student-create-form-engine-01']);

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->assertArrayHasKey('customFields.nin', $response->json('errors'));
    }

    public function test_form_bootstrap_is_per_tenant(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $this->actingAsTenantUser($user, $tenant)->getJson('/api/v1/forms/student.enrolment');

        $this->assertSame(1, FormDefinition::query()->where('tenant_id', $tenant->id)->where('form_key', 'student.enrolment')->count());
    }

    public function test_form_bootstrap_includes_protected_system_fields(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $response = $this->actingAsTenantUser($user, $tenant)->getJson('/api/v1/forms/student.enrolment');

        $response->assertOk();
        $response->assertJsonFragment([
            'key' => 'first_name',
            'label' => 'First Name',
            'lockLevel' => 'system_required',
            'systemMessage' => 'Required by Skuggle',
        ]);
    }

    public function test_nin_added_to_identity_is_returned_to_student_enrolment(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_super_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $this->actingAsTenantUser($user, $tenant)
            ->postJson('/api/v1/forms/student.enrolment/fields', [
                'templateKey' => 'nin',
                'sectionKey' => 'identity',
            ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertOk();

        $lookup = $this->actingAsTenantUser($user, $tenant)
            ->getJson('/api/v1/lookups/student-registration');

        $lookup->assertOk();
        $lookup->assertJsonFragment([
            'key' => 'nin',
            'section' => 'Identity',
            'showOnRegistration' => true,
        ]);
    }
}
