import React from 'react';
import {
  ShieldCheck,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';
import { AcademicAndTeacherAnalytics } from './AcademicAndTeacherAnalytics';
import { DashboardStack } from '../../components/dashboard/DashboardPrimitives';
import { Button, StatusBadge, MetricCard } from '../../components/ui';

interface PrincipalDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onNavigateTab }) => {
  const { branding, students = [], assessments = [] } = useApp();

  const safeAssessments = assessments || [];
  const approvedCount = safeAssessments.filter((a) => a.status?.toLowerCase() === 'approved').length;
  const pendingApproval = safeAssessments.filter(
    (a) => a.status?.toLowerCase() === 'submitted' || a.status?.toLowerCase() === 'draft',
  ).length;

  return (
    <DashboardStack>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-emerald-800/40">
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

          <Button
            variant="outline"
            size="sm"
            className="bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => onNavigateTab('results')}
          >
            Review Result Approvals
          </Button>
        </div>
      </div>

      <SkuggleAIBuddy
        variant="inline"
        contextHint="Principal assistance: I can suggest intervention plans for at-risk JSS 2 students, or draft teacher guidance notes for term approvals."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Assessment Status"
          value={`${approvedCount} Approved`}
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="primary"
          subtitle={`${pendingApproval} pending approval`}
          onClick={() => onNavigateTab('results')}
        />
        <MetricCard
          label="Academic Attainment"
          value="79.4%"
          trend={{ value: '+4.2%', direction: 'up', label: 'YoY' }}
          icon={<Award className="w-5 h-5" />}
          variant="success"
          subtitle="School-wide term examination mean"
        />
        <MetricCard
          label="Student Attendance"
          value="93.8%"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="default"
          subtitle="Daily register compliance rate"
          onClick={() => onNavigateTab('attendance')}
        />
      </div>

      {/* Visual Analytics Summary: Student Academic Trends & Teacher Activity */}
      <AcademicAndTeacherAnalytics onNavigateTab={onNavigateTab} />

      {/* Assessment Approvals Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-slate-900">
            Pending Subject Assessment Approvals
          </h3>
          <Button
            variant="ghost"
            size="xs"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => onNavigateTab('academics')}
          >
            Review Curriculum
          </Button>
        </div>

        <div className="space-y-3">
          {assessments.map((asm) => (
            <div
              key={asm.id}
              className="p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-900 font-bold">{asm.subject}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 font-semibold">{asm.classLevel}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Submitted by: {asm.teacherName} · Term Score Sheet</p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge
                  status={asm.status === 'Approved' ? 'Approved & Locked' : 'Pending Principal Approval'}
                  variant={asm.status === 'Approved' ? 'success' : 'warning'}
                />
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => onNavigateTab('assessments')}
                >
                  Inspect Scores
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardStack>
  );
};
