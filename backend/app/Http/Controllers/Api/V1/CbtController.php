<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\CbtAttempt;
use App\Models\CbtQuiz;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CbtController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $privileged = (bool) app(TenantContext::class)->membership()->role->privileged;
        $items = CbtQuiz::query()->when(! $privileged, fn ($q) => $q->where('status', 'published'))->latest()->limit(100)->get();

        return ApiResponse::success(['data' => $items->map(fn (CbtQuiz $q) => $this->present($q, $privileged))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['title' => ['required', 'string', 'max:220'], 'subject' => ['required', 'string', 'max:120'], 'className' => ['required', 'string', 'max:100'], 'durationMinutes' => ['required', 'integer', 'min:1', 'max:300'], 'totalMarks' => ['required', 'integer', 'min:1', 'max:1000'], 'passPercentage' => ['nullable', 'integer', 'min:0', 'max:100'], 'shuffleQuestions' => ['nullable', 'boolean'], 'questions' => ['required', 'array', 'min:1'], 'questions.*.id' => ['required', 'string'], 'questions.*.text' => ['required', 'string'], 'questions.*.options' => ['required', 'array', 'min:2'], 'questions.*.correctOptionId' => ['required', 'string'], 'status' => ['nullable', 'in:draft,published']]);
        $q = CbtQuiz::query()->create(['title' => $data['title'], 'subject' => $data['subject'], 'class_name' => $data['className'], 'duration_minutes' => $data['durationMinutes'], 'total_marks' => $data['totalMarks'], 'pass_percentage' => $data['passPercentage'] ?? 50, 'shuffle_questions' => $data['shuffleQuestions'] ?? false, 'questions' => $data['questions'], 'status' => $data['status'] ?? 'draft', 'created_by' => $request->user()->getKey()]);

        return ApiResponse::success($this->present($q, true), [], 201);
    }

    public function submit(Request $request, string $quiz): JsonResponse
    {
        $q = CbtQuiz::query()->where('public_id', $quiz)->where('status', 'published')->firstOrFail();
        $data = $request->validate(['answers' => ['required', 'array']]);
        $questions = $q->questions;
        $correct = 0;
        foreach ($questions as $question) {
            if (($data['answers'][$question['id']] ?? null) === ($question['correctOptionId'] ?? null)) {
                $correct++;
            }
        }
        $score = (int) round((count($questions) ? $correct / count($questions) : 0) * $q->total_marks);
        $attempt = CbtAttempt::query()->create(['quiz_id' => $q->getKey(), 'user_id' => $request->user()->getKey(), 'answers' => $data['answers'], 'score' => $score, 'total_marks' => $q->total_marks, 'submitted_at' => now()]);

        return ApiResponse::success(['id' => $attempt->public_id, 'score' => $score, 'totalMarks' => (int) $q->total_marks, 'percentage' => (int) round($score / $q->total_marks * 100)]);
    }

    private function present(CbtQuiz $q, bool $answers): array
    {
        $questions = collect($q->questions)->map(function ($item) use ($answers) {
            if (! $answers) {
                unset($item['correctOptionId'],$item['explanation']);
            }

return $item;
        })->values();

        return ['id' => $q->public_id, 'title' => $q->title, 'subject' => $q->subject, 'classLevel' => $q->class_name, 'durationMinutes' => (int) $q->duration_minutes, 'totalQuestions' => $questions->count(), 'totalMarks' => (int) $q->total_marks, 'passPercentage' => (int) $q->pass_percentage, 'isPublished' => $q->status === 'published', 'shuffleQuestions' => (bool) $q->shuffle_questions, 'status' => $q->status === 'published' ? 'active' : 'draft', 'questions' => $questions];
    }
}
