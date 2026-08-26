<?php

namespace App\Http\Requests\Assessments;

use Illuminate\Foundation\Http\FormRequest;

class SaveScoresRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['revision' => ['required', 'string', 'max:100'], 'scores' => ['required', 'array', 'max:500'], 'scores.*' => ['nullable', 'numeric', 'min:0']];
    }
}
