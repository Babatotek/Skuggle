import React, { useState } from 'react';
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
  Building2,
  User,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';
import { Button, StatusBadge, MetricCard } from '../../components/ui';

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
  const profileFields = [
    teacherProfile.phone,
    teacherProfile.curriculumUsed,
    teacherProfile.qualifications,
    teacherProfile.location,
  ];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const [tutoringStudents] = useState<
    Array<{ id: string; name: string; subject: string; level: string; status: string; nextSession: string }>
  >([]);

  return (
    <div className="space-y-6">
      {/* 1. TOP DUAL-WORKSPACE IDENTITY BANNER */}
      {isPersonal ? (
        /* PERSONAL TEACHING STUDIO BANNER */
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-purple-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-300" />
                  <span>My Skuggle · Personal Teaching Space</span>
                </span>
                {teacherProfile.qualifications.toLowerCase().includes('trcn') && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    TRCN Certified Educator
                  </span>
                )}
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {teacherName}&apos;s Personal Teaching Space
              </h1>
              <p className="text-xs sm:text-sm text-purple-200 mt-1">
                Private lesson planning, reusable resources, professional growth and tutoring tools
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
        /* SCHOOL CLASSROOM EDUCATOR BANNER */
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-indigo-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
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
                Assigned Responsibilities: <strong>Form Master (JSS 2 Diamond)</strong> &{' '}
                <strong>Subject Teacher (Mathematics)</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="md"
                className="bg-white text-purple-950 hover:bg-slate-100 font-bold"
                leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => switchSpaceCategory('personal')}
              >
                Switch to Personal Teaching Studio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ENVIRONMENT-SPECIFIC CONTENT */}
      {isPersonal ? (
        /* PERSONAL TEACHING SPACE ENVIRONMENT */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="Independent Studio Assistant: I can help you draft 40-minute NERDC lesson plans for any grade, generate custom BECE/WAEC questions, or manage private tutoring notes."
          />

          {/* Personal Studio KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              label="Saved Lesson Plans"
              value={lessonPlans.length}
              icon={<Sparkles className="w-5 h-5" />}
              variant="primary"
              subtitle="Private drafts"
              onClick={() => onNavigateTab('teacher-ai')}
            />
            <MetricCard
              label="Tutoring Students"
              value={tutoringStudents.length}
              icon={<Users className="w-5 h-5" />}
              variant="default"
              subtitle="Private learners"
            />
            <MetricCard
              label="Question Bank"
              value={0}
              icon={<Brain className="w-5 h-5" />}
              variant="default"
              subtitle="MCQ & Theory items"
              onClick={() => onNavigateTab('cbt')}
            />
            <MetricCard
              label="Teaching CV"
              value={`${profileCompletion}%`}
              icon={<Award className="w-5 h-5" />}
              variant="success"
              subtitle="Profile completion"
            />
          </div>

          {/* Quick Personal Studio Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTab('teacher-ai')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">AI Lesson Planner</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Generate curriculum-grounded lesson plans with behavioral objectives and evaluation questions.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-700 inline-flex items-center gap-1">
                <span>Create New Lesson Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('cbt')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">Personal Question Bank & CBT</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Build diagnostic quizzes, practice sets, and auto-marking online assessments.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 inline-flex items-center gap-1">
                <span>Open Question Bank</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('smartmark')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Scan className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">SmartMark Optical Scan</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Grade physical multiple-choice bubble sheets instantly using camera computer vision.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <span>Scan Answer Sheets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Private Tutoring Students Cohort Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Private Tutoring Cohorts</h3>
                <p className="text-xs text-slate-500">Track independent students, study routines, and upcoming sessions.</p>
              </div>
              <Button
                variant="subtle"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => showToast('Cohort Added', 'New private student profile created.', 'success')}
              >
                Add Student
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {tutoringStudents.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <p className="text-sm font-bold text-slate-800">No private tutoring learners yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add a learner when ready. Personal tutoring information stays private and never enters a school workspace automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SCHOOL CLASSROOM EDUCATOR ENVIRONMENT */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="School Teacher Assistant: I can help you record roll call for JSS 2 Diamond, compile 1st CA test marks, or draft terminal report card remarks."
          />

          {/* School Teacher KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              label="Form Class"
              value="JSS 2 Diamond"
              icon={<Users className="w-5 h-5" />}
              variant="primary"
              subtitle="32 Enrolled Students"
              onClick={() => onNavigateTab('students')}
            />
            <MetricCard
              label="Today's Roll Call"
              value="Marked"
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="success"
              subtitle="30 Present · 2 Absent"
              onClick={() => onNavigateTab('attendance')}
            />
            <MetricCard
              label="CA Score Progress"
              value="85%"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              variant="warning"
              subtitle="1st CA Test Completed"
              onClick={() => onNavigateTab('assessments')}
            />
            <MetricCard
              label="Report Comments"
              value="24 / 32"
              icon={<Award className="w-5 h-5" />}
              variant="default"
              subtitle="8 Pending Sign-off"
              onClick={() => onNavigateTab('report-cards')}
            />
          </div>

          {/* School Teacher Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTab('attendance')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">Daily Roll Call</h3>
                <p className="text-xs text-slate-500 mb-3">1-tap attendance marking for JSS 2 Diamond with offline resilience.</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <span>Open Attendance Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('assessments')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">Continuous Assessment</h3>
                <p className="text-xs text-slate-500 mb-3">Input CA1 (20mks), CA2 (20mks), and Exam (60mks) marks for Mathematics.</p>
              </div>
              <span className="text-xs font-bold text-indigo-700 inline-flex items-center gap-1">
                <span>Enter Class Scores</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('report-cards')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1">Class Report Cards</h3>
                <p className="text-xs text-slate-500 mb-3">Add teacher remarks, behavioral traits, and submit report cards to Principal.</p>
              </div>
              <span className="text-xs font-bold text-purple-700 inline-flex items-center gap-1">
                <span>Manage Remarks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Today's School Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900">
              Today&apos;s Teaching Schedule at {branding.schoolName}
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-100/80 shrink-0">
                    08:30
                  </div>
                  <div>
                    <strong className="text-xs text-slate-900 font-bold">Mathematics (Linear Equations & Graphs)</strong>
                    <span className="text-xs text-slate-500 block">JSS 2 Diamond · Room 14 (Science Wing)</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onNavigateTab('assessments')}
                >
                  Open Score Sheet
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-xs border border-purple-100/80 shrink-0">
                    10:30
                  </div>
                  <div>
                    <strong className="text-xs text-slate-900 font-bold">Basic Science (Digestive & Excretory System)</strong>
                    <span className="text-xs text-slate-500 block">JSS 1 Gold · Science Laboratory</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onNavigateTab('teacher-ai')}
                >
                  View Lesson Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
