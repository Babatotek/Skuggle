import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Users,
  Building,
  GraduationCap,
  Clock,
  Send,
  Eye,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Check,
  X,
  PhoneCall,
  MessageSquare,
  Sparkles,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ADMIN_BROADSHEET_SUBJECTS,
  ADMIN_MOCK_BROADSHEET,
  CLASS_PERFORMANCE_SUMMARIES,
  OUTSTANDING_FEES_LIST,
  STAFF_COMPLIANCE_LIST,
  ATTENDANCE_WEEKLY_TRENDS,
  INITIAL_SCHOOL_SETTINGS,
  BroadsheetStudentEntry,
  OutstandingFeeRecord,
} from '../../data/adminMockData';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface SchoolAdminReportsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const SchoolAdminReportsView: React.FC<SchoolAdminReportsViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  // Navigation tabs within Reports
  const [activeReportTab, setActiveReportTab] = useState<
    'broadsheet' | 'performance' | 'attendance' | 'finance' | 'staff' | 'demographics'
  >('broadsheet');

  // Filter states
  const [selectedSession, setSelectedSession] = useState('2026/2027');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedClass, setSelectedClass] = useState('SSS 2 Diamond');
  const [searchQuery, setSearchQuery] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'All' | 'Overdue' | 'Unpaid' | 'Partial'>('All');

  // Broadsheet Print / Preview Modal State
  const [showBroadsheetModal, setShowBroadsheetModal] = useState(false);
  const [selectedStudentSlip, setSelectedStudentSlip] = useState<BroadsheetStudentEntry | null>(null);

  // Toast feedback
// Filtered Broadsheet students
  const filteredStudents = useMemo(() => {
    return ADMIN_MOCK_BROADSHEET.filter((s) => {
      const matchSearch =
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [searchQuery]);

  // Filtered Outstanding Fees
  const filteredFees = useMemo(() => {
    return OUTSTANDING_FEES_LIST.filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.parentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = feeStatusFilter === 'All' || item.status === feeStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchQuery, feeStatusFilter]);

  // Grade breakdown distribution for chart
  const gradeDistributionData = [
    { grade: 'A1 (75-100%)', count: 18, fill: '#10B981' },
    { grade: 'B2 (70-74%)', count: 9, fill: '#14B8A6' },
    { grade: 'B3 (65-69%)', count: 6, fill: '#3B82F6' },
    { grade: 'C4-C6 (50-64%)', count: 4, fill: '#6366F1' },
    { grade: 'D7-E8 (40-49%)', count: 1, fill: '#F59E0B' },
    { grade: 'F9 (0-39%)', count: 0, fill: '#EF4444' },
  ];

  // Payment channel distribution data
  const paymentChannelData = [
    { name: 'Paystack Online', value: 54, color: '#00C4DF' },
    { name: 'Direct Bank Transfer', value: 36, color: '#6366F1' },
    { name: 'Monnify Gateway', value: 8, color: '#0EA5E9' },
    { name: 'POS / Cash Desk', value: 2, color: '#F59E0B' },
  ];

  // Handle Export Broadsheet CSV
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Admission No',
      'Student Name',
      'Gender',
      'Class Arm',
      ...ADMIN_BROADSHEET_SUBJECTS.map((s) => `${s.code} Total`),
      'Total Marks',
      'Average (%)',
      'GPA',
      'Status',
      'Attendance Rate (%)',
    ];

    const rows = filteredStudents.map((s) => [
      s.position,
      s.admissionNo,
      `"${s.studentName}"`,
      s.gender,
      `"${s.classArm}"`,
      ...ADMIN_BROADSHEET_SUBJECTS.map((sub) => s.subjectScores[sub.code]?.total || 0),
      s.totalMarks,
      s.average.toFixed(2),
      s.gpa.toFixed(2),
      s.status,
      s.attendanceRate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Broadsheet_${selectedClass.replace(/\s+/g, '_')}_${selectedTerm.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    feedbackBus.success('Broadsheet spreadsheet downloaded successfully in CSV format!');
  };

  // Handle Print Broadsheet
  const handlePrint = () => {
    window.print();
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Broadsheets, fee default lists, staff compliance, and attendance reports will be available once students, results, and payments are recorded.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No report data yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Complete school setup — add students, record assessments, and publish results to generate reports and broadsheets.</p>
          <button type="button" onClick={() => onNavigateTab('dashboard')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              School Administration Intelligence & Reports
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Academic & Institutional Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate terminal broadsheets, financial revenue audits, attendance analytics, and ministry compliance scorecards.
          </p>
        </div>

        {/* Global Selectors & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Session Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Session:</span>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
            </select>
          </div>

          {/* Term Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            <span>Term:</span>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          {/* Master Broadsheet Print Modal trigger */}
          <button
            onClick={() => setShowBroadsheetModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Official Broadsheet Preview</span>
          </button>

          {/* Download CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'broadsheet', label: 'Master Broadsheet', icon: FileSpreadsheet, badge: 'Official' },
          { id: 'performance', label: 'Academic Performance', icon: Award, count: '6 Classes' },
          { id: 'attendance', label: 'Attendance & Punctuality', icon: Clock, count: '97.2%' },
          { id: 'finance', label: 'Tuition & Fee Revenue', icon: DollarSign, badge: '₦364.2M' },
          { id: 'staff', label: 'Staff Submission Compliance', icon: Users, count: '94% On-time' },
          { id: 'demographics', label: 'Enrollment & Demographics', icon: GraduationCap, count: '1,248' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {tab.count && (
                <span
                  className={`text-[11px] font-normal ${
                    isActive ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MASTER BROADSHEET */}
      {/* ========================================================================= */}
      {activeReportTab === 'broadsheet' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Class Arm:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="SSS 2 Diamond">SSS 2 Diamond (Science)</option>
                  <option value="SSS 2 Gold">SSS 2 Gold (Commercial)</option>
                  <option value="SSS 3 Platinum">SSS 3 Platinum (General)</option>
                  <option value="SSS 1 Ruby">SSS 1 Ruby</option>
                  <option value="JSS 3 Emerald">JSS 3 Emerald</option>
                  <option value="JSS 2 Sapphire">JSS 2 Sapphire</option>
                  <option value="JSS 1 Topaz">JSS 1 Topaz</option>
                </select>
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or admission no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium self-end md:self-auto">
              <span>Showing <strong>{filteredStudents.length}</strong> students</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-bold">Class Average: 83.2%</span>
            </div>
          </div>

          {/* Master Broadsheet Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Master Broadsheet Ledger ({selectedClass} — {selectedTerm}, {selectedSession})
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Continuous Assessment (40%) + Exam (60%) = 100%
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="py-3 px-3 sticky left-0 bg-slate-100/90 z-10">Pos</th>
                    <th className="py-3 px-3 sticky left-10 bg-slate-100/90 z-10">Adm No.</th>
                    <th className="py-3 px-4 sticky left-32 bg-slate-100/90 z-10">Student Full Name</th>
                    <th className="py-3 px-2 text-center">Sex</th>
                    {ADMIN_BROADSHEET_SUBJECTS.map((sub) => (
                      <th key={sub.code} className="py-3 px-2 text-center border-l border-slate-200/60" title={sub.name}>
                        <div className="font-extrabold text-slate-800">{sub.code}</div>
                        <div className="text-[9px] text-slate-400 font-normal">/100</div>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center border-l border-slate-200 font-extrabold text-indigo-700 bg-indigo-50/50">Total</th>
                    <th className="py-3 px-3 text-center font-extrabold text-indigo-700 bg-indigo-50/50">Avg %</th>
                    <th className="py-3 px-2 text-center font-extrabold text-indigo-700 bg-indigo-50/50">GPA</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => (
                    <tr
                      key={st.studentId}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedStudentSlip(st)}
                    >
                      <td className="py-3 px-3 font-extrabold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            st.position === 1
                              ? 'bg-amber-100 text-amber-800 font-black'
                              : st.position === 2
                              ? 'bg-slate-200 text-slate-700 font-bold'
                              : st.position === 3
                              ? 'bg-amber-50 text-amber-700 font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          {st.position}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-500 text-[11px] sticky left-10 bg-white group-hover:bg-slate-50">
                        {st.admissionNo}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors sticky left-32 bg-white group-hover:bg-slate-50">
                        {st.studentName}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            st.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {st.gender === 'Male' ? 'M' : 'F'}
                        </span>
                      </td>

                      {/* Subject Scores with Grade Pills */}
                      {ADMIN_BROADSHEET_SUBJECTS.map((sub) => {
                        const scoreData = st.subjectScores[sub.code];
                        const total = scoreData?.total ?? 0;
                        const grade = scoreData?.grade ?? '-';
                        const isHigh = total >= 75;
                        const isLow = total < 50;

                        return (
                          <td key={sub.code} className="py-2 px-2 text-center border-l border-slate-100 font-medium">
                            <div className={`font-bold ${isHigh ? 'text-emerald-700' : isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                              {total}
                            </div>
                            <div className="text-[9.5px] font-bold text-slate-400">{grade}</div>
                          </td>
                        );
                      })}

                      {/* Totals & Averages */}
                      <td className="py-3 px-3 text-center border-l border-slate-200 font-black text-indigo-900 bg-indigo-50/30">
                        {st.totalMarks}
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-indigo-700 bg-indigo-50/30">
                        {st.average.toFixed(1)}%
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-indigo-900 bg-indigo-50/30">
                        {st.gpa.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.status === 'Promoted' || st.status === 'Passed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedStudentSlip(st)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Result Slip"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Analytical Chart Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Grade Frequency Distribution Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Grade Frequency Distribution</h3>
                  <p className="text-xs text-slate-500">Distribution of WAEC letter grades across subjects in {selectedClass}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Mastery Leaderboard */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Subject Mastery Ranking</h3>
                  <p className="text-xs text-slate-500">Average score per subject discipline in {selectedClass}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { subject: 'Data Processing & ICT', avg: 89.2, pass: 100, color: 'emerald' },
                  { subject: 'Civic Education', avg: 85.8, pass: 100, color: 'emerald' },
                  { subject: 'Mathematics', avg: 82.5, pass: 97.4, color: 'blue' },
                  { subject: 'English Language', avg: 81.8, pass: 98.2, color: 'blue' },
                  { subject: 'Chemistry', avg: 79.4, pass: 94.5, color: 'indigo' },
                  { subject: 'Physics', avg: 77.2, pass: 92.0, color: 'amber' },
                  { subject: 'Further Mathematics', avg: 74.0, pass: 86.8, color: 'rose' },
                ].map((item, idx) => (
                  <div key={item.subject} className="flex items-center justify-between gap-3 text-xs">
                    <div className="w-44 font-semibold text-slate-700 truncate">{item.subject}</div>
                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.color === 'emerald'
                            ? 'bg-emerald-500'
                            : item.color === 'blue'
                            ? 'bg-blue-500'
                            : item.color === 'indigo'
                            ? 'bg-indigo-500'
                            : item.color === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.avg}%` }}
                      />
                    </div>
                    <div className="w-14 text-right font-bold text-slate-900">{item.avg}%</div>
                    <div className="w-16 text-right text-[11px] font-semibold text-emerald-600">
                      {item.pass}% pass
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACADEMIC PERFORMANCE (ALL CLASSES COMPARISON) */}
      {/* ========================================================================= */}
      {activeReportTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLASS_PERFORMANCE_SUMMARIES.map((cls) => (
              <div
                key={cls.classLevel}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{cls.classLevel}</h3>
                    <p className="text-xs text-slate-500">{cls.totalStudents} enrolled students</p>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold">
                    {cls.passRate}% Pass Rate
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <p className="text-slate-400 text-[11px]">Class Average</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{cls.classAverage}%</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <p className="text-slate-400 text-[11px]">Avg Attendance</p>
                    <p className="text-lg font-black text-indigo-600 mt-0.5">{cls.averageAttendance}%</p>
                  </div>
                </div>

                {/* Top Performer Card */}
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl flex items-center justify-between text-xs mt-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Top Student</p>
                      <p className="font-bold text-slate-900">{cls.topStudent.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-800">{cls.topStudent.average}%</span>
                  </div>
                </div>

                {/* Subject Highlights */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Subject Averages</p>
                  {cls.subjectAverages.slice(0, 3).map((sub) => (
                    <div key={sub.subject} className="flex items-center justify-between text-slate-600">
                      <span>{sub.subject}</span>
                      <span className="font-bold text-slate-900">{sub.average}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ATTENDANCE & PUNCTUALITY */}
      {/* ========================================================================= */}
      {activeReportTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Top Stat Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-slate-500 font-medium">Average School Attendance</p>
              <p className="text-2xl font-black text-slate-900 mt-1">97.2%</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Target: &gt;95.0%</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-slate-500 font-medium">Daily Present Average</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">1,213</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">out of 1,248 students</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-slate-500 font-medium">Teacher Attendance Rate</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">98.2%</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">47 of 48 staff on site</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-slate-500 font-medium">Chronic Absenteeism Flag</p>
              <p className="text-2xl font-black text-amber-600 mt-1">14</p>
              <p className="text-[11px] text-amber-700 font-medium mt-1">Under 85% attendance</p>
            </div>
          </div>

          {/* Weekly Attendance Trend Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly School Attendance Velocity</h3>
                <p className="text-xs text-slate-500">Daily student present count & teacher attendance trends</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Students Attendance (%)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Staff Attendance (%)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ATTENDANCE_WEEKLY_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="dayName" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="attendanceRate" name="Student Rate %" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudents)" />
                  <Area type="monotone" dataKey="teacherAttendanceRate" name="Teacher Rate %" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTeachers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TUITION & FEE REVENUE */}
      {/* ========================================================================= */}
      {activeReportTab === 'finance' && (
        <div className="space-y-6">
          
          {/* Revenue Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-slate-500 font-medium">Total Term Invoiced</p>
              <p className="text-2xl font-black text-slate-900 mt-1">₦428,500,000</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">1,248 students billed</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-slate-500 font-medium">Revenue Collected (85%)</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">₦364,225,000</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Verified via Paystack & Bank</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-slate-500 font-medium">Outstanding Balances</p>
              <p className="text-2xl font-black text-rose-600 mt-1">₦64,275,000</p>
              <p className="text-[11px] text-rose-600 font-medium mt-1">182 students with arrears</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-slate-500 font-medium">PTA & Development Levy</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">₦49,920,000</p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">100% remitted to school trust</p>
            </div>
          </div>

          {/* Outstanding Fees Table with 1-click SMS / WhatsApp Reminder */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Fee Defaulters & Outstanding Balances</h3>
                <p className="text-xs text-slate-500">Track and dispatch payment reminders to parents</p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Filter:</span>
                {(['All', 'Overdue', 'Unpaid', 'Partial'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFeeStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      feeStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4">Student & Adm No.</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-4">Parent / Contact</th>
                    <th className="py-3 px-3 text-right">Total Billed</th>
                    <th className="py-3 px-3 text-right">Amount Paid</th>
                    <th className="py-3 px-3 text-right">Outstanding</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{fee.studentName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{fee.admissionNo}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{fee.classArm}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{fee.parentName}</p>
                        <p className="text-[11px] text-slate-500">{fee.parentPhone}</p>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        ₦{fee.totalFee.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-600">
                        ₦{fee.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">
                        ₦{fee.outstandingBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            fee.status === 'Cleared'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : fee.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {fee.outstandingBalance > 0 ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() =>
                                feedbackBus.success(`SMS fee reminder dispatched to ${fee.parentName} (${fee.parentPhone})`)
                              }
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Send SMS Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                feedbackBus.success(`WhatsApp payment invoice link sent to ${fee.parentPhone}`)
                              }
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Send WhatsApp Invoice"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STAFF SUBMISSION COMPLIANCE */}
      {/* ========================================================================= */}
      {activeReportTab === 'staff' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Teaching Staff Academic Compliance</h3>
                <p className="text-xs text-slate-500">Track lesson plan submissions, mark entry status, and class attendance</p>
              </div>
              <button
                onClick={() => feedbackBus.success('All pending teachers sent a submission reminder notification!')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Staff Reminder</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4">Staff Name & ID</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Assigned Subjects</th>
                    <th className="py-3 px-3 text-center">Lesson Plan %</th>
                    <th className="py-3 px-3 text-center">Gradebook Status</th>
                    <th className="py-3 px-3 text-center">Marking Progress</th>
                    <th className="py-3 px-3 text-center">Staff Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {STAFF_COMPLIANCE_LIST.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{staff.staffName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{staff.staffId} • {staff.role}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{staff.department}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {staff.subjectsTaught.map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10.5px] font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-black ${
                            staff.lessonPlanCompliance >= 90
                              ? 'text-emerald-600'
                              : staff.lessonPlanCompliance >= 80
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {staff.lessonPlanCompliance}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            staff.gradebookSubmissionStatus === 'Submitted'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : staff.gradebookSubmissionStatus === 'Pending Review'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {staff.gradebookSubmissionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {staff.markedPapersCount} / {staff.totalAssignedPapers}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                        {staff.attendanceRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ENROLLMENT & DEMOGRAPHICS */}
      {/* ========================================================================= */}
      {activeReportTab === 'demographics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Gender Demographics</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-blue-700">Male Students (672)</span>
                    <span className="text-slate-900 font-bold">53.8%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '53.8%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-pink-700">Female Students (576)</span>
                    <span className="text-slate-900 font-bold">46.2%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: '46.2%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Residency Classification</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-indigo-700">Day Students (948)</span>
                    <span className="text-slate-900 font-bold">76.0%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '76%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-amber-700">Boarding House (300)</span>
                    <span className="text-slate-900 font-bold">24.0%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '24%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Academic Tier Distribution</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Senior Secondary (SSS 1 - 3)</span>
                  <span className="font-bold text-slate-900">686 students (55%)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Junior Secondary (JSS 1 - 3)</span>
                  <span className="font-bold text-slate-900">562 students (45%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: OFFICIAL BROADSHEET PRINT PREVIEW */}
      {/* ========================================================================= */}
      {showBroadsheetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Official Ministry Broadsheet Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowBroadsheetModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official School Header */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {INITIAL_SCHOOL_SETTINGS.general.schoolName}
              </h2>
              <p className="text-xs font-semibold text-slate-600 italic">
                "{INITIAL_SCHOOL_SETTINGS.general.motto}"
              </p>
              <p className="text-xs text-slate-500">
                {INITIAL_SCHOOL_SETTINGS.general.address}, {INITIAL_SCHOOL_SETTINGS.general.state} | Tel: {INITIAL_SCHOOL_SETTINGS.general.phone}
              </p>
              <div className="inline-block mt-2 px-4 py-1 bg-slate-900 text-white text-xs font-black tracking-wider uppercase rounded-full">
                MASTER ACADEMIC BROADSHEET LEDGER — {selectedTerm}, {selectedSession}
              </div>
              <p className="text-xs font-bold text-slate-700 mt-1">
                Class: {selectedClass} • Class Form Tutor: Mr. B. Adewale
              </p>
            </div>

            {/* Broadsheet Printable Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-black text-[11px] border-b border-slate-300">
                    <th className="p-2 text-center border-r border-slate-300">Rank</th>
                    <th className="p-2 border-r border-slate-300">Adm No.</th>
                    <th className="p-2 border-r border-slate-300">Student Name</th>
                    {ADMIN_BROADSHEET_SUBJECTS.map((s) => (
                      <th key={s.code} className="p-2 text-center border-r border-slate-300">{s.code}</th>
                    ))}
                    <th className="p-2 text-center border-r border-slate-300 font-extrabold">Total</th>
                    <th className="p-2 text-center border-r border-slate-300 font-extrabold">Average</th>
                    <th className="p-2 text-center font-extrabold">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ADMIN_MOCK_BROADSHEET.map((st) => (
                    <tr key={st.studentId} className="even:bg-slate-50">
                      <td className="p-2 text-center font-bold border-r border-slate-300">{st.position}</td>
                      <td className="p-2 font-mono text-[11px] border-r border-slate-300">{st.admissionNo}</td>
                      <td className="p-2 font-bold border-r border-slate-300">{st.studentName}</td>
                      {ADMIN_BROADSHEET_SUBJECTS.map((s) => (
                        <td key={s.code} className="p-2 text-center border-r border-slate-300 font-semibold">
                          {st.subjectScores[s.code]?.total || 0}
                        </td>
                      ))}
                      <td className="p-2 text-center font-black border-r border-slate-300 text-indigo-900">{st.totalMarks}</td>
                      <td className="p-2 text-center font-bold border-r border-slate-300">{st.average.toFixed(1)}%</td>
                      <td className="p-2 text-center font-bold text-emerald-700">{st.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature & Authentication Footer */}
            <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-800">Mr. B. Adewale</p>
                <p className="text-slate-500 text-[11px]">Class Form Tutor Signature / Date</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-800">Mrs. B. Adeyemi</p>
                <p className="text-slate-500 text-[11px]">Principal / Head of School Stamp</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-800">Lagos State Ministry of Basic Education</p>
                <p className="text-slate-500 text-[11px]">Accreditation & Approval Verification</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INDIVIDUAL STUDENT RESULT SLIP PREVIEW */}
      {/* ========================================================================= */}
      {selectedStudentSlip && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Individual Terminal Result Slip</h3>
              </div>
              <button
                onClick={() => setSelectedStudentSlip(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info Box */}
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="text-sm font-black text-slate-900">{selectedStudentSlip.studentName}</p>
                <p className="text-slate-500 font-mono mt-0.5">{selectedStudentSlip.admissionNo} • {selectedStudentSlip.classArm}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-700">Rank: #{selectedStudentSlip.position} of {selectedStudentSlip.totalStudentsInClass}</span>
                <p className="text-slate-500 mt-0.5">Average: <strong>{selectedStudentSlip.average.toFixed(1)}%</strong></p>
              </div>
            </div>

            {/* Score Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5 text-center">CA (40)</th>
                    <th className="p-2.5 text-center">Exam (60)</th>
                    <th className="p-2.5 text-center">Total (100)</th>
                    <th className="p-2.5 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ADMIN_BROADSHEET_SUBJECTS.map((sub) => {
                    const score = selectedStudentSlip.subjectScores[sub.code];
                    return (
                      <tr key={sub.code}>
                        <td className="p-2.5 font-semibold text-slate-800">{sub.name}</td>
                        <td className="p-2.5 text-center text-slate-600">{score?.ca || 0}</td>
                        <td className="p-2.5 text-center text-slate-600">{score?.exam || 0}</td>
                        <td className="p-2.5 text-center font-bold text-slate-900">{score?.total || 0}</td>
                        <td className="p-2.5 text-center font-bold text-indigo-600">{score?.grade || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Teacher Conduct Remark */}
            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs">
              <p className="font-bold text-amber-900 mb-1">Form Tutor Conduct Remark:</p>
              <p className="text-slate-700 italic">"{selectedStudentSlip.conductRemark}"</p>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Student Slip</span>
              </button>
              <button
                onClick={() => setSelectedStudentSlip(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
