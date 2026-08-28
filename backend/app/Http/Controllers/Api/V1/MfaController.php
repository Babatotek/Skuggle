<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Actions\ConfirmTwoFactorAuthentication;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;

class MfaController extends Controller
{
    public function status(Request $request, TenantContext $context): JsonResponse
    {
        $user = $request->user();
        $privileged = $context->hasTenant() && (bool) $context->membership()->role->privileged;
        $policyEnabled = $context->hasTenant() && (bool) data_get(
            $context->membership()->tenant->settings,
            'security.require_mfa_for_privileged_roles',
            false,
        );

        return ApiResponse::success([
            'privileged' => $privileged,
            'enabled' => filled($user->two_factor_secret),
            'confirmed' => filled($user->two_factor_confirmed_at),
            'policyEnabled' => $policyEnabled,
            'required' => $privileged && $policyEnabled,
        ]);
    }

    public function updatePolicy(Request $request, TenantContext $context): JsonResponse
    {
        $data = $request->validate([
            'requireForPrivilegedRoles' => ['required', 'boolean'],
        ]);

        $tenant = $context->membership()->tenant;
        $settings = $tenant->settings ?? [];
        data_set($settings, 'security.require_mfa_for_privileged_roles', $data['requireForPrivilegedRoles']);
        $tenant->update(['settings' => $settings]);

        return ApiResponse::success([
            'policyEnabled' => (bool) $data['requireForPrivilegedRoles'],
            'message' => $data['requireForPrivilegedRoles']
                ? 'MFA is now required for privileged school roles.'
                : 'MFA remains available but is no longer required by this school.',
        ]);
    }

    public function enable(Request $request, EnableTwoFactorAuthentication $enable): JsonResponse
    {
        $enable($request->user());

        $user = $request->user()->fresh();

        return ApiResponse::success([
            'enabled' => true,
            'confirmed' => filled($user->two_factor_confirmed_at),
            'qrCodeSvg' => $user->twoFactorQrCodeSvg(),
            'setupKey' => decrypt($user->two_factor_secret),
            'recoveryCodes' => $user->recoveryCodes(),
        ]);
    }

    public function confirm(Request $request, ConfirmTwoFactorAuthentication $confirm): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:20'],
        ]);

        try {
            $confirm($request->user(), $data['code']);
        } catch (ValidationException $exception) {
            return ApiResponse::error('INVALID_MFA_CODE', 'The authentication code is invalid or expired.', 422);
        }

        return ApiResponse::success([
            'confirmed' => true,
            'recoveryCodes' => $request->user()->fresh()->recoveryCodes(),
        ]);
    }

    public function recoveryCodes(Request $request, GenerateNewRecoveryCodes $generate): JsonResponse
    {
        if (! $request->user()->two_factor_confirmed_at) {
            return ApiResponse::error('MFA_NOT_CONFIRMED', 'Confirm multi-factor authentication first.', 422);
        }

        $generate($request->user());

        return ApiResponse::success([
            'recoveryCodes' => $request->user()->fresh()->recoveryCodes(),
        ]);
    }

    public function disable(Request $request, DisableTwoFactorAuthentication $disable): JsonResponse
    {
        $disable($request->user());

        return ApiResponse::success(['enabled' => false, 'confirmed' => false]);
    }

    public function qrCode(Request $request, TwoFactorAuthenticationProvider $provider): JsonResponse
    {
        $user = $request->user();
        if (! $user->two_factor_secret) {
            return ApiResponse::error('MFA_NOT_ENABLED', 'Enable multi-factor authentication first.', 422);
        }

        return ApiResponse::success([
            'qrCodeSvg' => $user->twoFactorQrCodeSvg(),
            'setupKey' => decrypt($user->two_factor_secret),
        ]);
    }
}
