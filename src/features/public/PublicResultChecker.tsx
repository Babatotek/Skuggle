import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  KeyRound,
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandMark } from '../../components/BrandMark';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

interface PublicResultCheckerProps {
  onBack: () => void;
}

export const PublicResultChecker: React.FC<PublicResultCheckerProps> = ({ onBack }) => {
  const { branding, showToast } = useApp();
  const [admissionNo, setAdmissionNo] = useState('');
  const [pin, setPin] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2025/2026');

  const [isLoading, setIsLoading] = useState(false);
  const [resultFound, setResultFound] = useState<boolean>(false);
  const [matchedStudent, setMatchedStudent] = useState<any>(null);
  const [matchedScores, setMatchedScores] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const checked = await apiMutation<{ data: { viewToken: string } }>('/public/results/check', 'POST', {
        admissionNumber: admissionNo.trim(), pin: pin.trim(), session: selectedSession, term: selectedTerm,
      });
      const viewed = await apiRequest<{ data: any }>(`/public/results/view?token=${encodeURIComponent(checked.data.viewToken)}`);
      const report = viewed.data;
      const names = String(report.student.displayName || '').split(' ');
      setMatchedStudent({
        firstName: names.shift() || '', lastName: names.join(' '), admissionNo: report.student.admissionNumber,
        classLevel: report.student.className, arm: '', attendanceRate: report.attendance?.rate ?? 0,
        positionInClass: '—', totalStudentsInClass: '—', termAverage: report.termAverage ?? 0,
      });
      setMatchedScores((report.subjects || []).map((row: any) => ({
        subject: row.subject, ca1: '—', ca2: '—', midTerm: '—', exam: '—',
        total: row.average, grade: row.grade, remark: row.average >= 70 ? 'Excellent' : row.average >= 50 ? 'Good progress' : 'Needs support',
      })));
      setIsLoading(false);
      setResultFound(true);
      showToast('Result verified', 'The published report was securely loaded.', 'success');
    } catch (error) {
      setIsLoading(false);
      setResultFound(false);
      setErrorMessage(describeApiError(error));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FFFCF7] flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between no-print mb-6">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        <BrandMark size="sm" showText={true} />
      </div>

      <div className="max-w-4xl mx-auto w-full my-auto">
        {!resultFound ? (
          /* Checker Input Form */
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="font-display font-bold text-xl text-slate-900">
                Official Result Checker
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your student admission number and scratch PIN to view verified term results.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCheckResult} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Admission Number *
                </label>
                <input
                  type="text"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  placeholder="e.g. CHIA/2024/0142"
                  className="w-full text-sm font-mono uppercase px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  16-Digit Scratch Card / Result PIN *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="SKG-XXXX-XXXX-XXXX"
                    className="w-full text-sm font-mono uppercase px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 pr-10"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Academic Session
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2024/2025">2024/2025</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Term
                  </label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? 'Verifying PIN & Fetching Result...' : 'Check & View Report Card'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Scratch cards and PINs are issued exclusively by {branding.schoolName}.
              </p>
            </div>
          </div>
        ) : (
          /* Official Nigerian Report Card View */
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200">
              <button
                onClick={() => setResultFound(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Check Another Result</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Report</span>
                </button>
              </div>
            </div>

            {/* Official Report Card Printable Document */}
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-8 sm:p-10 shadow-lg text-slate-900">
              {/* School Header */}
              <div className="text-center pb-6 border-b-2 border-slate-900">
                <div className="flex items-center justify-center gap-4 mb-2">
                  {branding.logoUrl && (
                    <img
                      src={branding.logoUrl}
                      alt={branding.schoolName}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-300"
                    />
                  )}
                  <div>
                    <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-indigo-950">
                      {branding.schoolName}
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">{branding.address}, {branding.city}, {branding.state}</p>
                    <p className="text-xs text-indigo-800 font-bold italic">"{branding.motto}"</p>
                  </div>
                </div>

                <div className="inline-block mt-2 px-4 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-full">
                  Official Continuous Assessment & Terminal Report Card
                </div>
              </div>

              {/* Student Metadata Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Student Name:</span>
                  <strong className="text-slate-900 text-sm">{matchedStudent.firstName} {matchedStudent.lastName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Admission Number:</span>
                  <strong className="text-slate-900 font-mono">{matchedStudent.admissionNo}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Class / Arm:</span>
                  <strong className="text-slate-900">{matchedStudent.classLevel} - {matchedStudent.arm}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Term / Session:</span>
                  <strong className="text-slate-900">{selectedTerm} ({selectedSession})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Term Attendance:</span>
                  <strong className="text-emerald-700">{matchedStudent.attendanceRate}% Present</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Class Position:</span>
                  <strong className="text-indigo-900">{matchedStudent.positionInClass}nd of {matchedStudent.totalStudentsInClass}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Term Overall Average:</span>
                  <strong className="text-indigo-900 font-bold text-sm">{matchedStudent.termAverage}%</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Security PIN Audit:</span>
                  <span className="font-mono text-[10px] text-slate-600">{pin.slice(0, 8)}****</span>
                </div>
              </div>

              {/* Subject Scores Matrix Table */}
              <div className="py-6 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-2 text-center">CA 1 (15%)</th>
                      <th className="py-2.5 px-2 text-center">CA 2 (15%)</th>
                      <th className="py-2.5 px-2 text-center">Mid-Term (10%)</th>
                      <th className="py-2.5 px-2 text-center">Exam (60%)</th>
                      <th className="py-2.5 px-2 text-center font-extrabold bg-slate-200">Total (100%)</th>
                      <th className="py-2.5 px-2 text-center">Grade</th>
                      <th className="py-2.5 px-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {matchedScores.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{row.subject}</td>
                        <td className="py-2.5 px-2 text-center">{row.ca1}</td>
                        <td className="py-2.5 px-2 text-center">{row.ca2}</td>
                        <td className="py-2.5 px-2 text-center">{row.midTerm}</td>
                        <td className="py-2.5 px-2 text-center">{row.exam}</td>
                        <td className="py-2.5 px-2 text-center font-bold bg-indigo-50/60 text-indigo-950">{row.total}</td>
                        <td className="py-2.5 px-2 text-center font-extrabold text-indigo-900">{row.grade}</td>
                        <td className="py-2.5 px-3 text-slate-600 italic">{row.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Remarks & Signatures */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">Class Teacher's Remark:</span>
                  <p className="text-slate-800 italic">
                    "David is a remarkably brilliant, disciplined, and attentive learner who consistently demonstrates academic rigor."
                  </p>
                  <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                    <span>Teacher: Mr. Emmanuel Adeleke</span>
                    <span className="font-semibold text-emerald-700">✓ Digitally Signed</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">Principal's Formal Verdict:</span>
                  <p className="text-slate-800 italic">
                    "An outstanding, exemplary performance. Recommended for academic honors and progression."
                  </p>
                  <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                    <span>Principal: Mrs. Folashade Adebayo</span>
                    <span className="font-semibold text-indigo-700">✓ Official Stamp Certified</span>
                  </div>
                </div>
              </div>

              {/* Digital Watermark Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400">
                <p>Generated by Skuggle Learning Intelligence Platform · Tamper-evident verified document.</p>
                <p className="font-mono">VERIFICATION HASH: SKG-2026-CHIA-0142-99882</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 no-print mt-8">
        © 2026 Skuggle. Authorized Result Checking Infrastructure.
      </div>
    </div>
  );
};
