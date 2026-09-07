<?php

namespace App\Http\Requests\Admissions;

use App\Domain\Admissions\CycleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => ['nullable', 'string', 'max:40'],
            'name' => ['required', 'string', 'max:120'],
            'opensAt' => ['nullable', 'date'],
            'closesAt' => ['nullable', 'date', 'after_or_equal:opensAt'],
            'status' => ['required', Rule::enum(CycleStatus::class)],
            'currency' => ['required', 'string', 'size:3'],
            'applicationFeeMinor' => ['required', 'integer', 'min:0'],
            'settings' => ['nullable', 'array'],
        ];
    }
}
