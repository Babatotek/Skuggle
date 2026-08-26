import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Flame,
  ArrowRight,
  TrendingUp,
  Trophy,
  Star,
  BookMarked,
  Video,
  FileCheck2,
  FileText,
  ChevronRight,
  Clock,
  Link2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SmartLibraryWidget } from '../../shared/ui/SmartLibraryWidget';
import { useStudentWorkspace } from '../../features/student/useStudentWorkspace';

interface StudentDashboardViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const workspace = useStudentWorkspace();
  const [activeQuizQuestion, setActiveQuizQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const practiceQuestions = [
    {
      question: 'Simplify the algebraic fraction: (4x² - 16) / (2x + 4)',
      options: ['2x - 4', '2x + 4', '4x - 2', '2(x - 2)'],
      correct: '2x - 4',
      explanation:
        'Factor numerator 4(x² - 4) = 4(x-2)(x+2). Denominator 2(x+2). Cancel (x+2) -> 4/2 * (x-2) = 2(x-2) = 2x - 4.',
    },
    {
      question: 'What is the value of x in the equation: 3(x - 4) = 15?',
      options: ['x = 9', 'x = 7', 'x = 5', 'x = 11'],
      correct: 'x = 9',
      explanation: 'Divide both sides by 3 -> x - 4 = 5 -> x = 9.',
    },
  ];

  const handleSelectOption = (opt: string) => {
    if (quizAnswered) return;
    setSelectedOption(opt);
    setQuizAnswered(true);

    const isCorrect = opt === practiceQuestions[activeQuizQuestion].correct;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const nextQuestion = () => {
    if (activeQuizQuestion < practiceQuestions.length - 1) {
      setActiveQuizQuestion((prev) => prev + 1);
      setSelectedOption(null);
      setQuizAnswered(false);
    }
  };

  const subtitle = workspace.isLive
    ? `${workspace.contextLine} • ${
        workspace.isPersonal
          ? 'Your personal workspace — connect a school invite when ready.'
          : 'Ready to level up your scores today?'
      }`
    : 'JSS 2A • Royal Gateway Academy • Ready to level up your scores today?';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {workspace.greeting}, {workspace.firstName}{' '}
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
          {workspace.isLive && workspace.isPersonal && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
              <Link2 className="h-3.5 w-3.5" />
              Personal account — not connected to a school yet
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!workspace.isLive && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-bounce" />
              <div>
                <p className="text-xs font-extrabold text-orange-700">7-Day Study Streak!</p>
                <p className="text-[10px] text-amber-600 font-medium">Top 5% of JSS 2</p>
              </div>
            </div>
          )}

          {!workspace.isLive ? (
            <button
              onClick={() => onOpenModal('report_card')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>My Report Card</span>
            </button>
          ) : !workspace.isPersonal ? (
            <button
              onClick={() => onOpenModal('report_card')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>My Report Card</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('my_progress')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Progress <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Overall Term Average</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {workspace.isLive ? '—' : '89.4%'}
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
              {workspace.isLive
                ? workspace.isPersonal
                  ? 'No school results yet'
                  : 'Results appear after your school publishes'
                : 'Rank 2nd in JSS 2A'}
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('assessments')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Assessments <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">CBT & Assessments</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {workspace.isLive ? '0 / 0' : '14 / 16'}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {workspace.isLive ? 'Nothing assigned yet' : '88% completed'}
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('learning')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Learning <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Active Syllabus Modules</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {workspace.isLive ? '—' : 'Week 8 of 12'}
            </p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
              {workspace.isLive ? 'Open Library to start' : '8 Subjects & Schemes'}
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('results')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Results <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">
              {workspace.isLive ? 'Term GPA' : 'Term 2 GPA'}
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {workspace.isLive ? '—' : '4.85 / 5.0'}
            </p>
            <p className="text-[11px] text-purple-600 font-semibold mt-0.5">
              {workspace.isLive ? 'Awaiting first term data' : 'Distinction (7 A1s, 1 B2)'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Daily Practice Challenge</span>
              </span>
              <span className="text-xs text-slate-400">
                Question {activeQuizQuestion + 1} of {practiceQuestions.length}
              </span>
            </div>

            <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>+20 XP</span>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white mb-5 leading-snug">
            {practiceQuestions[activeQuizQuestion].question}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {practiceQuestions[activeQuizQuestion].options.map((opt) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === practiceQuestions[activeQuizQuestion].correct;

              let btnStyle = 'bg-white/10 hover:bg-white/15 border-white/10 text-white';
              if (quizAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500/30 border-rose-400 text-rose-200';
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  disabled={quizAnswered}
                  className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {quizAnswered && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div>
                <p
                  className={`text-xs font-bold ${
                    selectedOption === practiceQuestions[activeQuizQuestion].correct
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }`}
                >
                  {selectedOption === practiceQuestions[activeQuizQuestion].correct
                    ? 'Correct! Brilliant step solving.'
                    : 'Solution breakdown:'}
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  {practiceQuestions[activeQuizQuestion].explanation}
                </p>
              </div>

              {activeQuizQuestion < practiceQuestions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors whitespace-nowrap self-end sm:self-center"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveQuizQuestion(0);
                    setSelectedOption(null);
                    setQuizAnswered(false);
                    setQuizScore(0);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors whitespace-nowrap self-end sm:self-center"
                >
                  Restart Practice
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Timetable</h3>
              <span className="text-xs font-semibold text-indigo-600">This Week</span>
            </div>

            {workspace.isLive ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center">
                <Clock className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">No timetable items yet</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {workspace.isPersonal
                    ? 'School schedules appear after you join with an invitation code.'
                    : 'Your school has not published upcoming events for you yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <p className="text-xs font-bold text-slate-900">JSS 2A Math Quiz 3</p>
                  <p className="text-[11px] text-slate-500">Tomorrow • 8:00 AM in Room 12</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                  <p className="text-xs font-bold text-slate-900">English Essay Submission</p>
                  <p className="text-[11px] text-slate-500">Friday • 11:30 AM</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                  <p className="text-xs font-bold text-slate-900">Basic Science Lab Practical</p>
                  <p className="text-[11px] text-slate-500">Next Monday • 9:00 AM</p>
                </div>
              </div>
            )}
          </div>

          {(!workspace.isLive || !workspace.isPersonal) && (
            <button
              onClick={() => onOpenModal('result_checker')}
              className="w-full pt-3 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:underline text-center"
            >
              Check Past Exam Results →
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Smart Digital Library & E-Learning Hub
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600 fill-emerald-500" />
                  {workspace.isLive
                    ? workspace.isPersonal
                      ? 'Personal'
                      : 'School'
                    : 'Full Access'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {workspace.isLive
                  ? workspace.isPersonal
                    ? 'Upload notes, generate quizzes, and build your own study library.'
                    : `Resources shared by ${workspace.schoolLabel}.`
                  : '1,200+ NERDC and WAEC-aligned digital textbooks, video simulations, past papers and AI revision notes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <SmartLibraryWidget
              user={{
                id: workspace.userId,
                name: workspace.displayName,
                role: 'student',
                schoolName: workspace.schoolLabel,
                hasSubscription: true,
              }}
              onOpenModal={onOpenModal}
              onNavigateTab={onNavigateTab}
            />
            <button
              onClick={() => onNavigateTab('learning')}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Explore All Subjects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div
            onClick={() => onNavigateTab('learning')}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100/80 hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <BookMarked className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                {workspace.isLive ? 'Library' : '140+ E-Books'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              Digital Textbooks
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {workspace.isLive
                ? 'Browse textbooks and notes in your workspace library.'
                : 'New General Mathematics, Concise Biology, African Literature & English Grammar.'}
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              <span>Read textbooks</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('learning')}
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 to-pink-50/50 border border-purple-100/80 hover:border-purple-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Video className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                {workspace.isLive ? 'Videos' : '85+ Videos'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
              Video Lessons & Labs
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {workspace.isLive
                ? 'Open video lessons when your school or you add them.'
                : 'Electrolysis demonstrations, Projectile Motion calculus, and laboratory simulations.'}
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform">
              <span>Watch lessons</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('assessments')}
            className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 to-amber-50/50 border border-rose-100/80 hover:border-rose-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                {workspace.isLive ? 'Practice' : '250+ Drills'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
              CBT Mock Exams
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {workspace.isLive
                ? 'Take assessments assigned to you, or generate practice quizzes from Library.'
                : 'Timed BECE & WAEC mock drills with instant algorithmic grading and feedback.'}
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform">
              <span>Launch mock CBT</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('more')}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100/80 hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                {workspace.isLive ? 'Notes' : '500+ Handouts'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Revision Handouts
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {workspace.isLive
                ? 'Keep revision sheets and teacher handouts in one place.'
                : 'Physics SI formulas, Civic Education guides, and teacher annotated study sheets.'}
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
              <span>Download PDFs</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
