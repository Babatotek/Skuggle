import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Filter,
  Layers,
  Printer,
  Search,
  ShieldCheck,
  TrendingUp,
  Building,
  GraduationCap,
  Sparkles,
  Send,
  Check,
  X,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface PrincipalReportsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

const HISTORICAL_EXAM_TRENDS = [
  { session: '2022/2023', waecPassRate: 88.5, becePassRate: 92.1, universityPlacement: 86.0 },
  { session: '2023/2024', waecPassRate: 91.2, becePassRate: 94.5, universityPlacement: 89.2 },
  { session: '2024/2025', waecPassRate: 93.8, becePassRate: 95.8, universityPlacement: 92.5 },
  { session: '2025/2026', waecPassRate: 96.4, becePassRate: 97.2, universityPlacement: 94.8 },
  { session: '2026/2027 (Proj)', waecPassRate: 98.2, becePassRate: 98.5, universityPlacement: 96.5 }
];

const COMPLIANCE_REPORTS = [
  {
    title: 'State Ministry of Education Termly Academic Return',
    format: 'PDF / Form ED-402',
    due: '30 Oct 2026',
    status: 'Ready for Principal Signature',
    badgeColor: 'bg-emerald-100 text-emerald-800'
  },
  {
    title: 'Annual School Census (ASC) Demographic Dossier',
    format: 'CSV / Federal MOE Portal',
    due: '15 Nov 2026',
    status: 'Data Validated (100%)',
    badgeColor: 'bg-indigo-100 text-indigo-800'
  },
  {
    title: 'WAEC / NECO Senior School Certificate Centre Re-Accreditation',
    format: 'Dossier / Inspection Pack',
    due: '01 Dec 2026',
    status: 'Accredited (Grade A)',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  {
    title: 'BECE Junior Secondary Exam Candidate Master Roster',
    format: 'NIMIS Format / State Board',
    due: '10 Nov 2026',
    status: '198 Candidates Verified',
    badgeColor: 'bg-emerald-100 text-emerald-800'
  }
];

export const PrincipalReportsView: React.FC<PrincipalReportsViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'broadsheets' | 'compliance' | 'trends' | 'board'>('broadsheets');
  const [selectedClass, setSelectedClass] = useState('SSS 3 Science');

  const handleBulkSignAndSeal = () => {
    feedbackBus.success('Official Principal Digital Stamp & Signature applied to all 1,248 Terminal Report Cards.');
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Broadsheets, compliance reports, and board dossiers will be available once students have results published for the current term.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No reports available yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Publish term results to generate broadsheets, class summaries, and performance analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[11px] uppercase tracking-wide">
              Strategic Intelligence & Governance Reports
            </span>
            <span className="text-xs text-slate-400 font-medium">Session: 2026/2027</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Institutional Reports, Broadsheets & Statutory Returns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Master grade broadsheet compilation, Ministry of Education statutory filings, WAEC/NECO accreditation audits, and Board of Governors briefings.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleBulkSignAndSeal}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-200 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sign & Seal All Report Cards</span>
          </button>

          <button
            onClick={() => onOpenModal('report_card')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Master Broadsheets</span>
          </button>
        </div>
      </div>

      {/* 6 Executive Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Ministry Inspection */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Ministry Inspection</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">96 / 100</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              Grade A (Gold Standard)
            </p>
          </div>
        </div>

        {/* Card 2: Broadsheets Generated */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Broadsheets Ready</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">24 / 24</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              100% Class Arms Compiled
            </p>
          </div>
        </div>

        {/* Card 3: Report Cards Delivered */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Reports Dispatched</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">1,192</p>
            <p className="text-[10.5px] text-purple-600 font-semibold mt-0.5">
              95.5% delivered via portal
            </p>
          </div>
        </div>

        {/* Card 4: Exam Eligibility */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">WAEC / NECO Status</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-0.5">100%</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              204 Candidates Enrolled
            </p>
          </div>
        </div>

        {/* Card 5: Student Retention */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Student Retention</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">97.2%</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              +1.8% Session-on-Session
            </p>
          </div>
        </div>

        {/* Card 6: JSS to SSS Transition */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">JSS → SSS Transition</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">98.4%</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              High internal loyalty
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          id="tab-principal-reports-broadsheets"
          onClick={() => setActiveSubTab('broadsheets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'broadsheets'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Master Broadsheet Generator</span>
        </button>

        <button
          id="tab-principal-reports-compliance"
          onClick={() => setActiveSubTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'compliance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Statutory & Ministry Compliance Filings</span>
        </button>

        <button
          id="tab-principal-reports-trends"
          onClick={() => setActiveSubTab('trends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'trends'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>5-Year National Exam Trends (WAEC / BECE)</span>
        </button>

        <button
          id="tab-principal-reports-board"
          onClick={() => setActiveSubTab('board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'board'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Board of Governors Briefing Dossier</span>
        </button>
      </div>

      {/* SUB-TAB 1: BROADSHEETS */}
      {activeSubTab === 'broadsheets' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Unified Terminal Academic Broadsheet Exporter</h3>
              <p className="text-xs text-slate-500">Includes CA (30%), Exam (70%), Position in Class & Year, and Official Stamp.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
              >
                <option value="SSS 3 Science">SSS 3 Science (52 Students)</option>
                <option value="SSS 3 Arts">SSS 3 Arts (48 Students)</option>
                <option value="SSS 2 Science">SSS 2 Science (53 Students)</option>
                <option value="JSS 3A">JSS 3A (50 Students)</option>
                <option value="JSS 1A">JSS 1A (52 Students)</option>
              </select>

              <button
                onClick={() => onOpenModal('report_card', { classArm: selectedClass })}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Class Broadsheet</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>{selectedClass} Broadsheet Ready for Terminal Publication</span>
              <span className="text-emerald-600">✓ Principal Sealed</span>
            </div>
            <p className="text-slate-600">
              All continuous assessments (CA1, CA2, CA3) and final terminal exam scores have been verified against raw answer sheets and OMR scans. Form Teacher & Principal comments attached.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: COMPLIANCE FILINGS */}
      {activeSubTab === 'compliance' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">State & Federal Ministry Compliance Filings</h3>
              <p className="text-xs text-slate-500">Official statutory records and examination council verification dossiers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPLIANCE_REPORTS.map((rep, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${rep.badgeColor}`}>
                    {rep.status}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">{rep.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">Format: {rep.format} • Due Date: <strong>{rep.due}</strong></p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Official Filing Ready</span>
                  <button
                    onClick={() => {
                      feedbackBus.success(`Downloaded ${rep.title} packet.`);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Filing</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: 5-YEAR EXAM TRENDS */}
      {activeSubTab === 'trends' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">5-Year National Examination Pass Rate Trajectory</h3>
            <p className="text-xs text-slate-500">WAEC (Senior) vs BECE (Junior) pass rates (&ge;5 Credits including Maths & English) & University Admissions.</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HISTORICAL_EXAM_TRENDS} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="session" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="waecPassRate" name="WAEC Pass Rate %" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="becePassRate" name="BECE Pass Rate %" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="universityPlacement" name="Direct University Placement %" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: BOARD DOSSIER */}
      {activeSubTab === 'board' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Board of Governors Executive Briefing Dossier</h3>
              <p className="text-xs text-slate-500">Comprehensive term summary aggregating academics, enrolment, financial surplus, and infrastructure progress.</p>
            </div>

            <button
              onClick={() => onOpenModal('report_card')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-purple-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Board Briefing Pack (PDF)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400">Total Enrolment</span>
              <p className="text-xl font-bold text-slate-900">1,248 Students</p>
              <p className="text-emerald-600 font-semibold">+6.3% Year-on-Year</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400">Term Gross Revenue</span>
              <p className="text-xl font-bold text-slate-900">₦184.2M</p>
              <p className="text-emerald-600 font-semibold">85.1% Collected</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400">Overall Academic Mean</span>
              <p className="text-xl font-bold text-slate-900">72.8%</p>
              <p className="text-purple-600 font-semibold">94.6% Pass Rate</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400">Faculty Licensure</span>
              <p className="text-xl font-bold text-slate-900">96.5%</p>
              <p className="text-blue-600 font-semibold">56 / 58 TRCN Certified</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
