<?php

namespace App\Http\Requests\Admissions;

use App\Domain\Admissions\ApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ApplicationStatus::class)],
            'reason' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
