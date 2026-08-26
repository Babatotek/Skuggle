import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Award,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Star,
  Printer,
  ChevronRight,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SAMPLE_REPORT_CARD } from '../../data/mockData';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { useStudentWorkspace } from '../../features/student/useStudentWorkspace';

interface StudentResultsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface TermResult {
  session: string;
  term: string;
  classPosition: string;
  totalStudents: number;
  overallAverage: number;
  totalScore: number;
  maxScore: number;
  gpa: string;
  attendanceDays: number;
  totalSchoolDays: number;
  subjects: {
    name: string;
    code: string;
    ca1: number;
    ca2: number;
    assignment: number;
    exam: number;
    total: number;
    grade: string;
    gradeColor: string;
    classAverage: number;
    position: string;
    remark: string;
  }[];
  psychomotor: { skill: string; rating: number }[];
  affective: { trait: string; rating: number }[];
  formTeacherRemark: string;
  principalRemark: string;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const workspace = useStudentWorkspace();
  const [selectedTermKey, setSelectedTermKey] = useState<'2025_term2' | '2025_term1' | '2024_term3'>('2025_term2');

  if (workspace.isLive) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Award className="mx-auto mb-3 h-10 w-10 text-indigo-500" />
          <h1 className="text-xl font-bold text-slate-900">No results published yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            {workspace.isPersonal
              ? `${workspace.firstName}, your personal account is separate from any school. Official term results appear after you join a school with an invitation code.`
              : `${workspace.firstName}, ${workspace.schoolLabel} has not published results for your account yet.`}
          </p>
          <button
            onClick={() => onNavigateTab('home')}
            className="mt-6 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const termData: Record<string, TermResult> = {
    '2025_term2': {
      session: '2025/2026 Academic Session',
      term: 'Second Term (Mid-Term Consolidated)',
      classPosition: '2nd out of 38 students',
      totalStudents: 38,
      overallAverage: 89.4,
      totalScore: 715,
      maxScore: 800,
      gpa: '4.85 / 5.00',
      attendanceDays: 48,
      totalSchoolDays: 50,
      subjects: [
        {
          name: 'Mathematics',
          code: 'MTH-201',
          ca1: 19,
          ca2: 18,
          assignment: 9,
          exam: 48,
          total: 94,
          grade: 'A1',
          gradeColor: 'bg-emerald-100 text-emerald-800',
          classAverage: 68.4,
          position: '1st',
          remark: 'Exceptional problem-solving abilities & algebraic speed.',
        },
        {
          name: 'Computer Studies / ICT',
          code: 'ICT-202',
          ca1: 20,
          ca2: 19,
          assignment: 10,
          exam: 47,
          total: 96,
          grade: 'A1',
          gradeColor: 'bg-emerald-100 text-emerald-800',
          classAverage: 72.1,
          position: '1st',
          remark: 'Outstanding Python programming and logic application.',
        },
        {
          name: 'Basic Science & Technology',
          code: 'BST-201',
          ca1: 18,
          ca2: 17,
          assignment: 9,
          exam: 46,
          total: 90,
          grade: 'A1',
          gradeColor: 'bg-emerald-100 text-emerald-800',
          classAverage: 70.5,
          position: '2nd',
          remark: 'High mastery of energy conservation and biology cycles.',
        },
        {
          name: 'Civic & Social Studies',
          code: 'CVC-201',
          ca1: 19,
          ca2: 18,
          assignment: 9,
          exam: 47,
          total: 93,
          grade: 'A1',
          gradeColor: 'bg-emerald-100 text-emerald-800',
          classAverage: 74.0,
          position: '2nd',
          remark: 'Deep understanding of constitutional rights and ethics.',
        },
        {
          name: 'English Studies',
          code: 'ENG-201',
          ca1: 16,
          ca2: 17,
          assignment: 8,
          exam: 43,
          total: 84,
          grade: 'B2',
          gradeColor: 'bg-blue-100 text-blue-800',
          classAverage: 69.8,
          position: '5th',
          remark: 'Good vocabulary and essay flow. Continue reading classics.',
        },
        {
          name: 'Agricultural Science',
          code: 'AGR-201',
          ca1: 17,
          ca2: 16,
          assignment: 8,
          exam: 44,
          total: 85,
          grade: 'B2',
          gradeColor: 'bg-blue-100 text-blue-800',
          classAverage: 71.2,
          position: '4th',
          remark: 'Solid comprehension of agronomy and soil nutrients.',
        },
        {
          name: 'Business Studies',
          code: 'BUS-201',
          ca1: 17,
          ca2: 15,
          assignment: 8,
          exam: 45,
          total: 85,
          grade: 'B2',
          gradeColor: 'bg-blue-100 text-blue-800',
          classAverage: 67.5,
          position: '3rd',
          remark: 'Good grasp of office bookkeeping and commerce principles.',
        },
        {
          name: 'French Language',
          code: 'FRN-201',
          ca1: 16,
          ca2: 15,
          assignment: 8,
          exam: 40,
          total: 79,
          grade: 'B3',
          gradeColor: 'bg-indigo-100 text-indigo-800',
          classAverage: 65.0,
          position: '6th',
          remark: 'Commendable oral pronunciation. Practice verb tenses.',
        },
      ],
      affective: [
        { trait: 'Punctuality & Regularity', rating: 5 },
        { trait: 'Politeness & Respect', rating: 5 },
        { trait: 'Honesty & Integrity', rating: 5 },
        { trait: 'Leadership & Responsibility', rating: 4 },
        { trait: 'Attentiveness in Class', rating: 5 },
      ],
      psychomotor: [
        { skill: 'Handwriting & Neatness', rating: 4 },
        { skill: 'Sports & Athletics', rating: 4 },
        { skill: 'Computer & Coding Skills', rating: 5 },
        { skill: 'Public Speaking / Debate', rating: 4 },
        { skill: 'Laboratory Dexterity', rating: 5 },
      ],
      formTeacherRemark: 'Nathan is an exceptionally gifted, diligent, and well-behaved young scholar. His performance in Mathematics and Computer Studies is outstanding. Promoted with Distinction honors.',
      principalRemark: 'An exemplary result reflecting genuine hard work and academic commitment. Congratulations Nathan!',
    },
    '2025_term1': {
      session: '2025/2026 Academic Session',
      term: 'First Term',
      classPosition: '4th out of 38 students',
      totalStudents: 38,
      overallAverage: 81.4,
      totalScore: 651,
      maxScore: 800,
      gpa: '4.40 / 5.00',
      attendanceDays: 68,
      totalSchoolDays: 70,
      subjects: [
        {
          name: 'Mathematics',
          code: 'MTH-201',
          ca1: 17,
          ca2: 16,
          assignment: 8,
          exam: 45,
          total: 86,
          grade: 'A1',
          gradeColor: 'bg-emerald-100 text-emerald-800',
          classAverage: 66.0,
          position: '3rd',
          remark: 'Strong arithmetic base.',
        },
        {
          name: 'Computer Studies / ICT',
          code: 'ICT-202',
          ca1: 19,
          ca2: 19,
          assignment: 10,
          exam: 44,
          total: 92,
          grade: 'A1',
          gradeColor: 'bg-emerald-100 text-emerald-800',
          classAverage: 71.0,
          position: '1st',
          remark: 'Brilliant computer literacy.',
        },
        {
          name: 'Basic Science & Tech',
          code: 'BST-201',
          ca1: 17,
          ca2: 17,
          assignment: 8,
          exam: 42,
          total: 84,
          grade: 'A1',
          gradeColor: 'bg-emerald-100 text-emerald-800',
          classAverage: 69.5,
          position: '4th',
          remark: 'Good scientific curiosity.',
        },
        {
          name: 'English Studies',
          code: 'ENG-201',
          ca1: 15,
          ca2: 15,
          assignment: 7,
          exam: 39,
          total: 76,
          grade: 'B2',
          gradeColor: 'bg-blue-100 text-blue-800',
          classAverage: 67.2,
          position: '8th',
          remark: 'Satisfactory essay construction.',
        },
      ],
      affective: [
        { trait: 'Punctuality & Regularity', rating: 5 },
        { trait: 'Politeness & Respect', rating: 5 },
        { trait: 'Honesty & Integrity', rating: 5 },
        { trait: 'Leadership & Responsibility', rating: 4 },
        { trait: 'Attentiveness in Class', rating: 4 },
      ],
      psychomotor: [
        { skill: 'Handwriting & Neatness', rating: 4 },
        { skill: 'Sports & Athletics', rating: 4 },
        { skill: 'Computer & Coding Skills', rating: 5 },
        { skill: 'Public Speaking / Debate', rating: 3 },
        { skill: 'Laboratory Dexterity', rating: 4 },
      ],
      formTeacherRemark: 'Very encouraging first term result. With extra focus on English comprehension, Nathan can easily top the class.',
      principalRemark: 'Good effort and clean record of conduct. Approved.',
    },
    '2024_term3': {
      session: '2024/2025 Academic Session',
      term: 'Third Term (JSS 1 Promotional)',
      classPosition: '3rd out of 40 students',
      overallAverage: 83.1,
      totalScore: 665,
      maxScore: 800,
      gpa: '4.50 / 5.00',
      attendanceDays: 69,
      totalSchoolDays: 70,
      totalStudents: 40,
      subjects: [],
      affective: [],
      psychomotor: [],
      formTeacherRemark: 'Promoted to JSS 2 with flying colors.',
      principalRemark: 'Excellent foundation year.',
    },
  };

  const currentResult = termData[selectedTermKey] || termData['2025_term2'];

  const handleDownloadTranscript = () => {
    feedbackBus.info(`Generating official PDF report card for Nathan Bello (${currentResult.term})...`);
    setTimeout(() => {
      onOpenModal('report_card', SAMPLE_REPORT_CARD.student);
    }, 1200);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] uppercase tracking-wide">
              Official Academic Records & Transcripts
            </span>
            <span className="text-xs text-slate-400 font-medium">Digital Verification Enabled</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Terminal Academic Results & Gradebook
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View itemized continuous assessment, examination scores, class positions, and certified terminal report cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onOpenModal('result_checker', SAMPLE_REPORT_CARD.student)}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Online PIN Result Checker
          </button>

          <button
            onClick={handleDownloadTranscript}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Certified Report Card
          </button>
        </div>
      </div>

      {/* Term Selector & Quick Summary Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        
        {/* Term Select bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Term:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTermKey('2025_term2')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTermKey === '2025_term2'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                2025/2026 Term 2 (Current)
              </button>
              <button
                onClick={() => setSelectedTermKey('2025_term1')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTermKey === '2025_term1'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                2025/2026 Term 1
              </button>
              <button
                onClick={() => setSelectedTermKey('2024_term3')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTermKey === '2024_term3'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                2024/2025 JSS 1 Final
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">{currentResult.session}</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">{currentResult.term}</span>
          </div>
        </div>

        {/* 4 Hero Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Overall Average</p>
            <div className="text-2xl font-extrabold text-indigo-950">{currentResult.overallAverage}%</div>
            <p className="text-[10px] font-semibold text-indigo-600">Grade: Distinction (A)</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Class Standing</p>
            <div className="text-2xl font-extrabold text-amber-950">{currentResult.classPosition}</div>
            <p className="text-[10px] font-semibold text-amber-700">Top 5% of JSS 2</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Aggregate Total</p>
            <div className="text-2xl font-extrabold text-emerald-950">{currentResult.totalScore} / {currentResult.maxScore}</div>
            <p className="text-[10px] font-semibold text-emerald-700">GPA: {currentResult.gpa}</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
            <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Roll-Call Attendance</p>
            <div className="text-2xl font-extrabold text-purple-950">
              {Math.round((currentResult.attendanceDays / currentResult.totalSchoolDays) * 100)}%
            </div>
            <p className="text-[10px] font-semibold text-purple-700">
              {currentResult.attendanceDays} of {currentResult.totalSchoolDays} Days Present
            </p>
          </div>
        </div>

      </div>

      {/* Detailed Subject Breakdown Gradebook Table */}
      {currentResult.subjects.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Continuous Assessment & Terminal Exam Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Continuous Assessment (CA1: 20, CA2: 20, HW/Proj: 10), Exam: 50, Total: 100</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              {currentResult.subjects.length} Subjects Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-3 text-center">CA 1 (20)</th>
                  <th className="py-3 px-3 text-center">CA 2 (20)</th>
                  <th className="py-3 px-3 text-center">Project (10)</th>
                  <th className="py-3 px-3 text-center">Exam (50)</th>
                  <th className="py-3 px-3 text-center font-bold text-slate-900">Total (100)</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3 text-center">Class Avg</th>
                  <th className="py-3 px-4">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentResult.subjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{sub.name}</div>
                      <span className="text-[10px] font-normal text-slate-400">{sub.code}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{sub.ca1}</td>
                    <td className="py-3 px-3 text-center font-mono">{sub.ca2}</td>
                    <td className="py-3 px-3 text-center font-mono">{sub.assignment}</td>
                    <td className="py-3 px-3 text-center font-mono">{sub.exam}</td>
                    <td className="py-3 px-3 text-center font-bold font-mono text-slate-900 text-sm">
                      {sub.total}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${sub.gradeColor}`}>
                        {sub.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-600">
                      {sub.position}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                      {sub.classAverage}%
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600 italic max-w-xs">
                      "{sub.remark}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Behavioral & Psychomotor Ratings + Endorsement Remarks */}
      {currentResult.affective.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Affective & Psychomotor Domains */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Affective Domain & Psychomotor Assessment (5-Point Scale)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Affective Traits</p>
                {currentResult.affective.map((trait, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                    <span className="font-semibold text-slate-700">{trait.trait}</span>
                    <div className="flex text-amber-400 text-xs">
                      {'★'.repeat(trait.rating)}{'☆'.repeat(5 - trait.rating)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Psychomotor Skills</p>
                {currentResult.psychomotor.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                    <span className="font-semibold text-slate-700">{skill.skill}</span>
                    <div className="flex text-indigo-500 text-xs">
                      {'★'.repeat(skill.rating)}{'☆'.repeat(5 - skill.rating)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Teacher & Principal Endorsement */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Administrative & Pedagogical Endorsements
              </h3>

              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <p className="text-[11px] font-bold text-indigo-900">Form Master's Remark:</p>
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{currentResult.formTeacherRemark}"
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 pt-1">
                    — Mr. Adewale Olawale (Form Master, JSS 2A)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                  <p className="text-[11px] font-bold text-emerald-900">Principal's Decision & Remark:</p>
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{currentResult.principalRemark}"
                  </p>
                  <p className="text-[10px] font-bold text-emerald-700 pt-1">
                    — Mrs. Adeyemi, M.Ed (Principal, Royal Gateway Academy)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
              <span>Next Term Resumption: <strong>21 April 2026</strong></span>
              <span className="text-emerald-600 font-bold">Status: Promoted / Good Standing</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
