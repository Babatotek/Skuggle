<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['body' => ['required', 'string', 'max:5000'], 'colour' => ['required', Rule::in(['yellow', 'pink', 'blue', 'green'])], 'sectionId' => ['nullable', 'string', 'max:120']];
    }
}
