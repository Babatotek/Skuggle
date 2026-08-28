import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Users,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';
import { AcademicAndTeacherAnalytics } from './AcademicAndTeacherAnalytics';
import { DashboardStack } from '../../components/dashboard/DashboardPrimitives';

interface PrincipalDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onNavigateTab }) => {
  const { branding, students = [], assessments = [] } = useApp();

  const safeAssessments = assessments || [];
  const approvedCount = safeAssessments.filter((a) => a.status?.toLowerCase() === 'approved').length;
  const pendingApproval = safeAssessments.filter((a) => a.status?.toLowerCase() === 'submitted' || a.status?.toLowerCase() === 'draft').length;

  return (
    <DashboardStack>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Principal & Academic Leadership Workspace
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {branding.academicSession} · {branding.currentTerm}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {branding.schoolName}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1">
              Academic Governance, Teacher Lesson Note Approvals & Performance Audits
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('results')}
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm"
          >
            Review Result Approvals
          </button>
        </div>
      </div>

      <SkuggleAIBuddy
        variant="inline"
        contextHint="Principal assistance: I can suggest intervention plans for at-risk JSS 2 students, or draft teacher guidance notes for term approvals."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Assessment Status
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">{approvedCount} Approved</span>
            <span className="text-xs font-semibold text-amber-700">({pendingApproval} pending)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for terminal report generation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Academic Performance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-emerald-700">79.4%</span>
            <span className="text-xs font-semibold text-emerald-700">+4.2% YoY</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">School-wide term examination mean</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Student Attendance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">93.8%</span>
            <span className="text-xs font-semibold text-emerald-700">Normal Range</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Daily register compliance rate</p>
        </div>
      </div>

      {/* Visual Analytics Summary: Student Academic Trends & Teacher Activity */}
      <AcademicAndTeacherAnalytics onNavigateTab={onNavigateTab} />

      {/* Assessment Approvals Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-slate-900">
            Pending Subject Assessment Approvals
          </h3>
          <button
            onClick={() => onNavigateTab('academics')}
            className="text-xs font-bold text-indigo-700 hover:underline"
          >
            Review Curriculum →
          </button>
        </div>

        <div className="space-y-3">
          {assessments.map((asm) => (
            <div
              key={asm.id}
              className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs text-slate-900 font-bold">{asm.subject}</strong>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 font-semibold">{asm.classLevel}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Submitted by: {asm.teacherName} · Term Score Sheet</p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    asm.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {asm.status === 'Approved' ? 'Approved & Locked' : 'Pending Principal Approval'}
                </span>
                <button
                  onClick={() => onNavigateTab('assessments')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl"
                >
                  Inspect Scores
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardStack>
  );
};
