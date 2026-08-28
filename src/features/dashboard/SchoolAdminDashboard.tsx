import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  GraduationCap,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  PlusCircle,
  UserPlus,
  BookOpen,
  BarChart3,
  Maximize2,
  X,
  Flame,
  Award,
  Layers,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';
import { CollapsibleCard } from '../../components/CollapsibleCard';
import { AcademicAndTeacherAnalytics } from './AcademicAndTeacherAnalytics';

interface SchoolAdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({ onNavigateTab }) => {
  const { branding, students = [], staff = [], checklistItems = [], toggleChecklistItem, assessments = [], feeTransactions = [], showToast } = useApp();

  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(true);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const safeChecklist = checklistItems || [];
  const completedCount = safeChecklist.filter((i) => i.status === 'completed' || (i as any).isCompleted).length;
  const checklistPercentage = safeChecklist.length > 0 ? Math.round((completedCount / safeChecklist.length) * 100) : 0;

  const totalStudents = (students || []).length;
  const totalStaff = (staff || []).length;
  const avgAttendance = Math.round(
    (students || []).reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / ((students || []).length || 1)
  );
  const totalFeeCollected = (feeTransactions || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / School Profile */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-indigo-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                School Administrator Workspace
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {branding.academicSession} · {branding.currentTerm}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {branding.schoolName}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
              {branding.motto ? `"${branding.motto}" · ` : ''}
              Lekki Campus · Standard NERDC Nigerian Curriculum
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('branding')}
              className="px-3.5 py-2 text-xs font-bold text-indigo-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
            >
              School Branding
            </button>
            <button
              onClick={() => onNavigateTab('results')}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
            >
              Issue Result PINs
            </button>
          </div>
        </div>
      </div>

      {/* Skuggle AI Inline Context Helper */}
      <SkuggleAIBuddy
        variant="inline"
        contextHint="Administrator assistance: I can draft new-term circulars, check unassigned subjects, or summarize your fee collections."
      />

      {/* KPI Metric Cards — Placed immediately after Skuggle AI Buddy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">{totalStudents}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active enrolled students</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Attendance</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">{avgAttendance}%</span>
            <span className={`text-xs font-semibold ${avgAttendance >= 75 ? 'text-emerald-700' : 'text-amber-600'}`}>
              {avgAttendance >= 90 ? 'Excellent' : avgAttendance >= 75 ? 'Good' : 'Needs attention'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Average across all active students</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">{totalStaff}</span>
            <span className="text-xs font-semibold text-slate-600">All active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Teachers & Form Masters</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Collection</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">
              ₦{totalFeeCollected >= 1_000_000
                ? `${(totalFeeCollected / 1_000_000).toFixed(2)}M`
                : totalFeeCollected >= 1_000
                ? `${(totalFeeCollected / 1_000).toFixed(0)}K`
                : totalFeeCollected.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tuition, ICT & Lab levies collected</p>
        </div>
      </div>

      {/* Academic & Faculty Analytics Matrix — Bar Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-indigo-900/60 shadow-md transition-all hover:border-indigo-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-display font-bold text-lg sm:text-xl text-white tracking-tight">
                  Academic & Faculty Analytics Matrix
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/25 text-indigo-200 border border-indigo-400/30">
                  {branding.academicSession || '2025/2026'} · {branding.currentTerm || 'First Term'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Flame className="w-3 h-3 text-amber-400" />
                  5 Significant Shifts
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Real-time correlation of student learning trajectories, subject velocity shifts, and teacher pedagogical pacing.
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip & View Details Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Attainment</span>
                <span className="font-bold text-white text-sm">80.8%</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Distinctions</span>
                <span className="font-bold text-emerald-400 text-sm">40.0%</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Faculty Pacing</span>
                <span className="font-bold text-purple-300 text-sm">96.5%</span>
              </div>
            </div>

            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs cursor-pointer select-none"
            >
              <Maximize2 className="w-4 h-4 text-indigo-600" />
              <span>View Full Analytics Matrix & Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* School Operational Launch Checklist using CollapsibleCard */}
      <CollapsibleCard
        id="school-launch-checklist-card"
        title="School Operational Launch Checklist"
        subtitle="Sequential progress milestones for term readiness, curriculum configuration, and academic launch."
        icon={<Layers className="w-5 h-5 text-indigo-700" />}
        badge={`${checklistPercentage}% Completed (${completedCount}/${safeChecklist.length} Steps)`}
        badgeVariant={checklistPercentage === 100 ? 'success' : 'default'}
        defaultOpen={true}
        headerActions={
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-28 sm:w-36 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${checklistPercentage}%` }}
              />
            </div>
          </div>
        }
        padding="md"
        className="border-slate-200 shadow-xs"
      >
        <div className="pt-2">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3.5 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
            {safeChecklist.map((item, index) => {
              const isDone = item.status === 'completed' || (item as any).isCompleted;
              const stepNum = item.stepNumber || index + 1;

              return (
                <div key={item.id} className="relative group">
                  {/* Stepper Node Icon */}
                  <button
                    type="button"
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer z-10 ${
                      isDone
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-xs'
                        : 'bg-white border-2 border-slate-300 text-slate-600 group-hover:border-indigo-500 group-hover:text-indigo-600 ring-4 ring-white'
                    }`}
                    title={isDone ? 'Click to mark incomplete' : 'Click to mark completed'}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                  </button>

                  {/* Step Card */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-50/30 border-emerald-200/80 hover:bg-emerald-50/50'
                        : 'bg-slate-50/50 border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Step {stepNum} of {safeChecklist.length}
                          </span>
                          {(item.required || (item as any).requiredForLaunch) && (
                            <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                              Required for Launch
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isDone ? 'Completed' : 'Pending'}
                          </span>
                        </div>

                        <h4
                          className={`text-sm font-bold ${
                            isDone ? 'text-emerald-950 line-through opacity-85' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                          {item.description}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        {item.id === 'step-branding' && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('branding')}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                          >
                            Configure
                          </button>
                        )}
                        {item.id === 'step-students' && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('students')}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                          >
                            Enroll
                          </button>
                        )}
                        {item.id === 'step-academics' && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('academics')}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                          >
                            Curriculum
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:border-indigo-500 hover:text-indigo-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isDone ? 'Mark Done' : 'Mark as Done'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CollapsibleCard>

      {/* Quick Access Grid: Frequent Actions & Active Assessment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900 mb-2">Frequent Actions</h3>

          <button
            onClick={() => onNavigateTab('students')}
            className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Student Register</span>
                <span className="text-[11px] text-slate-500">Admissions, bio-data & guardian info</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigateTab('academics')}
            className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Academic Curriculum & Subjects</span>
                <span className="text-[11px] text-slate-500">NERDC Subject allocations & weightings</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigateTab('attendance')}
            className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Attendance & Daily Roll</span>
                <span className="text-[11px] text-slate-500">1-Tap roll call & daily trends tab</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Right: Academic Status Overview */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-slate-900">
              Active Assessment Status ({branding.currentTerm})
            </h3>
            <button
              onClick={() => onNavigateTab('assessments')}
              className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
            >
              View All Score Sheets →
            </button>
          </div>

          <div className="space-y-3">
            {assessments.map((asm) => (
              <div
                key={asm.id}
                className="p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{asm.subject}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium">
                      {asm.classLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Teacher: {asm.teacherName} · Continuous Assessment & Terminal Exam
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      asm.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : asm.status === 'Submitted'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {asm.status === 'Approved'
                      ? 'Approved & Locked'
                      : asm.status === 'Submitted'
                      ? 'Submitted for Review'
                      : 'Draft In Progress'}
                  </span>
                  <button
                    onClick={() => onNavigateTab('assessments')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-lg cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wide Modal for Academic & Faculty Analytics Matrix */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-7xl w-full max-h-[92vh] flex flex-col overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg text-white">
                      Academic & Faculty Analytics Matrix
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Live Diagnostics
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Comprehensive cross-sectional examination of student cohorts, subject mastery, and educator pacing.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50">
              <AcademicAndTeacherAnalytics
                onNavigateTab={(tab) => {
                  setShowAnalyticsModal(false);
                  onNavigateTab(tab);
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Press ESC or click close to return to dashboard</span>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
