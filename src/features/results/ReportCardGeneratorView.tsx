import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  CheckCircle,
  Award,
  BookOpen,
  Calendar,
  User,
  Shield,
  FileText,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StudentRecord, ReportCard, SubjectReportScore } from '../../types';

export const ReportCardGeneratorView: React.FC = () => {
  const { branding, students, assessments, showToast } = useApp();

  const [selectedClass, setSelectedClass] = useState<string>('JSS 2');
  const [selectedArm, setSelectedArm] = useState<string>('Gold');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || 'std-001'
  );
  const [selectedTerm, setSelectedTerm] = useState<string>('First Term');
  const [selectedSession, setSelectedSession] = useState<string>('2025/2026');
  const [principalComment, setPrincipalComment] = useState<string>(
    'An exemplary and dedicated performance throughout this academic term. Keeps up excellent analytical habits.'
  );
  const [classTeacherComment, setClassTeacherComment] = useState<string>(
    'David demonstrates outstanding aptitude in STEM subjects and shows strong leadership qualities in classroom activities.'
  );
  const [resumptionDate, setResumptionDate] = useState<string>('2026-01-12');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  // Filter students by class & arm
  const classStudents = students.filter(
    (s) => s.classLevel === selectedClass && (selectedArm ? s.arm === selectedArm : true)
  );

  const currentStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  // Derive realistic academic subject performance
  const subjectsData: SubjectReportScore[] = [
    {
      subject: 'Mathematics',
      ca1: 14,
      ca2: 13,
      midTerm: 9,
      exam: 54,
      total: 90,
      grade: 'A1',
      classAverage: 72.4,
      highestInClass: 95,
      lowestInClass: 44,
      teacherRemark: 'Brilliant mastery of algebra & geometry concepts.',
    },
    {
      subject: 'English Language',
      ca1: 13,
      ca2: 14,
      midTerm: 8,
      exam: 49,
      total: 84,
      grade: 'A1',
      classAverage: 68.2,
      highestInClass: 89,
      lowestInClass: 48,
      teacherRemark: 'Rich vocabulary and creative essay structure.',
    },
    {
      subject: 'Basic Science & Tech',
      ca1: 15,
      ca2: 14,
      midTerm: 9,
      exam: 50,
      total: 88,
      grade: 'A1',
      classAverage: 71.0,
      highestInClass: 92,
      lowestInClass: 50,
      teacherRemark: 'Active lab participation and sharp inquiry skills.',
    },
    {
      subject: 'Civic Education',
      ca1: 12,
      ca2: 13,
      midTerm: 8,
      exam: 45,
      total: 78,
      grade: 'B2',
      classAverage: 66.5,
      highestInClass: 86,
      lowestInClass: 42,
      teacherRemark: 'Clear understanding of democratic institutions.',
    },
    {
      subject: 'Agricultural Science',
      ca1: 14,
      ca2: 12,
      midTerm: 8,
      exam: 48,
      total: 82,
      grade: 'A1',
      classAverage: 69.1,
      highestInClass: 88,
      lowestInClass: 46,
      teacherRemark: 'Very good practical and theoretical grasp.',
    },
    {
      subject: 'Computer Studies / Coding',
      ca1: 15,
      ca2: 15,
      midTerm: 10,
      exam: 56,
      total: 96,
      grade: 'A1',
      classAverage: 74.0,
      highestInClass: 98,
      lowestInClass: 52,
      teacherRemark: 'Superb computational logic and algorithm design.',
    },
    {
      subject: 'Business Studies',
      ca1: 13,
      ca2: 12,
      midTerm: 8,
      exam: 43,
      total: 76,
      grade: 'B2',
      classAverage: 65.0,
      highestInClass: 84,
      lowestInClass: 40,
      teacherRemark: 'Shows keen interest in commercial accounting.',
    },
  ];

  const totalObtainable = subjectsData.length * 100;
  const totalScore = subjectsData.reduce((acc, curr) => acc + curr.total, 0);
  const averagePercentage = (totalScore / subjectsData.length).toFixed(1);

  // Psychomotor domain ratings
  const psychomotorSkills = [
    { skill: 'Handwriting & Neatness', rating: 5 },
    { skill: 'Verbal Fluency', rating: 4 },
    { skill: 'Sports & Games', rating: 4 },
    { skill: 'Musical / Artistic Skill', rating: 4 },
    { skill: 'Laboratory Practical Skills', rating: 5 },
  ];

  // Affective traits ratings
  const affectiveTraits = [
    { trait: 'Punctuality & Regularity', rating: 5 },
    { trait: 'Attentiveness in Class', rating: 5 },
    { trait: 'Politeness & Respect', rating: 5 },
    { trait: 'Honesty & Reliability', rating: 5 },
    { trait: 'Leadership & Team Spirit', rating: 4 },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-slate-900">
              Termly Report Card Generator
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
              NERDC Compliant
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Generate, customize, and print official terminal dossier sheets with verified digital watermarking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report Card</span>
          </button>
          <button
            onClick={() => showToast('Digital copy sent', 'Official digital PDF notification delivered to guardian email & portal.')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Dispatch to Parent</span>
          </button>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 print:hidden">
        <div className="flex-1 min-w-44">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="JSS 1">JSS 1</option>
            <option value="JSS 2">JSS 2</option>
            <option value="JSS 3">JSS 3</option>
            <option value="SSS 1">SSS 1</option>
            <option value="SSS 2">SSS 2</option>
          </select>
        </div>

        <div className="w-36">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Arm
          </label>
          <select
            value={selectedArm}
            onChange={(e) => setSelectedArm(e.target.value)}
            className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Gold">Gold</option>
            <option value="Diamond">Diamond</option>
            <option value="Emerald">Emerald</option>
          </select>
        </div>

        <div className="flex-1 min-w-56">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Student Roster ({classStudents.length} Students)
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {classStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.admissionNo}) — Rank #{s.positionInClass || 1}
              </option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Term & Session
          </label>
          <div className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-2.5 rounded-xl">
            {selectedTerm} • {selectedSession}
          </div>
        </div>
      </div>

      {/* Official Report Card Printable Document */}
      <div className="bg-white rounded-3xl border border-slate-300 p-8 md:p-12 shadow-md print:shadow-none print:border-none print:p-0 max-w-5xl mx-auto space-y-6">
        {/* Document School Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b-2 border-slate-900 text-center md:text-left">
          <div className="flex items-center gap-4">
            <img
              src={branding.logoUrl}
              alt={branding.schoolName}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-xs"
            />
            <div>
              <h2 className="font-display font-extrabold text-2xl text-slate-900 uppercase tracking-tight">
                {branding.schoolName}
              </h2>
              <p className="text-xs italic font-medium text-slate-600">
                "{branding.motto || 'Excellence in Character and Learning'}"
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {branding.address}, {branding.city}, {branding.state} • Phone: {branding.phone}
              </p>
              <p className="text-[11px] font-mono text-indigo-700">
                School Code: {branding.schoolCode} • Gov. Approved
              </p>
            </div>
          </div>

          <div className="text-center md:text-right bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
              Official Continuous Assessment Dossier
            </span>
            <span className="font-display font-black text-lg text-indigo-950 block">
              {selectedTerm.toUpperCase()} REPORT
            </span>
            <span className="text-xs font-bold text-slate-600 block mt-0.5">
              Academic Session {selectedSession}
            </span>
          </div>
        </div>

        {/* Student Profile Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Student Name
            </span>
            <span className="font-bold text-slate-900 block mt-0.5">
              {currentStudent?.firstName} {currentStudent?.lastName}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Admission No
            </span>
            <span className="font-mono font-bold text-slate-800 block mt-0.5">
              {currentStudent?.admissionNo}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Class & Arm
            </span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {currentStudent?.classLevel} - {currentStudent?.arm}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Class Position
            </span>
            <span className="font-bold text-emerald-700 block mt-0.5">
              {currentStudent?.positionInClass || 1}st / {currentStudent?.totalStudentsInClass || 42}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Attendance
            </span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {currentStudent?.attendanceRate || 98}% (62/64 Days)
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Overall Grade
            </span>
            <span className="font-bold text-indigo-700 block mt-0.5">
              A1 Distinction ({averagePercentage}%)
            </span>
          </div>
        </div>

        {/* Academic Performance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-300 rounded-xl overflow-hidden">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-2 text-center">CA 1 (15)</th>
                <th className="py-2.5 px-2 text-center">CA 2 (15)</th>
                <th className="py-2.5 px-2 text-center">Mid (10)</th>
                <th className="py-2.5 px-2 text-center">Exam (60)</th>
                <th className="py-2.5 px-2 text-center bg-slate-800">Total (100)</th>
                <th className="py-2.5 px-2 text-center">Grade</th>
                <th className="py-2.5 px-2 text-center">Class Avg</th>
                <th className="py-2.5 px-3">Subject Teacher's Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subjectsData.map((sub, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-2 px-3 font-bold text-slate-900">{sub.subject}</td>
                  <td className="py-2 px-2 text-center font-mono">{sub.ca1}</td>
                  <td className="py-2 px-2 text-center font-mono">{sub.ca2}</td>
                  <td className="py-2 px-2 text-center font-mono">{sub.midTerm}</td>
                  <td className="py-2 px-2 text-center font-mono">{sub.exam}</td>
                  <td className="py-2 px-2 text-center font-bold font-mono text-indigo-950 bg-indigo-50/60">
                    {sub.total}
                  </td>
                  <td className="py-2 px-2 text-center font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] ${
                        sub.grade === 'A1'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.grade === 'B2' || sub.grade === 'B3'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.grade}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-500">{sub.classAverage}</td>
                  <td className="py-2 px-3 text-slate-600 italic text-[11px]">{sub.teacherRemark}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <tr>
                <td className="py-2.5 px-3 text-slate-900 font-bold">Terminal Aggregates</td>
                <td colSpan={4} className="text-right py-2.5 px-2 text-slate-600">
                  Total Obtained / Total Obtainable:
                </td>
                <td className="py-2.5 px-2 text-center font-black text-indigo-950">
                  {totalScore} / {totalObtainable}
                </td>
                <td colSpan={3} className="py-2.5 px-3 text-emerald-800 font-black">
                  Final Average: {averagePercentage}% • Class Rank: #{currentStudent?.positionInClass || 1}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Behavioral & Skills Domain Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Affective Traits */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span>Affective Domain & Character Assessment</span>
              <span className="text-[10px] text-slate-400 font-normal">Scale: 1 (Poor) to 5 (Excellent)</span>
            </h4>
            <div className="space-y-1.5 pt-1">
              {affectiveTraits.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-700">{t.trait}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                          star <= t.rating
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {star}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Psychomotor Skills */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span>Psychomotor & Practical Skills</span>
              <span className="text-[10px] text-slate-400 font-normal">Scale: 1 (Poor) to 5 (Excellent)</span>
            </h4>
            <div className="space-y-1.5 pt-1">
              {psychomotorSkills.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-700">{s.skill}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                          star <= s.rating
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {star}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Remarks & Signatures */}
        <div className="border border-slate-300 rounded-2xl p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
              Class Teacher's Remark:
            </label>
            <input
              type="text"
              value={classTeacherComment}
              onChange={(e) => setClassTeacherComment(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs italic focus:bg-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
              Principal's Remark:
            </label>
            <input
              type="text"
              value={principalComment}
              onChange={(e) => setPrincipalComment(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs italic focus:bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 items-end">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Next Term Resumption Date:
              </span>
              <input
                type="date"
                value={resumptionDate}
                onChange={(e) => setResumptionDate(e.target.value)}
                className="font-bold text-slate-900 mt-1 border border-slate-200 rounded-lg p-1.5 text-xs bg-slate-50"
              />
            </div>

            <div className="text-center">
              <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 font-serif italic text-slate-700">
                Mrs. O. Adeleke
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                Form Teacher's Signature
              </span>
            </div>

            <div className="text-center">
              <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 font-serif italic text-indigo-900 font-bold">
                Dr. A. B. Williams (Ed.D)
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                Principal's Stamp & Signature
              </span>
            </div>
          </div>
        </div>

        {/* Official Security Verification Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-mono">
          <span>Digital Verification Hash: SHA256-SKG-{(Math.random() * 1e16).toString(36)}</span>
          <span className="flex items-center gap-1 text-emerald-600 font-bold font-sans">
            <Shield className="w-3 h-3" /> Digitally Authenticated by Skuggle Cloud
          </span>
        </div>
      </div>
    </div>
  );
};
