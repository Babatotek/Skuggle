<?php

namespace Tests\Feature\Settings;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

class CustomFieldTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_school_admin_can_save_student_custom_fields(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $response = $this->actingAsTenantUser($user, $tenant)
            ->putJson('/api/v1/custom-fields/student', [
                'fields' => [
                    [
                        'key' => 'lga',
                        'label' => 'Local Government Area',
                        'type' => 'text',
                        'required' => true,
                        'section' => 'Location',
                    ],
                    [
                        'key' => 'blood_group',
                        'label' => 'Blood Group',
                        'type' => 'select',
                        'required' => false,
                        'options' => ['A+', 'O+', 'B+'],
                    ],
                ],
            ], ['Idempotency-Key' => 'custom-fields-student-01']);

        $response->assertOk();
        $response->assertJsonPath('data.fields.0.key', 'lga');
        $response->assertJsonPath('data.fields.1.key', 'blood_group');

        $tenant->refresh();
        $this->assertSame('lga', data_get($tenant->settings, 'registration.custom_fields.students.0.key'));
    }

    public function test_student_registration_requires_configured_custom_fields(): void
    {
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser(
            'school_admin',
            userOverrides: ['two_factor_confirmed_at' => now()],
        );

        $this->actingAsTenantUser($user, $tenant)
            ->putJson('/api/v1/custom-fields/student', [
                'fields' => [[
                    'key' => 'nin',
                    'label' => 'National ID Number',
                    'type' => 'text',
                    'required' => true,
                ]],
            ], ['Idempotency-Key' => 'custom-fields-student-02']);

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
            ], ['Idempotency-Key' => 'student-create-custom-01']);

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->assertArrayHasKey('customFields.nin', $response->json('errors'));
    }
}
