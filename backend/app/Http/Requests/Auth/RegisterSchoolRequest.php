<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'schoolName' => ['required', 'string', 'max:180'], 'schoolCode' => ['required', 'alpha_dash', 'max:32', 'unique:tenants,code'],
            'schoolEmail' => ['required', 'email:rfc', 'max:254'], 'phone' => ['required', 'string', 'max:32'], 'address' => ['required', 'string', 'max:1000'],
            'schoolType' => ['required', 'string', 'max:80'], 'schoolLevel' => ['required', 'string', 'max:120'], 'primaryColor' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'adminName' => ['required', 'string', 'max:160'], 'adminEmail' => ['required', 'email:rfc', 'max:254', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()], 'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['schoolCode' => mb_strtoupper(trim((string) $this->input('schoolCode'))), 'adminEmail' => mb_strtolower(trim((string) $this->input('adminEmail')))]);
    }
}
