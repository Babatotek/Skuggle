import React from 'react';
import {
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  TrendingUp,
  Brain,
  Building2,
  User,
  Clock,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';
import { Button, StatusBadge, MetricCard } from '../../components/ui';

interface StudentDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenResultChecker: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateTab, onOpenResultChecker }) => {
  const { branding, students, currentWorkspace, currentUser, switchSpaceCategory } = useApp();
  const myStudent = students[0];
  const isPersonal = currentWorkspace.type === 'personal';
  const firstName = currentUser.fullName.trim().split(/\s+/)[0] || 'Student';
  const schoolWorkspace = currentUser.availableWorkspaces.find((workspace) => workspace.type === 'school');

  return (
    <div className="space-y-6">
      {/* 1. IDENTITY BANNER */}
      {isPersonal ? (
        /* PERSONAL LEARNER ROOM BANNER */
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-blue-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-300" />
                  <span>Personal Space · Independent Study Hub</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{currentUser.teachingGrowthStreak || 0}-Day Study Streak</span>
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {firstName}&apos;s Personal Study Room
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">
                AI Learning Buddy, WAEC & BECE Question Drills, and Personal Flashcards
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {schoolWorkspace && (
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white text-indigo-950 hover:bg-slate-100 font-bold"
                  leftIcon={<Building2 className="w-4 h-4 text-indigo-600" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => switchSpaceCategory('school')}
                >
                  Switch to {schoolWorkspace.name}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ENROLLED SCHOOL STUDENT BANNER */
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-indigo-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>School Space · Enrolled Student Portal</span>
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {myStudent?.admissionNo || 'Student'} · {myStudent?.classLevel || 'Class pending'}{' '}
                  {myStudent?.arm ? `- ${myStudent.arm}` : ''}
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
              <Button
                variant="outline"
                size="md"
                className="bg-white text-blue-950 hover:bg-slate-100 font-bold"
                leftIcon={<Sparkles className="w-4 h-4 text-blue-600" />}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => switchSpaceCategory('personal')}
              >
                Switch to Personal Study Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ENVIRONMENT CONTENT */}
      {isPersonal ? (
        /* PERSONAL LEARNER ROOM */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint={`Hi ${firstName}! I'm your AI Study Buddy. Ask for an explanation, practice quiz, or study plan.`}
          />

          {/* Personal Practice Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTab('cbt')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-blue-100">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">WAEC & BECE Practice Drills</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Instant CBT mode with real past examination questions and step-by-step explanations.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 inline-flex items-center gap-1">
                <span>Start Practice Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('timetable')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-purple-100">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">Evening Revision Timetable</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Structured 45-minute daily home study schedule coordinated with family hub.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-700 inline-flex items-center gap-1">
                <span>View Study Routine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={onOpenResultChecker}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-emerald-100">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">Check Result with PIN</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Enter your 12-digit scratch card PIN to verify any school terminal report.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <span>Open PIN Checker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ENROLLED SCHOOL STUDENT VIEW */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint={`Hi ${firstName}! Need help with today's homework at ${branding.schoolName}? Ask for a practice quiz or explanation.`}
          />

          {/* Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="My Term 1 Average"
              value={`${myStudent?.termAverage ?? 0}%`}
              icon={<Award className="w-5 h-5" />}
              variant="primary"
              subtitle="Leading in Mathematics & Science"
              onClick={onOpenResultChecker}
            />
            <MetricCard
              label="School Attendance"
              value={`${myStudent?.attendanceRate ?? 0}%`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="success"
              subtitle="Present on 58 of 60 days"
              onClick={() => onNavigateTab('attendance')}
            />
            <MetricCard
              label="Class Position"
              value={`${myStudent?.positionInClass ?? '—'} / ${myStudent?.totalStudentsInClass ?? '—'}`}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="default"
              subtitle="Top 5% · Academic Merit Award"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">My Official Report Card</h3>
                <p className="text-xs text-slate-500 mb-3">
                  View verified term grades, subject positions, and teacher remarks digitally approved by the Principal.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full"
                onClick={onOpenResultChecker}
              >
                View My Report Card
              </Button>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 mb-3">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">School CBT Exam Portal</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Take scheduled continuous assessment quizzes and mock examinations online with instant score breakdown.
                </p>
              </div>
              <Button
                variant="secondary"
                size="md"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full"
                onClick={() => onNavigateTab('cbt')}
              >
                Take School CBT Quiz
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
