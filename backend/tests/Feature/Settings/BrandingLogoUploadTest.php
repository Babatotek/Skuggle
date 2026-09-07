<?php

namespace Tests\Feature\Settings;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Support\CreatesTenantUsers;
use Tests\TestCase;

final class BrandingLogoUploadTest extends TestCase
{
    use CreatesTenantUsers;
    use RefreshDatabase;

    public function test_authorized_school_admin_can_upload_a_tenant_scoped_logo(): void
    {
        Storage::fake('public');
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_super_admin', userOverrides: ['two_factor_confirmed_at' => now()]);

        $response = $this->actingAsTenantUser($user, $tenant)->postJson('/api/v1/settings/branding/logo', [
            'logo' => UploadedFile::fake()->image('crest.png', 512, 512),
        ], ['Idempotency-Key' => 'branding-logo-upload-1']);

        $response->assertOk()->assertJsonStructure(['data' => ['logoUrl']]);
        $tenant->refresh();
        $logoUrl = data_get($tenant->settings, 'branding.logo_url');
        $this->assertIsString($logoUrl);
        $this->assertStringStartsWith('/storage/tenants/'.$tenant->public_id.'/public/branding/logo/logo-', $logoUrl);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $logoUrl));
        $tenant->refresh();
        $this->assertSame('public_tenant_branding', data_get($tenant->settings, 'branding.logo_classification'));
        $this->assertNotEmpty(data_get($tenant->settings, 'branding.logo_checksum'));
    }

    public function test_logo_upload_rejects_non_images(): void
    {
        Storage::fake('public');
        ['tenant' => $tenant, 'user' => $user] = $this->makeTenantUser('school_super_admin', userOverrides: ['two_factor_confirmed_at' => now()]);

        $this->actingAsTenantUser($user, $tenant)->postJson('/api/v1/settings/branding/logo', [
            'logo' => UploadedFile::fake()->create('payload.txt', 10, 'text/plain'),
        ], ['Idempotency-Key' => 'branding-logo-upload-invalid'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('logo');
    }
}
