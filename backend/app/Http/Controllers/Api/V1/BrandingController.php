<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BrandingController extends Controller
{
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
