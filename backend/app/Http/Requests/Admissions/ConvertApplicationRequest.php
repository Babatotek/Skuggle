<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;

class ConvertApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'classId' => ['nullable', 'string', 'max:40'],
            'academicSessionId' => ['nullable', 'string', 'max:40'],
            'termId' => ['nullable', 'string', 'max:40'],
            'admissionDate' => ['nullable', 'date'],
            'admissionType' => ['nullable', 'string', 'max:48'],
            'studentCategory' => ['nullable', 'string', 'max:48'],
            'boardingType' => ['nullable', 'string', 'max:24'],
            'guardianRelationship' => ['nullable', 'string', 'max:64'],
            'customFields' => ['nullable', 'array'],
        ];
    }
}
