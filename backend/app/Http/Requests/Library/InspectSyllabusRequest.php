<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;

class InspectSyllabusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $max = (int) config('skuggle.security.upload_max_mb', 25) * 1024;

        return ['file' => ['required', 'file', 'mimes:pdf,docx,txt', 'max:'.$max], 'subject' => ['nullable', 'string', 'max:120'], 'className' => ['nullable', 'string', 'max:100']];
    }
}
