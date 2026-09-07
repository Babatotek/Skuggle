<?php

namespace App\Http\Requests\Admissions;

use App\Domain\Admissions\ApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cycleId' => ['nullable', 'string', 'max:40'],
            'requestedClassId' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', Rule::in([ApplicationStatus::Draft->value, ApplicationStatus::Submitted->value])],
            'firstName' => ['required', 'string', 'max:100'],
            'middleName' => ['nullable', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'dateOfBirth' => ['nullable', 'date', 'before:today'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'guardianName' => ['nullable', 'string', 'max:190'],
            'guardianPhone' => ['nullable', 'string', 'max:40'],
            'guardianEmail' => ['nullable', 'email:rfc', 'max:190'],
            'customFields' => ['nullable', 'array'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
