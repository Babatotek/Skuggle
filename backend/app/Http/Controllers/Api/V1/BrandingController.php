<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use App\Support\TenantStoragePath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class BrandingController extends Controller
{
    public function uploadLogo(Request $request, TenantContext $context, AuditLogger $audit, TenantStoragePath $paths): JsonResponse
    {
        $data = $request->validate([
            'logo' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048', 'dimensions:max_width=2048,max_height=2048'],
        ]);
        $tenant = $context->tenant();
        $logo = $data['logo'];
        $path = $paths->public('branding', 'logo', 'logo-'.Str::uuid().'.'.$logo->extension());
        Storage::disk('public')->putFileAs(dirname($path), $logo, basename($path), ['visibility' => 'public']);
        $before = $tenant->settings ?? [];
        $settings = $before;
        $url = Storage::disk('public')->url($path);
        $oldKey = (string) data_get($settings, 'branding.logo_key', '');
        data_set($settings, 'branding.logo_url', $url);
        data_set($settings, 'branding.logo_key', $path);
        data_set($settings, 'branding.logo_classification', 'public_tenant_branding');
        data_set($settings, 'branding.logo_uploaded_by', $context->actorId());
        data_set($settings, 'branding.logo_checksum', hash_file('sha256', $logo->getRealPath()));
        $tenant->update(['settings' => $settings]);
        $tenantPrefix = 'tenants/'.$tenant->public_id.'/public/branding/logo/';
        if ($oldKey !== '' && str_starts_with($oldKey, $tenantPrefix) && $oldKey !== $path) {
            Storage::disk('public')->delete($oldKey);
        }
        $audit->record('tenant.branding.logo_uploaded', $tenant, $before, $settings);

        return ApiResponse::success(['logoUrl' => $url, 'message' => 'School logo uploaded.']);
    }

    public function update(Request $request, TenantContext $context, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'schoolName' => ['sometimes', 'string', 'max:180'], 'motto' => ['nullable', 'string', 'max:180'],
            'primaryColor' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'], 'secondaryColor' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'logoUrl' => ['nullable', 'url', 'max:2048'], 'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:120'], 'state' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email:rfc', 'max:254'], 'phone' => ['nullable', 'string', 'max:32'],
        ]);
        $tenant = $context->tenant();
        $before = $tenant->settings ?? [];
        $settings = $before;
        foreach (['motto', 'address', 'city', 'state'] as $key) {
            if (array_key_exists($key, $data)) {
                data_set($settings, "profile.{$key}", $data[$key]);
            }
        }
        foreach (['email', 'phone'] as $key) {
            if (array_key_exists($key, $data)) {
                data_set($settings, "contact.{$key}", $data[$key]);
            }
        }
        foreach (['primaryColor' => 'primary_colour', 'secondaryColor' => 'secondary_colour', 'logoUrl' => 'logo_url'] as $input => $key) {
            if (array_key_exists($input, $data)) {
                data_set($settings, "branding.{$key}", $data[$input]);
            }
        }
        $tenant->update(['name' => $data['schoolName'] ?? $tenant->name, 'settings' => $settings]);
        $audit->record('tenant.branding.updated', $tenant, $before, $settings);

        return ApiResponse::success(['message' => 'School branding saved.', 'settings' => $settings]);
    }
}
