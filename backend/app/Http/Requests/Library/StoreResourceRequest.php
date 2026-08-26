<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['sections', 'learningObjectives', 'tableOfContents'] as $field) {
            $value = $this->input($field);
            if (is_string($value) && $value !== '') {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $this->merge([$field => $decoded]);
                }
            }
        }

        foreach (['schoolApproved', 'isPublic'] as $field) {
            if ($this->exists($field)) {
                $this->merge([$field => filter_var($this->input($field), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:220'], 'description' => ['nullable', 'string', 'max:2000'], 'author' => ['nullable', 'string', 'max:180'], 'publisher' => ['nullable', 'string', 'max:180'],
            'resourceType' => ['required', Rule::in(['book', 'lesson', 'revision_note', 'worksheet', 'worked_example', 'flashcard', 'quiz', 'audio', 'video', 'teacher_material', 'other'])],
            'educationalLevel' => ['nullable', 'string', 'max:80'], 'className' => ['nullable', 'string', 'max:100'], 'subjectId' => ['nullable', 'string', 'max:40'], 'subject' => ['nullable', 'string', 'max:120'], 'term' => ['nullable', 'string', 'max:80'], 'topic' => ['nullable', 'string', 'max:180'],
            'estimatedStudyMinutes' => ['nullable', 'integer', 'min:1', 'max:10000'], 'accessTier' => ['required', Rule::in(['free', 'learn_plus', 'school'])], 'sourceLabel' => ['required', 'string', 'max:180'],
            'licenceName' => ['required', 'string', 'max:120'], 'copyrightOwner' => ['nullable', 'string', 'max:180'], 'usageNote' => ['nullable', 'string', 'max:1000'],
            'learningObjectives' => ['nullable', 'array', 'max:50'], 'learningObjectives.*' => ['string', 'max:500'], 'tableOfContents' => ['nullable', 'array', 'max:100'], 'sections' => ['required', 'array', 'min:1', 'max:100'],
            'sections.*.id' => ['required', 'string', 'max:120', 'distinct'], 'sections.*.title' => ['required', 'string', 'max:220'], 'sections.*.content' => ['required', 'string', 'max:200000'],
            'schoolApproved' => ['boolean'], 'isPublic' => ['boolean'], 'status' => ['required', Rule::in(['draft', 'published', 'archived'])], 'changeSummary' => ['required', 'string', 'max:500'],
            'file' => ['nullable', 'file', 'mimes:pdf,docx,txt,mp3,mp4', 'max:'.((int) config('skuggle.security.upload_max_mb', 25) * 1024)],
        ];
    }
}
