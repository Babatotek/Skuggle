<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Notifications\ContactInquiryNotification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

final class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fullName' => ['required', 'string', 'max:180'],
            'workEmail' => ['required', 'email:rfc', 'max:254'],
            'schoolName' => ['nullable', 'string', 'max:180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $key = 'contact-inquiry:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'workEmail' => ['Too many demo requests from this network. Please try again later.'],
            ]);
        }
        RateLimiter::hit($key, 3600);

        $inbox = (string) (config('skuggle.mail.contact_to') ?: config('mail.from.address'));
        if ($inbox === '') {
            return ApiResponse::error('CONTACT_UNAVAILABLE', 'Contact mail is not configured yet.', 503);
        }

        Notification::route('mail', $inbox)->notifyNow(new ContactInquiryNotification([
            'fullName' => trim($data['fullName']),
            'workEmail' => mb_strtolower(trim($data['workEmail'])),
            'schoolName' => $data['schoolName'] ?? null,
            'phone' => $data['phone'] ?? null,
            'message' => $data['message'] ?? null,
        ]));

        return ApiResponse::success([
            'message' => 'Demo request received. Our team will reply within one business day.',
        ], [], 202);
    }
}
