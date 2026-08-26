<?php

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['title' => ['required', 'string', 'max:180'], 'classId' => ['required', 'string', 'max:40'], 'subjectId' => ['required', 'string', 'max:40'], 'assessmentTypeId' => ['required', 'string', 'max:40'], 'date' => ['required', 'date'], 'maxScore' => ['required', 'numeric', 'gt:0', 'max:1000'], 'instructions' => ['nullable', 'string', 'max:1000']];
    }
}
