<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;

class CreateExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $max = (int) config('skuggle.library.max_batch_resources', 30);

        return ['resourceIds' => ['required', 'array', 'min:1', 'max:'.$max], 'resourceIds.*' => ['required', 'string', 'max:40', 'distinct'], 'title' => ['required', 'string', 'max:220'], 'includeCoverPage' => ['required', 'boolean'], 'format' => ['required', 'in:pdf']];
    }
}
