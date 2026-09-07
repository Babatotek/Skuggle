<?php

namespace App\Http\Requests\Students;

use App\Models\Student;
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
        if ($this->filled('enrolment')) {
            return [
                'enrolment' => ['required', 'json'],
                'photo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
            ];
        }

        $isDraft = $this->boolean('saveAsDraft');

        return [
            'admissionNumber' => ['nullable', 'string', 'max:64'],
            'firstName' => ['required', 'string', 'max:100'],
            'middleName' => ['nullable', 'string', 'max:100'],
            'preferredName' => ['nullable', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'],
            'gender' => [$isDraft ? 'nullable' : 'required', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'dateOfBirth' => [$isDraft ? 'nullable' : 'required', 'date', 'before:today'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'countryCode' => ['nullable', 'string', 'max:8'],
            'stateOfOrigin' => ['nullable', 'string', 'max:100'],
            'localGovernmentArea' => ['nullable', 'string', 'max:120'],
            'religion' => ['nullable', 'string', 'max:64'],
            'admissionDate' => [$isDraft ? 'nullable' : 'required', 'date'],
            'classId' => [$isDraft ? 'nullable' : 'required', 'string', 'max:40'],
            'academicSessionId' => ['nullable', 'string'],
            'termId' => ['nullable', 'string'],
            'admissionType' => ['nullable', 'string', 'max:48'],
            'studentCategory' => ['nullable', 'string', 'max:48'],
            'boardingType' => ['nullable', 'string', 'max:24'],
            'status' => ['nullable', Rule::in(Student::lifecycleStatuses())],
            'saveAsDraft' => ['nullable', 'boolean'],
            'guardians' => [$isDraft ? 'nullable' : 'required', 'json'],
            'residential' => ['nullable'],
            'emergency' => ['nullable'],
            'admission' => ['nullable'],
            'medical' => ['nullable'],
            'portal' => ['nullable'],
            'customFields' => ['nullable'],
            'photo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ];
    }
}
