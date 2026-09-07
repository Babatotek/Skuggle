<?php

namespace App\Http\Requests\Admissions;

use App\Domain\Admissions\DecisionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::enum(DecisionType::class)],
            'offeredClassId' => ['nullable', 'string', 'max:40', 'required_if:decision,offered'],
            'offerReference' => ['nullable', 'string', 'max:80'],
            'expiresAt' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
