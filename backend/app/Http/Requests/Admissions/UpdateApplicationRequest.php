<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cycleId' => ['sometimes', 'nullable', 'string', 'max:40'],
            'requestedClassId' => ['sometimes', 'nullable', 'string', 'max:40'],
            'firstName' => ['sometimes', 'string', 'max:100'],
            'middleName' => ['sometimes', 'nullable', 'string', 'max:100'],
            'lastName' => ['sometimes', 'string', 'max:100'],
            'gender' => ['sometimes', 'nullable', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'dateOfBirth' => ['sometimes', 'nullable', 'date', 'before:today'],
            'nationality' => ['sometimes', 'nullable', 'string', 'max:80'],
            'guardianName' => ['sometimes', 'nullable', 'string', 'max:190'],
            'guardianPhone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'guardianEmail' => ['sometimes', 'nullable', 'email:rfc', 'max:190'],
            'customFields' => ['sometimes', 'array'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
