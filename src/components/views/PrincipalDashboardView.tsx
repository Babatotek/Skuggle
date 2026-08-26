import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  DollarSign,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Building,
  FileSpreadsheet,
  Send,
  ArrowRight,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Award
} from 'lucide-react';
import { SetupProgressBanner } from '../../features/onboarding/SetupProgressBanner';
import { appConfig } from '@/app/config';
import { useAuth } from '@/features/auth/AuthProvider';

interface PrincipalDashboardViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const PrincipalDashboardView: React.FC<PrincipalDashboardViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'Principal';
  const schoolName = user?.tenant?.name ?? 'your school';
  const [selectedTerm, setSelectedTerm] = useState('First Term, 2026/2027');

  const classAverages = [
    { name: 'JSS 1', avg: 65.2, target: 70, students: 210, trend: '+2.4%' },
    { name: 'JSS 2', avg: 69.4, target: 70, students: 204, trend: '+3.1%' },
    { name: 'JSS 3', avg: 71.8, target: 72, students: 198, trend: '+1.8%' },
    { name: 'SS 1', avg: 66.5, target: 70, students: 220, trend: '+0.9%' },
    { name: 'SS 2', avg: 72.3, target: 75, students: 212, trend: '+4.2%' },
    { name: 'SS 3', avg: 74.1, target: 75, students: 204, trend: '+5.0%' },
  ];

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <SetupProgressBanner onNavigateTab={onNavigateTab} />
        <div className="mt-6 mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">{schoolName} — school-wide analytics will populate once students, staff, and academic sessions are set up.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Academics', tab: 'academics', desc: 'Class performance, subjects and curriculum compliance' },
            { icon: CheckCircle2, label: 'Attendance', tab: 'attendance', desc: 'School-wide daily attendance overview' },
            { icon: DollarSign, label: 'Finance', tab: 'finance', desc: 'Fee collection, payroll and revenue tracking' },
            { icon: Briefcase, label: 'Staff', tab: 'staff', desc: 'Faculty roster, CPD and leave management' },
            { icon: FileSpreadsheet, label: 'Reports', tab: 'reports', desc: 'Broadsheets, compliance and board dossiers' },
            { icon: Send, label: 'Communication', tab: 'communication', desc: 'Broadcast SMS, announcements and parent messages' },
          ].map(({ icon: Icon, label, tab, desc }) => (
            <button key={label} type="button" onClick={() => onNavigateTab(tab)}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></div>
              <div><p className="text-sm font-bold text-slate-900">{label}</p><p className="mt-0.5 text-xs text-slate-500">{desc}</p></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      <SetupProgressBanner onNavigateTab={onNavigateTab} />

      {/* Top Banner & Principal Executive Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Good morning, Mrs. Adeyemi <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Executive Leadership & School Intelligence Dashboard • Royal Gateway Academy
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Royal Gateway Academy</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <span>{selectedTerm}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button
            onClick={() => onOpenModal('report_card')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Executive Summary</span>
          </button>

          <button
            onClick={() => onOpenModal('onboarding_wizard')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition-all hover:shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Announcement</span>
          </button>
        </div>
      </div>

      {/* 6 Executive Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Total Enrolment */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer hover:border-indigo-200 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Total Enrolment</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">1,248</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>6.3% vs last session</span>
            </p>
          </div>
        </div>

        {/* Card 2: Overall Attendance */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer hover:border-emerald-200 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Overall Attendance</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">93.4%</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>1.2% vs last term</span>
            </p>
          </div>
        </div>

        {/* Card 3: School Average */}
        <div
          onClick={() => onNavigateTab('academics')}
          className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer hover:border-blue-200 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">School Average</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">68.7%</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>3.1% vs mid-term</span>
            </p>
          </div>
        </div>

        {/* Card 4: Teaching Staff */}
        <div
          onClick={() => onNavigateTab('staff')}
          className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer hover:border-purple-200 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Teaching Staff</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">64 / 64</p>
            <p className="text-[10.5px] text-purple-600 font-semibold mt-0.5">
              100% Present Today
            </p>
          </div>
        </div>

        {/* Card 5: Fee Collection */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer hover:border-amber-200 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Fee Collection</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">78.4%</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              ₦42.1M / ₦53.7M
            </p>
          </div>
        </div>

        {/* Card 6: Pending Approvals */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer hover:border-rose-200 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Pending Approvals</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-0.5">14</p>
            <p className="text-[10.5px] text-rose-600 font-semibold mt-0.5">
              Results & requisitions
            </p>
          </div>
        </div>

      </div>

      {/* Row 2: Academic Performance by Class + Assessment Status + Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Academic Performance by Class (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Academic Performance by Class</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">All Classes</span>
          </div>

          <div className="space-y-3">
            {classAverages.map((cls) => (
              <div key={cls.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{cls.name} ({cls.students} students)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{cls.avg}%</span>
                    <span className="text-[10.5px] text-emerald-600 font-semibold">{cls.trend}</span>
                  </div>
                </div>
                {/* Horizontal bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${cls.avg}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Status (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Assessment Status</h3>
              <span className="text-xs font-semibold text-indigo-600">First Term</span>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Continuous Assessment 1</span>
                  <span className="font-bold text-emerald-700">100% Completed</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">48 of 48 classes compiled and verified</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">Continuous Assessment 2</span>
                  <span className="font-bold text-blue-700">88% In Progress</span>
                </div>
                <p className="text-[11px] text-blue-700 mt-1">42 of 48 classes submitted to date</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900">Mid-Term Mock Exams</span>
                  <span className="font-bold text-purple-700">100% Graded</span>
                </div>
                <p className="text-[11px] text-purple-700 mt-1">SmartMark OMR sheets digitized</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenModal('smartmark_scan')}
            className="w-full pt-3 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1"
          >
            <span>Open Assessment Control Hub</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Executive Action Items (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Leadership Actions</h3>
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                14
              </span>
            </div>

            <div className="space-y-2.5">
              <div
                onClick={() => onNavigateTab('academics')}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-bold text-slate-800">8 Result Sheets Awaiting Sign-off</p>
                </div>
                <p className="text-[10.5px] text-slate-500 mt-0.5">JSS 2 and SSS 1 term averages</p>
              </div>

              <div
                onClick={() => onNavigateTab('staff')}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-bold text-slate-800">4 Staff Leave Requests</p>
                </div>
                <p className="text-[10.5px] text-slate-500 mt-0.5">Approved by Vice Principal</p>
              </div>

              <div
                onClick={() => onNavigateTab('attendance')}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-bold text-slate-800">2 Academic Intervention Flags</p>
                </div>
                <p className="text-[10.5px] text-slate-500 mt-0.5">Low attendance follow-up</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('academics')}
            className="w-full pt-3 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:underline text-center cursor-pointer"
          >
            Review All Approvals →
          </button>
        </div>

      </div>

    </div>
  );
};
