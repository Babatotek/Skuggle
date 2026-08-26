import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
  Check,
  X,
  FileText,
  Clock,
  ArrowUpRight,
  BarChart2,
  PieChart as PieChartIcon,
  ShieldCheck,
  Building,
  UserCheck,
  Send
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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface PrincipalAcademicsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface ClassPerformanceRow {
  id: string;
  classArm: string;
  level: string;
  students: number;
  averageScore: number;
  passRate: number;
  distinctionRate: number;
  caSubmissionRate: number;
  hod: string;
  status: 'Approved' | 'Pending Sign-off' | 'Review Required';
  topSubject: string;
  laggingSubject: string;
}

const CLASS_PERFORMANCE_DATA: ClassPerformanceRow[] = [
  {
    id: 'cls_1',
    classArm: 'JSS 1 (All Arms A-D)',
    level: 'Junior Secondary',
    students: 210,
    averageScore: 68.4,
    passRate: 92.5,
    distinctionRate: 24.2,
    caSubmissionRate: 100,
    hod: 'Mr. Adewale / Mrs. Eze',
    status: 'Approved',
    topSubject: 'Basic Science (74.2%)',
    laggingSubject: 'Mathematics (62.1%)'
  },
  {
    id: 'cls_2',
    classArm: 'JSS 2 (All Arms A-D)',
    level: 'Junior Secondary',
    students: 204,
    averageScore: 71.2,
    passRate: 94.8,
    distinctionRate: 28.0,
    caSubmissionRate: 100,
    hod: 'Mr. Adewale / Mr. Bello',
    status: 'Approved',
    topSubject: 'English Language (76.8%)',
    laggingSubject: 'Business Studies (64.5%)'
  },
  {
    id: 'cls_3',
    classArm: 'JSS 3 (BECE Candidates)',
    level: 'Junior Secondary',
    students: 198,
    averageScore: 74.6,
    passRate: 96.4,
    distinctionRate: 32.5,
    caSubmissionRate: 100,
    hod: 'Dr. Okon (Junior Head)',
    status: 'Approved',
    topSubject: 'Basic Technology (79.0%)',
    laggingSubject: 'French (66.2%)'
  },
  {
    id: 'cls_4',
    classArm: 'SSS 1 (Science / Arts / Comm)',
    level: 'Senior Secondary',
    students: 220,
    averageScore: 69.8,
    passRate: 91.0,
    distinctionRate: 25.5,
    caSubmissionRate: 95,
    hod: 'Mrs. Folashade (Science Head)',
    status: 'Pending Sign-off',
    topSubject: 'Civic Education (78.4%)',
    laggingSubject: 'Further Maths (58.9%)'
  },
  {
    id: 'cls_5',
    classArm: 'SSS 2 (Science / Arts / Comm)',
    level: 'Senior Secondary',
    students: 212,
    averageScore: 73.5,
    passRate: 95.2,
    distinctionRate: 31.0,
    caSubmissionRate: 100,
    hod: 'Engr. Ibrahim (Senior Head)',
    status: 'Approved',
    topSubject: 'Economics (78.6%)',
    laggingSubject: 'Chemistry (65.4%)'
  },
  {
    id: 'cls_6',
    classArm: 'SSS 3 (WAEC / NECO Cohort)',
    level: 'Senior Secondary',
    students: 204,
    averageScore: 78.4,
    passRate: 98.2,
    distinctionRate: 41.5,
    caSubmissionRate: 100,
    hod: 'Dr. (Mrs.) Adeyemi / Lead Tutors',
    status: 'Approved',
    topSubject: 'Physics (82.1%)',
    laggingSubject: 'English Literature (70.2%)'
  }
];

const SUBJECT_PERFORMANCE_DISTRIBUTION = [
  { subject: 'Mathematics', average: 69.5, pass: 91, distinction: 26 },
  { subject: 'English Lang', average: 75.4, pass: 97, distinction: 34 },
  { subject: 'Physics', average: 78.2, pass: 96, distinction: 38 },
  { subject: 'Chemistry', average: 71.0, pass: 92, distinction: 29 },
  { subject: 'Biology', average: 74.8, pass: 95, distinction: 32 },
  { subject: 'Economics', average: 76.2, pass: 96, distinction: 35 },
  { subject: 'Civic Edu', average: 81.0, pass: 99, distinction: 46 },
  { subject: 'Basic Tech', average: 77.5, pass: 96, distinction: 37 }
];

const GRADE_BAND_DATA = [
  { name: 'A1 (75-100%)', value: 385, color: '#10B981' },
  { name: 'B2-B3 (65-74%)', value: 462, color: '#6366F1' },
  { name: 'C4-C6 (50-64%)', value: 315, color: '#F59E0B' },
  { name: 'D7-E8 (40-49%)', value: 68, color: '#EC4899' },
  { name: 'F9 (<40%)', value: 18, color: '#EF4444' }
];

const CURRICULUM_COMPLIANCE = [
  { department: 'Sciences & STEM', syllabusProgress: 82, lessonPlansSubmitted: 100, practicalsHeld: 16, targetPracticals: 18 },
  { department: 'Humanities & Languages', syllabusProgress: 79, lessonPlansSubmitted: 96, practicalsHeld: 12, targetPracticals: 12 },
  { department: 'Commercial & Social Sciences', syllabusProgress: 85, lessonPlansSubmitted: 98, practicalsHeld: 8, targetPracticals: 8 },
  { department: 'Vocational & Technical', syllabusProgress: 76, lessonPlansSubmitted: 92, practicalsHeld: 14, targetPracticals: 16 },
  { department: 'Junior Foundations', syllabusProgress: 84, lessonPlansSubmitted: 100, practicalsHeld: 20, targetPracticals: 20 }
];

export const PrincipalAcademicsView: React.FC<PrincipalAcademicsViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'broadsheet' | 'subjects' | 'curriculum' | 'intervention'>('broadsheet');
  const [selectedTerm, setSelectedTerm] = useState('First Term, 2026/2027');
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Junior' | 'Senior'>('All');

  const handleApproveAllGradebooks = () => {
    feedbackBus.success('Official Principal Academic Sign-Off applied to all 24 class arms. Gradebooks locked & published for Broad-sheet compilation.');
  };

  const filteredClassData = CLASS_PERFORMANCE_DATA.filter((cls) => {
    if (selectedLevel === 'Junior') return cls.level === 'Junior Secondary';
    if (selectedLevel === 'Senior') return cls.level === 'Senior Secondary';
    return true;
  });

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Academic Governance</h1>
          <p className="text-sm text-slate-500 mt-1">Class performance data, subject analytics, and curriculum compliance will populate once the school term is in progress and assessments are recorded.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No academic data yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Complete school setup — add classes, subjects, and record first assessments to see academic analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner & Action Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[11px] uppercase tracking-wide">
              Academic Governance & Deanery
            </span>
            <span className="text-xs text-slate-400 font-medium">{selectedTerm}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Academic Performance & Examinations Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Institution-wide assessment verification, departmental syllabus audits, WAEC/NECO mock diagnostic matrices, and remedial clinics.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs text-xs font-semibold text-slate-700">
            <span>{selectedTerm}</span>
          </div>

          <button
            id="btn-principal-approve-gradebooks"
            onClick={handleApproveAllGradebooks}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-200 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Approve All Gradebooks</span>
          </button>

          <button
            onClick={() => onOpenModal('report_card')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Broadsheet (CSV)</span>
          </button>

          <button
            onClick={() => onOpenModal('ai_lesson', { topic: 'School-Wide Termly Academic Diagnostic Summary' })}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Academic Diagnostic</span>
          </button>
        </div>
      </div>

      {/* 6 Executive KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: School Average */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">School Average</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">72.8%</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>+3.2% vs target (70%)</span>
            </p>
          </div>
        </div>

        {/* Card 2: Pass Rate */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Overall Pass Rate</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">94.6%</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              1,180 / 1,248 students
            </p>
          </div>
        </div>

        {/* Card 3: Distinction Index */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Distinction Rate (A1)</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">30.8%</p>
            <p className="text-[10.5px] text-purple-600 font-semibold mt-0.5">
              385 A1 distinctions
            </p>
          </div>
        </div>

        {/* Card 4: Top Class Arm */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Top Performing Arm</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5 truncate">SSS 3 Science</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              81.4% class mean score
            </p>
          </div>
        </div>

        {/* Card 5: Syllabus Coverage */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Syllabus Coverage</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">81.2%</p>
            <p className="text-[10.5px] text-blue-600 font-semibold mt-0.5">
              Week 8 of 12 (On Track)
            </p>
          </div>
        </div>

        {/* Card 6: Academic Clinics */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">At-Risk Interventions</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-0.5">68</p>
            <p className="text-[10.5px] text-rose-600 font-semibold mt-0.5">
              Enrolled in clinics (&lt;50%)
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            id="tab-principal-broadsheet"
            onClick={() => setActiveSubTab('broadsheet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'broadsheet'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Class Performance & Broadsheet Status</span>
          </button>

          <button
            id="tab-principal-subjects"
            onClick={() => setActiveSubTab('subjects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Subject Diagnostics & Grade Bands</span>
          </button>

          <button
            id="tab-principal-curriculum"
            onClick={() => setActiveSubTab('curriculum')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'curriculum'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Departmental Syllabus & Lesson Audit</span>
          </button>

          <button
            id="tab-principal-intervention"
            onClick={() => setActiveSubTab('intervention')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'intervention'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Remedial Clinics & At-Risk Roster</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
              68
            </span>
          </button>
        </div>

        {/* Level filter for broadsheet */}
        {activeSubTab === 'broadsheet' && (
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span className="text-slate-400 mr-1">Filter Level:</span>
            <button
              onClick={() => setSelectedLevel('All')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer ${selectedLevel === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              All (6)
            </button>
            <button
              onClick={() => setSelectedLevel('Junior')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer ${selectedLevel === 'Junior' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Junior (JSS 1-3)
            </button>
            <button
              onClick={() => setSelectedLevel('Senior')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer ${selectedLevel === 'Senior' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Senior (SSS 1-3)
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: CLASS PERFORMANCE & BROADSHEET STATUS */}
      {activeSubTab === 'broadsheet' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Class Arms Academic Broadsheet Matrix</h3>
              <p className="text-xs text-slate-500">Comparative breakdown of continuous assessment submissions, class mean scores, and departmental sign-off status.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenModal('report_card')}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Compile Official Master Broadsheet</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Class Cohort</th>
                  <th className="py-3 px-3">Enrolment</th>
                  <th className="py-3 px-3 text-center">Mean Score</th>
                  <th className="py-3 px-3 text-center">Pass Rate</th>
                  <th className="py-3 px-3 text-center">Distinction (A1)</th>
                  <th className="py-3 px-3">Top Subject</th>
                  <th className="py-3 px-3">Lagging Subject</th>
                  <th className="py-3 px-3 text-center">CA Submissions</th>
                  <th className="py-3 px-3 text-center">Approval Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredClassData.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{cls.classArm}</p>
                        <p className="text-[10.5px] text-slate-400">Dean / HOD: {cls.hod}</p>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{cls.students}</span> students
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-extrabold text-indigo-600">{cls.averageScore}%</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                        {cls.passRate}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-purple-600">
                      {cls.distinctionRate}%
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {cls.topSubject}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                        {cls.laggingSubject}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${cls.caSubmissionRate}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{cls.caSubmissionRate}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                        cls.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {cls.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onOpenModal('report_card', { classArm: cls.classArm })}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors"
                      >
                        Inspect Broadsheet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SUBJECT DIAGNOSTICS & GRADE BANDS */}
      {activeSubTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Subject Performance Averages */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Curricular Subject Means & Pass Benchmarks</h3>
              <p className="text-xs text-slate-500">Comparative mean score vs pass rate across major NERDC subject pillars</p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SUBJECT_PERFORMANCE_DISTRIBUTION} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="subject" stroke="#94A3B8" fontSize={11} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="average" name="Subject Mean %" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="distinction" name="Distinction % (A1)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Grade Distribution Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institution Grade Distribution</h3>
              <p className="text-xs text-slate-500">Distribution across 1,248 student terminal assessments</p>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={GRADE_BAND_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {GRADE_BAND_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">1,248</span>
                <span className="text-[10px] text-slate-400 font-medium">Scores</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              {GRADE_BAND_DATA.map((band) => (
                <div key={band.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: band.color }} />
                    <span className="text-slate-600 font-medium">{band.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{band.value} ({Math.round((band.value / 1248) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: DEPARTMENTAL SYLLABUS & LESSON AUDIT */}
      {activeSubTab === 'curriculum' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty Curriculum Completion & Lesson Note Compliance</h3>
              <p className="text-xs text-slate-500">Weekly audit of NERDC syllabus milestones, laboratory practicals, and pedagogical quality.</p>
            </div>

            <button
              onClick={() => onOpenModal('ai_lesson', { topic: 'Departmental Scheme of Work Alignment Audit' })}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Syllabus Audit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CURRICULUM_COMPLIANCE.map((dept, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{dept.department}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">
                      {dept.syllabusProgress}% Progress
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span>Syllabus Completion (Wk 8/12)</span>
                        <span className="font-bold text-slate-900">{dept.syllabusProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${dept.syllabusProgress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-1">
                      <span>Lesson Notes Signed:</span>
                      <strong className="text-emerald-600">{dept.lessonPlansSubmitted}%</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Lab / Field Practicals:</span>
                      <strong>{dept.practicalsHeld} / {dept.targetPracticals} sessions</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Inspected by Vice Principal</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Compliant
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: REMEDIAL CLINICS & AT-RISK ROSTER */}
      {activeSubTab === 'intervention' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Academic Intervention & Remedial Clinic Roster</h3>
              <p className="text-xs text-slate-500">68 students identified with cumulative assessment score &lt;50% in key WAEC/NECO prerequisite subjects.</p>
            </div>

            <button
              onClick={() => {
                feedbackBus.success('Bulk SMS dispatched to parents of 68 students enrolled in Saturday Remedial Clinic.');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Notify Parents of Clinic Schedule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-2">
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-bold">
                Mathematics Clinic (Junior)
              </span>
              <h4 className="font-bold text-slate-900 text-sm">24 Students Enrolled</h4>
              <p className="text-xs text-slate-600">Focus: Algebraic fractions, geometry proofs & basic arithmetic reasoning.</p>
              <p className="text-[11px] text-slate-500">Lead Tutor: <strong>Mr. Adewale</strong> • Mon & Wed 3:30 PM</p>
            </div>

            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-2">
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-bold">
                Further Maths & Physics (Senior)
              </span>
              <h4 className="font-bold text-slate-900 text-sm">28 Students Enrolled</h4>
              <p className="text-xs text-slate-600">Focus: Calculus, vector analysis, kinematics & thermodynamics problem-solving.</p>
              <p className="text-[11px] text-slate-500">Lead Tutor: <strong>Engr. Ibrahim</strong> • Tue & Thu 3:30 PM</p>
            </div>

            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-2">
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-bold">
                English Language & Comprehension
              </span>
              <h4 className="font-bold text-slate-900 text-sm">16 Students Enrolled</h4>
              <p className="text-xs text-slate-600">Focus: Essay construction, grammatical concord & summary writing.</p>
              <p className="text-[11px] text-slate-500">Lead Tutor: <strong>Mrs. Eze</strong> • Fri 3:30 PM</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
