<?php

namespace App\Http\Requests\Auth;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class RegisterIndividualRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'accountType' => ['required', Rule::in(['student', 'parent', 'teacher'])], 'firstName' => ['required', 'string', 'max:100'], 'lastName' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email:rfc', 'max:254', 'unique:users,email'], 'birthDate' => ['required_if:accountType,student', 'nullable', 'date', 'before_or_equal:'.now()->subYears(5)->toDateString()],
            'className' => ['nullable', 'string', 'max:100'], 'schoolInvitationCode' => ['nullable', 'string', 'max:80'],
            'guardianName' => ['nullable', 'string', 'max:180'], 'guardianEmail' => ['nullable', 'email:rfc', 'max:254'], 'guardianConsent' => ['nullable', 'boolean'],
            'password' => ['required', Password::defaults()], 'passwordConfirmation' => ['required', 'same:password'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('accountType') !== 'student' || ! $this->filled('birthDate')) {
                return;
            }
            if (CarbonImmutable::parse((string) $this->input('birthDate'))->age >= 18) {
                return;
            }
            if (! $this->filled('guardianName')) {
                $validator->errors()->add('guardianName', 'A parent or guardian name is required for students under 18.');
            }
            if (! $this->filled('guardianEmail')) {
                $validator->errors()->add('guardianEmail', 'A parent or guardian email is required for students under 18.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
    }
}
