import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Calendar,
  Sparkles,
  Scan,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  Users,
  Award,
  BookCheck,
  Brain,
  Share2,
  Download,
  Building2,
  User,
  Check,
  Plus,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';

interface TeacherDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateTab }) => {
  const {
    branding,
    currentWorkspace,
    currentUser,
    switchSpaceCategory,
    teacherProfile,
    lessonPlans,
    showToast,
  } = useApp();

  const isPersonal = currentWorkspace.type === 'personal';
  const schoolWorkspace = currentUser.availableWorkspaces.find((workspace) => workspace.type === 'school');
  const teacherName = currentUser.fullName || 'Teacher';
  const profileFields = [teacherProfile.phone, teacherProfile.curriculumUsed, teacherProfile.qualifications, teacherProfile.location];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  // State for personal tutoring demo cohort
  const [tutoringStudents] = useState<Array<{ id: string; name: string; subject: string; level: string; status: string; nextSession: string }>>([]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP DUAL-WORKSPACE IDENTITY BANNER                                     */}
      {/* ========================================================================= */}
      {isPersonal ? (
        /* PERSONAL TEACHING STUDIO BANNER */
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-300" />
                  <span>My Skuggle · Personal Teaching Space</span>
                </span>
                {teacherProfile.qualifications.toLowerCase().includes('trcn') && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  TRCN Certified Educator
                </span>}
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {teacherName}&apos;s Personal Teaching Space
              </h1>
              <p className="text-xs sm:text-sm text-purple-200 mt-1">
                Private lesson planning, reusable resources, professional growth and tutoring tools
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {schoolWorkspace && <button
                onClick={() => switchSpaceCategory('school')}
                className="px-4 py-2.5 text-xs font-bold text-indigo-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Switch to {schoolWorkspace.name} →</span>
              </button>}
            </div>
          </div>
        </div>
      ) : (
        /* SCHOOL CLASSROOM EDUCATOR BANNER */
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-indigo-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>School Space · Institutional Portal</span>
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {branding.schoolCode} · {branding.academicSession} ({branding.currentTerm})
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {branding.schoolName}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                Assigned Responsibilities: <strong>Form Master (JSS 2 Diamond)</strong> & <strong>Subject Teacher (Mathematics)</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => switchSpaceCategory('personal')}
                className="px-4 py-2.5 text-xs font-bold text-purple-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Switch to Personal Teaching Studio →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ENVIRONMENT-SPECIFIC CONTENT                                           */}
      {/* ========================================================================= */}
      {isPersonal ? (
        /* ======================================================================= */
        /* PERSONAL TEACHING SPACE ENVIRONMENT                                     */
        /* ======================================================================= */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="Independent Studio Assistant: I can help you draft 40-minute NERDC lesson plans for any grade, generate custom BECE/WAEC questions, or manage private tutoring notes."
          />

          {/* Personal Studio KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Saved Lesson Plans
              </span>
              <div className="font-display font-extrabold text-2xl text-purple-950">
                {lessonPlans.length}
              </div>
              <span className="text-[10px] text-purple-700 font-semibold">Private drafts</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Tutoring Students
              </span>
              <div className="font-display font-extrabold text-2xl text-indigo-950">
                {tutoringStudents.length}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">Private learners</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Question Bank
              </span>
              <div className="font-display font-extrabold text-2xl text-slate-900">
                0
              </div>
              <span className="text-[10px] text-slate-500 font-medium">MCQ & Theory Items</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Teaching CV
              </span>
              <div className="font-display font-extrabold text-2xl text-emerald-700">
                {profileCompletion}%
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">Profile completion</span>
            </div>
          </div>

          {/* Quick Personal Studio Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigateTab('teacher-ai')}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">AI Lesson Planner</h3>
              <p className="text-xs text-slate-500 mb-3">Generate curriculum-grounded lesson plans with behavioral objectives and evaluation questions.</p>
              <span className="text-xs font-bold text-purple-700 inline-flex items-center gap-1">
                <span>Create New Lesson Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('cbt')}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">Personal Question Bank & CBT</h3>
              <p className="text-xs text-slate-500 mb-3">Build diagnostic quizzes, practice sets, and auto-marking online assessments.</p>
              <span className="text-xs font-bold text-indigo-700 inline-flex items-center gap-1">
                <span>Open Question Bank</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('smartmark')}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Scan className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">SmartMark Optical Scan</h3>
              <p className="text-xs text-slate-500 mb-3">Grade physical multiple-choice bubble sheets instantly using camera computer vision.</p>
              <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <span>Scan Answer Sheets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* Private Tutoring Students Cohort Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Private Tutoring Cohorts</h3>
                <p className="text-xs text-slate-500">Track independent students, study routines, and upcoming sessions.</p>
              </div>
              <button
                onClick={() => showToast('Cohort Added', 'New private student profile created.')}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {tutoringStudents.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><p className="text-sm font-bold text-slate-800">No private tutoring learners yet</p><p className="mt-1 text-xs text-slate-500">Add a learner when ready. Personal tutoring information stays private and never enters a school workspace automatically.</p></div>}
              {tutoringStudents.map((tut) => (
                <div key={tut.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-xs">
                      {tut.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{tut.name}</strong>
                      <span className="text-[11px] text-slate-500">
                        {tut.subject} · {tut.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      🕒 {tut.nextSession}
                    </span>
                    <button
                      onClick={() => onNavigateTab('teacher-ai')}
                      className="px-3 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                    >
                      Lesson Prep
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================================= */
        /* SCHOOL CLASSROOM EDUCATOR ENVIRONMENT                                   */
        /* ======================================================================= */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="School Teacher Assistant: I can help you record roll call for JSS 2 Diamond, compile 1st CA test marks, or draft terminal report card remarks."
          />

          {/* School Teacher KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Form Class
              </span>
              <div className="font-display font-extrabold text-2xl text-indigo-950">
                JSS 2 Diamond
              </div>
              <span className="text-[10px] text-indigo-700 font-semibold">32 Enrolled Students</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Today's Roll Call
              </span>
              <div className="font-display font-extrabold text-2xl text-emerald-700">
                Marked
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">30 Present · 2 Absent</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                CA Score Progress
              </span>
              <div className="font-display font-extrabold text-2xl text-amber-700">
                85%
              </div>
              <span className="text-[10px] text-amber-700 font-semibold">1st CA Test Completed</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Report Comments
              </span>
              <div className="font-display font-extrabold text-2xl text-slate-900">
                24 / 32
              </div>
              <span className="text-[10px] text-slate-500 font-medium">8 Pending Sign-off</span>
            </div>
          </div>

          {/* School Teacher Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">Daily Roll Call</h3>
              <p className="text-xs text-slate-500 mb-3">1-tap attendance marking for JSS 2 Diamond with offline resilience.</p>
              <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <span>Open Attendance Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('assessments')}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">Continuous Assessment</h3>
              <p className="text-xs text-slate-500 mb-3">Input CA1 (20mks), CA2 (20mks), and Exam (60mks) marks for Mathematics.</p>
              <span className="text-xs font-bold text-indigo-700 inline-flex items-center gap-1">
                <span>Enter Class Scores</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('report-cards')}
              className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">Class Report Cards</h3>
              <p className="text-xs text-slate-500 mb-3">Add teacher remarks, behavioral traits, and submit report cards to Principal.</p>
              <span className="text-xs font-bold text-purple-700 inline-flex items-center gap-1">
                <span>Manage Remarks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* Today's School Schedule */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900">Today's Teaching Schedule at {branding.schoolName}</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center text-xs">
                    08:30
                  </div>
                  <div>
                    <strong className="text-xs text-slate-900 font-bold">Mathematics (Linear Equations & Graphs)</strong>
                    <span className="text-xs text-slate-500 block">JSS 2 Diamond · Room 14 (Science Wing)</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('assessments')}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer"
                >
                  Open Score Sheet
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-xs">
                    10:30
                  </div>
                  <div>
                    <strong className="text-xs text-slate-900 font-bold">Basic Science (Digestive & Excretory System)</strong>
                    <span className="text-xs text-slate-500 block">JSS 1 Gold · Science Laboratory</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('teacher-ai')}
                  className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl cursor-pointer"
                >
                  View Lesson Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
