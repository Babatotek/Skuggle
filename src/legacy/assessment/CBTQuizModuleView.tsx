import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  Send,
  BarChart2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CBTQuiz, CBTQuestion, CBTAttempt } from '../../types';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

export const CBTQuizModuleView: React.FC = () => {
  const { branding, students, currentRole, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'quizzes' | 'live_test' | 'results'>('quizzes');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('cbt-1');

  // Tenant quizzes are hydrated from the backend.
  const [quizzes, setQuizzes] = useState<CBTQuiz[]>([]);
  /*
    {
      id: 'cbt-1',
      title: 'JSS 2 Mathematics Mid-Term Continuous Test',
      subject: 'Mathematics',
      classLevel: 'JSS 2',
      term: 'First Term',
      session: '2025/2026',
      durationMinutes: 15,
      totalQuestions: 5,
      totalMarks: 20,
      passPercentage: 60,
      isPublished: true,
      shuffleQuestions: true,
      status: 'active',
      attemptCount: 38,
      avgScore: 78.4,
      questions: [
        {
          id: 'q-1',
          text: 'Simplify the algebraic expression: 5x + 3y - 2x + 4y',
          options: [
            { id: 'a', text: '3x + 7y' },
            { id: 'b', text: '7x + 7y' },
            { id: 'c', text: '3x - y' },
            { id: 'd', text: '10xy' },
          ],
          correctOptionId: 'a',
          explanation: 'Group like terms: (5x - 2x) + (3y + 4y) = 3x + 7y.',
        },
        {
          id: 'q-2',
          text: 'If 4a - 6 = 18, what is the value of a?',
          options: [
            { id: 'a', text: '4' },
            { id: 'b', text: '6' },
            { id: 'c', text: '8' },
            { id: 'd', text: '12' },
          ],
          correctOptionId: 'b',
          explanation: '4a = 18 + 6 = 24 => a = 24 / 4 = 6.',
        },
        {
          id: 'q-3',
          text: 'What is the sum of angles in a quadrilateral?',
          options: [
            { id: 'a', text: '180°' },
            { id: 'b', text: '270°' },
            { id: 'c', text: '360°' },
            { id: 'd', text: '540°' },
          ],
          correctOptionId: 'c',
          explanation: 'Sum of angles in any four-sided polygon is 360°.',
        },
        {
          id: 'q-4',
          text: 'Calculate the perimeter of a rectangle with length 12cm and breadth 7cm.',
          options: [
            { id: 'a', text: '38cm' },
            { id: 'b', text: '84cm' },
            { id: 'c', text: '19cm' },
            { id: 'd', text: '42cm' },
          ],
          correctOptionId: 'a',
          explanation: 'Perimeter = 2(l + b) = 2(12 + 7) = 2(19) = 38cm.',
        },
        {
          id: 'q-5',
          text: 'Convert 0.375 to a common fraction in its lowest term.',
          options: [
            { id: 'a', text: '3/8' },
            { id: 'b', text: '3/4' },
            { id: 'c', text: '5/8' },
            { id: 'd', text: '7/16' },
          ],
          correctOptionId: 'a',
          explanation: '0.375 = 375/1000 = (375÷125)/(1000÷125) = 3/8.',
        },
      ],
    },
    {
      id: 'cbt-2',
      title: 'Basic Science & Tech: Energy & Machines Test',
      subject: 'Basic Science',
      classLevel: 'JSS 2',
      term: 'First Term',
      session: '2025/2026',
      durationMinutes: 10,
      totalQuestions: 4,
      totalMarks: 20,
      passPercentage: 50,
      isPublished: true,
      shuffleQuestions: false,
      status: 'active',
      attemptCount: 42,
      avgScore: 82.5,
      questions: [
        {
          id: 'q2-1',
          text: 'Which of the following is a first-class lever?',
          options: [
            { id: 'a', text: 'Crowbar / See-saw' },
            { id: 'b', text: 'Wheelbarrow' },
            { id: 'c', text: 'Sugar tongs' },
            { id: 'd', text: 'Nutcracker' },
          ],
          correctOptionId: 'a',
        },
      ],
    },
  */

  useEffect(() => {
    let active = true;
    apiRequest<{ success: true; data: { data: CBTQuiz[] } }>('/cbt/quizzes', { suppressErrorNotification: true }).then((response) => { if (active) { setQuizzes(response.data.data); if (response.data.data[0]) setSelectedQuizId(response.data.data[0].id); } }).catch((error) => showToast('CBT quizzes unavailable', describeApiError(error), 'error'));
    return () => { active = false; };
  }, [showToast]);

  // Live Exam Simulation State
  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0] || { id: '', title: 'No quiz selected', subject: '', classLevel: '', term: '', session: '', durationMinutes: 1, totalQuestions: 0, totalMarks: 0, passPercentage: 0, isPublished: false, shuffleQuestions: false, status: 'draft', attemptCount: 0, avgScore: 0, questions: [] };
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(activeQuiz.durationMinutes * 60);
  const [isExamFinished, setIsExamFinished] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const createAiQuiz = async () => {
    const subject = window.prompt('Subject for the quiz', 'Mathematics')?.trim();
    if (!subject) return;
    const classLevel = window.prompt('Class level', 'JSS 2')?.trim();
    if (!classLevel) return;
    const topic = window.prompt('Topic', 'Algebraic expressions')?.trim();
    if (!topic) return;
    setCreatingQuiz(true);
    try {
      const generated = await apiMutation<{ data: { assessment: any } }>('/ai/assessment', 'POST', {
        assessmentType: 'CBT quiz', subject, classLevel, topics: topic, totalMarks: 20, mcqCount: 5, theoryCount: 0, difficulty: 'mixed', timeAllowed: '15 minutes',
      });
      const rawQuestions = Array.isArray(generated.data.assessment.questions) ? generated.data.assessment.questions : [];
      const questions = rawQuestions.map((question: any, index: number) => {
        const rawOptions = Array.isArray(question.options) ? question.options : [];
        const options = rawOptions.map((option: any, optionIndex: number) => ({ id: String(option.id ?? String.fromCharCode(97 + optionIndex)), text: String(option.text ?? option) }));
        const correct = String(question.correctOptionId ?? question.answer ?? options[0]?.id ?? '');
        return { id: String(question.id ?? `q-${index + 1}`), text: String(question.text ?? question.question ?? ''), options, correctOptionId: correct, explanation: String(question.explanation ?? '') };
      }).filter((question: any) => question.text && question.options.length >= 2 && question.correctOptionId);
      if (!questions.length) throw new Error('The AI response did not contain valid multiple-choice questions.');
      const saved = await apiMutation<{ data: CBTQuiz }>('/cbt/quizzes', 'POST', {
        title: String(generated.data.assessment.title || `${subject}: ${topic}`), subject, className: classLevel,
        durationMinutes: 15, totalMarks: 20, passPercentage: 50, shuffleQuestions: true, questions, status: 'draft',
      });
      setQuizzes((items) => [saved.data, ...items]);
      setSelectedQuizId(saved.data.id);
      showToast('CBT draft created', 'The AI-generated quiz is stored in the database for review.', 'success');
    } catch (error) {
      showToast('CBT creation failed', error instanceof Error && error.message.startsWith('The AI') ? error.message : describeApiError(error), 'failed');
    } finally { setCreatingQuiz(false); }
  };

  // Timer countdown
  useEffect(() => {
    if (activeTab === 'live_test' && !isExamFinished && timeLeftSeconds > 0) {
      const timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeTab, isExamFinished, timeLeftSeconds]);

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (isExamFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleAutoSubmit = () => {
    if (!activeQuiz.id) return;
    void apiMutation<{ success: true; data: { score: number; totalMarks: number; percentage: number } }>(`/cbt/quizzes/${encodeURIComponent(activeQuiz.id)}/attempts`, 'POST', { answers: selectedAnswers })
      .then((response) => { setFinalScore(response.data.score); setIsExamFinished(true); showToast('Test submitted', `Scored ${response.data.score}/${response.data.totalMarks} (${response.data.percentage}%).`); })
      .catch((error) => showToast('Test submission failed', describeApiError(error), 'failed'));
  };

  const handleStartQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    const quiz = quizzes.find((q) => q.id === quizId) || quizzes[0];
    setTimeLeftSeconds(quiz.durationMinutes * 60);
    setIsExamFinished(false);
    setActiveTab('live_test');
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-slate-900">
              Computer-Based Testing (CBT) & Quiz Engine
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
              Instant Auto-Grading
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Create timed online quizzes, practice mock exams, and automatically push scores into Continuous Assessment CA records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={createAiQuiz}
            disabled={creatingQuiz}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{creatingQuiz ? 'Creating...' : 'Create AI Quiz'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Active Quizzes & Tests</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
            {quizzes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('live_test')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'live_test'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Student Testing Terminal</span>
        </button>
      </div>

      {/* Tab 1: Quiz Repository */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md">
                    {quiz.subject} • {quiz.classLevel}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Published
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-slate-900 mt-2">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Term: {quiz.term} • Session {quiz.session}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Time</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {quiz.durationMinutes} Mins
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Questions</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {quiz.questions.length} Items
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Avg Score</div>
                    <div className="font-bold text-emerald-600 text-sm mt-0.5">
                      {quiz.avgScore}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {quiz.attemptCount} students completed
                </span>
                <button
                  onClick={() => handleStartQuiz(quiz.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Live Test</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Live CBT Test Runner */}
      {activeTab === 'live_test' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
          {/* Header & Countdown Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                Live CBT Terminal
              </span>
              <h2 className="font-display font-bold text-xl text-slate-900 mt-1">
                {activeQuiz.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-2xl flex items-center gap-2 font-mono font-bold text-base ${
                  timeLeftSeconds < 120
                    ? 'bg-rose-100 text-rose-800 animate-pulse'
                    : 'bg-slate-900 text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {!isExamFinished ? (
            <div className="space-y-6">
              {/* Question Navigation Bubbles */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {activeQuiz.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs shrink-0 transition-all ${
                      currentQuestionIdx === idx
                        ? 'bg-purple-600 text-white shadow-sm'
                        : selectedAnswers[q.id]
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Current Question Body */}
              {(() => {
                const currentQuestion = activeQuiz.questions[currentQuestionIdx];
                if (!currentQuestion) return null;

                return (
                  <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>
                        Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
                      </span>
                      <span>4 Marks</span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-slate-900 leading-relaxed">
                      {currentQuestion.text}
                    </h3>

                    {/* Options List */}
                    <div className="space-y-2.5 pt-2">
                      {currentQuestion.options.map((opt) => {
                        const isChosen = selectedAnswers[currentQuestion.id] === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectAnswer(currentQuestion.id, opt.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? 'border-purple-600 bg-purple-50/80 text-purple-950 font-bold shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                                  isChosen
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                            {isChosen && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40"
                >
                  Previous
                </button>

                {currentQuestionIdx < activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleAutoSubmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                  >
                    Submit Test & Get Score
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Instant Result Card */
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-2xl text-slate-900">
                  Examination Completed!
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your answers have been graded and synced with your terminal score profile.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl max-w-sm mx-auto border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Final Total Score</span>
                <div className="text-4xl font-black font-display text-emerald-600">
                  {finalScore} / {activeQuiz.totalMarks}
                </div>
                <span className="text-xs font-bold text-slate-700 block">
                  {Math.round((finalScore / activeQuiz.totalMarks) * 100)}% Proficiency
                </span>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => handleStartQuiz(activeQuiz.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Test</span>
                </button>
                <button
                  onClick={() => setActiveTab('quizzes')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md"
                >
                  Back to CBT Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
