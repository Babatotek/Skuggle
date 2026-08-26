<?php

namespace App\Http\Requests\Students;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'admissionNumber' => ['nullable', 'string', 'max:64'], 'firstName' => ['required', 'string', 'max:100'], 'middleName' => ['nullable', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'], 'gender' => ['required', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'dateOfBirth' => ['required', 'date', 'before:today'], 'nationality' => ['nullable', 'string', 'max:80'], 'countryCode' => ['nullable', 'string', 'max:8'], 'stateOfOrigin' => ['nullable', 'string', 'max:100'], 'localGovernmentArea' => ['nullable', 'string', 'max:120'],
            'admissionDate' => ['required', 'date'], 'classId' => ['required', 'string', 'max:40'], 'guardians' => ['required', 'json'],
            'customFields' => ['nullable'],
            'photo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ];
    }
}
