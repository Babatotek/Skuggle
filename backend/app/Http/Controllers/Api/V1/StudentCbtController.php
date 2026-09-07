<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AssessmentAccess;
use App\Services\StudentCbtService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentCbtController extends Controller
{
    public function __construct(private StudentCbtService $cbt, private AssessmentAccess $access) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.cbt.attempt'), 403);
        $student = $this->cbt->studentFor($request->user());
        $items = $this->cbt->eligible($student)->map(fn ($item) => $this->cbt->presentListItem($item, $student))->values();

        return ApiResponse::success(['data' => $items, 'meta' => ['total' => $items->count()]]);
    }

    public function show(string $assessment, Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.cbt.attempt'), 403);
        $student = $this->cbt->studentFor($request->user());
        $item = $this->cbt->resolve($assessment, $student);

        return ApiResponse::success($this->cbt->presentPlayer($item, $student));
    }

    public function save(string $assessment, Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.cbt.attempt'), 403);
        $data = $request->validate([
            'answers' => 'required|array|max:200',
            'answers.*' => 'nullable|string|max:5000',
        ]);
        $student = $this->cbt->studentFor($request->user());
        $item = $this->cbt->resolve($assessment, $student, true);

        return ApiResponse::success($this->cbt->saveDraft($item, $student, $data['answers']));
    }

    public function submit(string $assessment, Request $request): JsonResponse
    {
        abort_unless($this->access->allows('assessment.cbt.attempt'), 403);
        $data = $request->validate([
            'answers' => 'required|array|max:200',
            'answers.*' => 'nullable|string|max:5000',
        ]);
        $student = $this->cbt->studentFor($request->user());
        $item = $this->cbt->resolve($assessment, $student, true);
        $result = $this->cbt->submit($item, $student, $data['answers'], $request->user()->getKey());

        return ApiResponse::success($result);
    }
}
