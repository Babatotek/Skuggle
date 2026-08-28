import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  Brain,
  Building2,
  User,
  Clock,
  Flame,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';

interface StudentDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenResultChecker: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateTab, onOpenResultChecker }) => {
  const { branding, students, currentWorkspace, switchSpaceCategory } = useApp();
  const myStudent = students[0];
  const isPersonal = currentWorkspace.type === 'personal';

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. IDENTITY BANNER                                                        */}
      {/* ========================================================================= */}
      {isPersonal ? (
        /* PERSONAL LEARNER ROOM BANNER */
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-300" />
                  <span>Personal Space · Independent Study Hub</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>14-Day Study Streak</span>
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                David's Personal Study Room
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">
                AI Learning Buddy, WAEC & BECE Question Drills, and Personal Flashcards
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => switchSpaceCategory('school')}
                className="px-4 py-2.5 text-xs font-bold text-indigo-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Switch to Crown Heights School Portal →</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ENROLLED SCHOOL STUDENT BANNER */
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-indigo-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>School Space · Enrolled Student Portal</span>
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {myStudent.admissionNo} · {myStudent.classLevel} - {myStudent.arm}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {branding.schoolName}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                Enrolled Class: <strong>JSS 2 Diamond</strong> · Form Master: <strong>Mr. O. Fanimo</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => switchSpaceCategory('personal')}
                className="px-4 py-2.5 text-xs font-bold text-blue-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Switch to Personal Study Room →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ENVIRONMENT CONTENT                                                    */}
      {/* ========================================================================= */}
      {isPersonal ? (
        /* PERSONAL LEARNER ROOM */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="Hi David! 🤖 I'm your 24/7 AI Study Buddy in your personal space. Ask me to explain any maths theorem, give you a 5-question science quiz, or test your English vocabulary!"
          />

          {/* Personal Practice Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigateTab('cbt')}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">WAEC & BECE Practice Drills</h3>
              <p className="text-xs text-slate-500 mb-3">Instant CBT mode with real past examination questions and step-by-step explanations.</p>
              <span className="text-xs font-bold text-blue-700 inline-flex items-center gap-1">
                <span>Start Practice Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('timetable')}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">Evening Revision Timetable</h3>
              <p className="text-xs text-slate-500 mb-3">Structured 45-minute daily home study schedule coordinated with family hub.</p>
              <span className="text-xs font-bold text-purple-700 inline-flex items-center gap-1">
                <span>View Study Routine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={onOpenResultChecker}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">Check Result with PIN</h3>
              <p className="text-xs text-slate-500 mb-3">Enter your 12-digit scratch card PIN to verify any school terminal report.</p>
              <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <span>Open PIN Checker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* ENROLLED SCHOOL STUDENT VIEW */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="Hi David! 🤖 Need help with today's homework at Crown Heights Academy? Ask me for a quick practice quiz or simple explanation!"
          />

          {/* Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                My Term 1 Average
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-2xl text-indigo-950">{myStudent.termAverage}%</span>
                <span className="text-xs font-semibold text-emerald-700">Grade: A1</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Leading in Mathematics & Basic Science</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                School Attendance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-2xl text-emerald-700">{myStudent.attendanceRate}%</span>
                <span className="text-xs font-semibold text-emerald-700">Punctual</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Present on 58 of 60 term days</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Class Position
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-2xl text-purple-900">
                  {myStudent.positionInClass}nd / {myStudent.totalStudentsInClass}
                </span>
                <span className="text-xs font-semibold text-purple-700">Top 5%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Recommended for Academic Merit Award</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">My Official Report Card</h3>
              <p className="text-xs text-slate-500">
                View verified term grades, subject positions, and teacher remarks digitally approved by the Principal.
              </p>
              <button
                onClick={onOpenResultChecker}
                className="w-full py-2.5 px-4 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View My Report Card</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">School CBT Exam Portal</h3>
              <p className="text-xs text-slate-500">
                Take scheduled continuous assessment quizzes and mock examinations online with instant score breakdown.
              </p>
              <button
                onClick={() => onNavigateTab('cbt')}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Take School CBT Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
