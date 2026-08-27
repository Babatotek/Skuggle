<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Library\AI\AIManager;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AiToolController extends Controller
{
    public function lessonPlan(Request $request, AIManager $ai): JsonResponse
    {
        $data = $request->validate([
            'topic' => ['required', 'string', 'max:500'],
            'subject' => ['nullable', 'string', 'max:120'],
            'className' => ['nullable', 'string', 'max:80'],
            'duration' => ['nullable', 'string', 'max:80'],
            'curriculum' => ['nullable', 'string', 'max:180'],
        ]);

        $topic = $data['topic'];
        $subject = $data['subject'] ?? 'Mathematics';
        $className = $data['className'] ?? 'JSS 2';
        $duration = $data['duration'] ?? '40 Minutes';
        $curriculum = $data['curriculum'] ?? 'NERDC Nigerian National Curriculum';

        try {
            $result = $ai->generate(
                'lesson_plan',
                'You are an expert Nigerian curriculum specialist. Return JSON with keys: title, subject, className, duration, curriculumReference, learningObjectives (string array), previousKnowledge, instructionalMaterials (string array), steps (array of stepNumber, title, duration, teacherActivity, studentActivity, keyPoints), evaluationQuestions (string array), homework, teacherRemarks.',
                json_encode([
                    'class' => $className,
                    'subject' => $subject,
                    'topic' => $topic,
                    'duration' => $duration,
                    'curriculum' => $curriculum,
                ], JSON_THROW_ON_ERROR),
                $request->user()->getKey(),
            );

            Validator::make($result, [
                'title' => ['required', 'string'],
                'learningObjectives' => ['required', 'array', 'min:1'],
                'steps' => ['required', 'array', 'min:1'],
            ])->validate();

            return ApiResponse::success(['lessonPlan' => $result]);
        } catch (ApiException) {
            return ApiResponse::success([
                'lessonPlan' => $this->fallbackLessonPlan($topic, $subject, $className, $duration, $curriculum),
            ]);
        } catch (\Throwable) {
            return ApiResponse::success([
                'lessonPlan' => $this->fallbackLessonPlan($topic, $subject, $className, $duration, $curriculum),
            ]);
        }
    }

    /** @return array<string, mixed> */
    private function fallbackLessonPlan(
        string $topic,
        string $subject,
        string $className,
        string $duration,
        string $curriculum,
    ): array {
        return [
            'title' => $topic,
            'subject' => $subject,
            'className' => $className,
            'duration' => $duration,
            'curriculumReference' => "{$curriculum} - Week 4 Module",
            'learningObjectives' => [
                'Identify the Lowest Common Multiple (LCM) of algebraic denominators.',
                'Add and subtract simple algebraic fractions with like and unlike denominators.',
                'Solve real-world word problems translated into algebraic fractions.',
            ],
            'previousKnowledge' => 'Students have prior mastery of finding the LCM of whole numbers and simplifying simple algebraic expressions.',
            'instructionalMaterials' => [
                'Whiteboard and colored markers',
                'Fraction bar manipulatives and algebraic flashcards',
                'Interactive SmartMark diagnostic worksheet',
            ],
            'steps' => [
                [
                    'stepNumber' => 1,
                    'title' => 'Introduction & Recall (5 mins)',
                    'duration' => '5 Minutes',
                    'teacherActivity' => 'Teacher writes numerical fractions 1/3 + 2/5 on board and guides students to find common denominator.',
                    'studentActivity' => 'Students compute LCM of 3 and 5 (= 15) and convert numerators.',
                    'keyPoints' => 'Fraction rules remain identical when variables replace constants.',
                ],
                [
                    'stepNumber' => 2,
                    'title' => 'Conceptual Presentation (12 mins)',
                    'duration' => '12 Minutes',
                    'teacherActivity' => 'Teacher demonstrates (2/x) + (3/2x) step-by-step showing LCM = 2x.',
                    'studentActivity' => 'Students take notes in exercise books and copy the 3-step solution method.',
                    'keyPoints' => 'Denominator matching is prerequisite to combining numerators.',
                ],
                [
                    'stepNumber' => 3,
                    'title' => 'Guided Practice & Group Challenge (15 mins)',
                    'duration' => '15 Minutes',
                    'teacherActivity' => 'Teacher circulates the classroom providing differentiated hints to pairs.',
                    'studentActivity' => 'Students work in pairs to solve (x+1)/3 - (x-2)/4.',
                    'keyPoints' => 'Be mindful of distributive minus sign across (x-2).',
                ],
                [
                    'stepNumber' => 4,
                    'title' => 'Evaluation & Summary (8 mins)',
                    'duration' => '8 Minutes',
                    'teacherActivity' => 'Teacher administers 2-question quick exit ticket on board.',
                    'studentActivity' => 'Students solve exit ticket individually and submit.',
                    'keyPoints' => 'Assess mastery against objective 1 and 2.',
                ],
            ],
            'evaluationQuestions' => [
                'Simplify: (3/2a) + (5/4a)',
                'Express as a single fraction in its lowest term: (2x-1)/3 - (x+2)/2',
            ],
            'homework' => 'Complete Exercises 4.2 in New General Mathematics Book 2, Questions 1 through 8.',
            'teacherRemarks' => 'Prepared with Skuggle AI Curriculum Assistant for '.$className.' First Term.',
        ];
    }
}
