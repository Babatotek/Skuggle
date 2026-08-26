<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['uploadToken' => ['required', 'string', 'max:40'], 'outcomeIds' => ['required', 'array', 'min:1', 'max:20'], 'outcomeIds.*' => ['string', 'max:40', 'distinct'], 'questionCount' => ['required', 'integer', 'min:5', 'max:30'], 'difficulty' => ['required', Rule::in(['foundation', 'standard', 'challenge'])]];
    }
}
