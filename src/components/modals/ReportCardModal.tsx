import React from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Award,
  ShieldCheck,
  Building
} from 'lucide-react';
import { SAMPLE_REPORT_CARD, INITIAL_STUDENTS } from '../../data/mockData';
import { StudentRecord } from '../../types';
import { useStudentWorkspace } from '../../features/student/useStudentWorkspace';
import { appConfig } from '../../app/config';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentRecord | null;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const workspace = useStudentWorkspace();
  if (!isOpen) return null;

  const currentStudent =
    student ||
    (appConfig.liveApi
      ? ({
          ...INITIAL_STUDENTS[5],
          id: workspace.userId,
          name: workspace.displayName,
          firstName: workspace.firstName,
          lastName: workspace.displayName.split(/\s+/).slice(1).join(' ') || workspace.firstName,
          classArm: workspace.classLabel || (workspace.isPersonal ? 'Personal' : '—'),
          admissionNo: workspace.isPersonal ? 'PERSONAL' : '—',
          currentAverage: 0,
        } as StudentRecord)
      : INITIAL_STUDENTS[5]);

  if (appConfig.liveApi && !student) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Report card</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-600">
            No published report card for <strong>{workspace.displayName}</strong> yet
            {workspace.isPersonal
              ? '. Join a school with an invitation code to receive official term reports.'
              : '. Your school will publish results when they are ready.'}
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Toolbar Header */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-800">
              Terminal Academic Report Card Preview • {currentStudent.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Report Card Document */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans space-y-6">
          
          {/* Official School Header */}
          <div className="text-center border-b-2 border-indigo-900 pb-4 relative">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-serif text-2xl font-black shadow-md">
                RGA
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-indigo-950 uppercase">
                  Royal Gateway Academy
                </h1>
                <p className="text-xs text-slate-600 font-medium italic">
                  "Excellence, Integrity and Wisdom"
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria • +234 800 769 2536 • info@royalgateway.edu.ng
            </p>

            <div className="mt-3 inline-block px-4 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-extrabold uppercase tracking-wider">
              Official Terminal Academic Performance Report • First Term 2026/2027
            </div>
          </div>

          {/* Student Profile Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <p className="text-slate-400 font-medium">STUDENT NAME</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{currentStudent.name}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">ADMISSION NO.</p>
              <p className="font-bold text-slate-900 font-mono mt-0.5">{currentStudent.admissionNo}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">CLASS & ARM</p>
              <p className="font-bold text-slate-900 mt-0.5">{currentStudent.classArm}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">CLASS POSITION</p>
              <p className="font-bold text-indigo-600 mt-0.5">{SAMPLE_REPORT_CARD.position}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">GENDER</p>
              <p className="font-bold text-slate-900 mt-0.5">{currentStudent.gender}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">DAYS PRESENT</p>
              <p className="font-bold text-emerald-600 mt-0.5">126 / 130 Days (96.9%)</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">OVERALL AVERAGE</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentStudent.currentAverage}%</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">NEXT TERM COMMENCES</p>
              <p className="font-bold text-slate-900 mt-0.5">11th Jan 2027</p>
            </div>
          </div>

          {/* Subject Grade Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-indigo-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 pl-3">Subject</th>
                  <th className="py-2.5 text-center">CA 1 (10)</th>
                  <th className="py-2.5 text-center">CA 2 (10)</th>
                  <th className="py-2.5 text-center">Assgn (10)</th>
                  <th className="py-2.5 text-center">Proj (10)</th>
                  <th className="py-2.5 text-center">Exam (60)</th>
                  <th className="py-2.5 text-center font-extrabold">Total (100)</th>
                  <th className="py-2.5 text-center">Grade</th>
                  <th className="py-2.5 pl-2 pr-3">Teacher's Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SAMPLE_REPORT_CARD.subjects.map((sub, idx) => (
                  <tr key={sub.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 pl-3 font-bold text-slate-900">{sub.name}</td>
                    <td className="py-2.5 text-center text-slate-600">{sub.ca1}</td>
                    <td className="py-2.5 text-center text-slate-600">{sub.ca2}</td>
                    <td className="py-2.5 text-center text-slate-600">{sub.assignment}</td>
                    <td className="py-2.5 text-center text-slate-600">{sub.project}</td>
                    <td className="py-2.5 text-center text-slate-700 font-semibold">{sub.exam}</td>
                    <td className="py-2.5 text-center font-extrabold text-indigo-950">{sub.total}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                        sub.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        sub.grade === 'B' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.grade}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 pr-3 text-slate-600 text-[11px] font-medium">{sub.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Behavioral & Affective Traits Radar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Behavioral & Affective Domain Assessment (Scale 1 - 5)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="flex justify-between border-b pb-1"><span>Punctuality:</span> <strong>5 / 5 (Excellent)</strong></div>
                <div className="flex justify-between border-b pb-1"><span>Attentiveness:</span> <strong>4 / 5 (Very Good)</strong></div>
                <div className="flex justify-between border-b pb-1"><span>Neatness & Dressing:</span> <strong>5 / 5 (Excellent)</strong></div>
                <div className="flex justify-between border-b pb-1"><span>Politeness & Respect:</span> <strong>5 / 5 (Excellent)</strong></div>
                <div className="flex justify-between border-b pb-1"><span>Honesty & Integrity:</span> <strong>5 / 5 (Excellent)</strong></div>
                <div className="flex justify-between border-b pb-1"><span>Leadership Initiative:</span> <strong>4 / 5 (Very Good)</strong></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Grading Key & Performance Thresholds
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div><strong className="text-emerald-700">A (75 - 100%):</strong> Excellent / Distinction</div>
                <div><strong className="text-blue-700">B (65 - 74%):</strong> Very Good / Credit</div>
                <div><strong className="text-amber-700">C (50 - 64%):</strong> Good / Pass</div>
                <div><strong className="text-rose-700">F (0 - 49%):</strong> Unsatisfactory / Fail</div>
              </div>
            </div>
          </div>

          {/* Signatures & Principal Endorsement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">Form Teacher's Remarks:</p>
              <p className="italic text-slate-600 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                "{SAMPLE_REPORT_CARD.classTeacherRemarks}"
              </p>
              <div className="pt-3">
                <span className="font-serif italic font-bold text-slate-700 block">Mr. O. Adewale (B.Sc Ed)</span>
                <span className="text-[10px] text-slate-400">Class Form Teacher</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900">Principal's Endorsement & School Stamp:</p>
              <p className="italic text-slate-600 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                "{SAMPLE_REPORT_CARD.principalRemarks}"
              </p>
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <span className="font-serif italic font-bold text-slate-700 block">Mrs. F. Adeyemi (M.Ed)</span>
                  <span className="text-[10px] text-slate-400">Principal & Head of School</span>
                </div>

                <div className="w-16 h-16 rounded-full border-2 border-indigo-700 border-dashed flex items-center justify-center text-[9px] font-bold text-indigo-900 uppercase text-center transform -rotate-12">
                  Official Seal 2026
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
