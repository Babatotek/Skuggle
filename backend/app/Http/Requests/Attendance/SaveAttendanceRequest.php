<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['date' => ['required', 'date'], 'revision' => ['required', 'string', 'max:100'], 'statuses' => ['required', 'array', 'max:250'], 'statuses.*' => ['required', Rule::in(['present', 'absent', 'late', 'excused', 'sick'])]];
    }
}
