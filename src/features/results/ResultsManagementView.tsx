import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  KeyRound,
  PlusCircle,
  CheckCircle2,
  Printer,
  Copy,
  Lock,
  Unlock,
  Sparkles,
  BookOpen,
  Send,
  ShieldCheck,
  Search,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CollapsibleCard, CollapsibleCardGroup } from '../../components/CollapsibleCard';
import { AssessmentRecord } from '../../types';

export type ResultsSection = 'results' | 'result-approval' | 'result-publishing' | 'result-pins';

interface ResultsManagementViewProps {
  section?: string;
}

function gradeFromAverage(average: number): string {
  if (average >= 75) return 'A1';
  if (average >= 70) return 'B2';
  if (average >= 65) return 'B3';
  if (average >= 60) return 'C4';
  if (average >= 55) return 'C5';
  if (average >= 50) return 'C6';
  if (average >= 45) return 'D7';
  if (average >= 40) return 'E8';
  return 'F9';
}

export const ResultsManagementView: React.FC<ResultsManagementViewProps> = ({ section = 'results' }) => {
  const { branding, resultPINs, generatePINs, showToast, students, assessments, updateAssessment } = useApp();

  const [pinCount, setPinCount] = useState(10);
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2025/2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchPinQuery, setSearchPinQuery] = useState('');

  const handleGeneratePINs = () => {
    setIsGenerating(true);
    setTimeout(() => {
      generatePINs(pinCount, selectedTerm, selectedSession);
      setIsGenerating(false);
      showToast('PINs Generated', `Created ${pinCount} unique scratch-card PINs for ${selectedTerm}.`);
    }, 600);
  };

  const handleCopyPIN = (pin: string) => {
    navigator.clipboard.writeText(pin);
    showToast('PIN Copied', `${pin} copied to clipboard.`);
  };

  const handlePrintPINs = () => {
    window.print();
  };

  const filteredPINs = resultPINs.filter((p) => {
    if (!searchPinQuery) return true;
    return (
      p.pin.toLowerCase().includes(searchPinQuery.toLowerCase()) ||
      p.serialNo.toLowerCase().includes(searchPinQuery.toLowerCase()) ||
      (p.assignedAdmissionNo && p.assignedAdmissionNo.toLowerCase().includes(searchPinQuery.toLowerCase()))
    );
  });

  const awaitingApproval = assessments.filter((item) => item.status === 'Submitted' || item.status === 'Validated');
  const awaitingPublish = assessments.filter((item) => item.status === 'Approved');
  const published = assessments.filter((item) => item.status === 'Published');

  if (section === 'result-approval') {
    return (
      <ResultsQueue
        title="Awaiting approval"
        empty="No submitted scripts are waiting on academic approval."
        rows={awaitingApproval}
        actionLabel="Approve"
        onAction={(item) => {
          updateAssessment(item.id, { status: 'Approved', approvedAt: new Date().toISOString() });
          showToast('Approved', `${item.title} is ready to publish.`);
        }}
      />
    );
  }

  if (section === 'result-publishing') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <article className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Approved, unpublished</p><p className="font-display font-extrabold text-2xl mt-1">{awaitingPublish.length}</p></article>
          <article className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Live on portal</p><p className="font-display font-extrabold text-2xl mt-1 text-emerald-700">{published.length}</p></article>
        </div>
        <ResultsQueue
          title="Ready to publish"
          empty="Approve a result batch before it can go live on the parent portal."
          rows={awaitingPublish}
          actionLabel="Publish"
          onAction={(item) => {
            updateAssessment(item.id, { status: 'Published', publishedAt: new Date().toISOString() });
            showToast('Published', `${item.title} is now visible with PIN access.`);
          }}
        />
      </div>
    );
  }

  if (section === 'results') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <article className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-bold uppercase text-slate-400">On register</p><p className="font-display font-extrabold text-2xl">{students.length}</p></article>
          <article className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Published batches</p><p className="font-display font-extrabold text-2xl text-emerald-700">{published.length}</p></article>
          <article className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Pending approval</p><p className="font-display font-extrabold text-2xl text-amber-700">{awaitingApproval.length}</p></article>
          <article className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Class average</p><p className="font-display font-extrabold text-2xl text-indigo-800">{students.length ? Math.round(students.reduce((sum, item) => sum + item.termAverage, 0) / students.length) : 0}%</p></article>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 font-bold">Student</th>
                <th className="p-3 font-bold">Class</th>
                <th className="p-3 font-bold">Term average</th>
                <th className="p-3 font-bold">Grade</th>
                <th className="p-3 font-bold">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No scored students yet.</td></tr>}
              {students.map((student) => (
                <tr key={student.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-semibold text-slate-900">{student.firstName} {student.lastName}<span className="block text-[11px] font-mono text-slate-400">{student.admissionNo}</span></td>
                  <td className="p-3">{student.classLevel} {student.arm}</td>
                  <td className="p-3 font-bold text-indigo-900">{student.termAverage}%</td>
                  <td className="p-3 font-bold">{gradeFromAverage(student.termAverage)}</td>
                  <td className="p-3 text-emerald-700 font-semibold">{student.attendanceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 no-print">
          <button
            type="button"
            onClick={handlePrintPINs}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PIN Batch Cards</span>
          </button>
      </div>

      {/* Multi-Card Collapsible Group across Results Management */}
      <CollapsibleCardGroup
        id="results-management-card-group"
        showGroupControls={true}
        spacing="md"
        defaultOpenIds={['pin-generator-card', 'pin-catalog-card', 'pin-security-card']}
      >
        {/* Card 1: Batch PIN Generator */}
        <CollapsibleCard
          id="pin-generator-card"
          title="Cryptographic PIN Batch Generator"
          subtitle="Mint secure, randomized 16-digit scratch card tokens for terminal result verification"
          icon={<PlusCircle className="w-4 h-4 text-indigo-600" />}
          badge="Batch Minting"
          badgeVariant="indigo"
          defaultOpen={true}
          variant="default"
          padding="md"
          className="no-print"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Academic Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
              >
                <option value="2025/2026">2025/2026</option>
                <option value="2024/2025">2024/2025</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Term Target
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Number of PINs (Batch Size)
              </label>
              <input
                type="number"
                value={pinCount}
                onChange={(e) => setPinCount(parseInt(e.target.value) || 10)}
                min={1}
                max={50}
                className="w-full font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              Each generated scratch PIN includes a unique serial audit ID, encrypted cryptographic checksum, and is limited to 5 views.
            </p>
            <button
              type="button"
              id="generate-batch-pins-btn"
              onClick={handleGeneratePINs}
              disabled={isGenerating}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isGenerating ? 'Generating Cryptographic PINs...' : `Generate ${pinCount} Scratch PINs`}</span>
            </button>
          </div>
        </CollapsibleCard>

        {/* Card 2: Active PIN Catalog */}
        <CollapsibleCard
          id="pin-catalog-card"
          title={`Issued Scratch Card PIN Register (${filteredPINs.length})`}
          subtitle={`${branding.schoolName} · Verified for ${branding.academicSession} portal access`}
          icon={<KeyRound className="w-4 h-4 text-amber-600" />}
          badge={`${resultPINs.filter((p) => !p.isUsed).length} Available`}
          badgeVariant="success"
          defaultOpen={true}
          variant="default"
          padding="md"
          headerActions={
            <div className="relative w-40 sm:w-56" onClick={(e) => e.stopPropagation()}>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchPinQuery}
                onChange={(e) => setSearchPinQuery(e.target.value)}
                placeholder="Search PIN / Serial..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPINs.map((pinItem, index) => {
              const itemKey = pinItem.serialNo || pinItem.pin || (pinItem as any).id || `pin-${index}`;
              const usage = pinItem.usageCount ?? (pinItem as any).usedCount ?? 0;
              const max = pinItem.maxUsage ?? (pinItem as any).maxUses ?? 5;
              return (
                <div
                  key={itemKey}
                  id={`result-pin-card-${index}`}
                  className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white hover:border-amber-300 transition-all flex items-center justify-between shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-extrabold text-xs sm:text-sm text-indigo-950 tracking-wider truncate">
                        {pinItem.pin}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md shrink-0 ${
                          pinItem.isUsed
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {pinItem.isUsed ? 'Used' : 'Ready'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>{pinItem.serialNo}</span>
                      <span>·</span>
                      <span>{usage}/{max} uses</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id={`copy-pin-btn-${index}`}
                    onClick={() => handleCopyPIN(pinItem.pin)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors no-print cursor-pointer shrink-0"
                    title="Copy PIN"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </CollapsibleCard>

        {/* Card 3: Security & Verification Policy */}
        <CollapsibleCard
          id="pin-security-card"
          title="Security, Audit Trails & Usage Policy"
          subtitle="Federal Ministry of Education and NERDC standard guidelines for electronic report card issuance"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          badge="Policy Guard"
          badgeVariant="slate"
          defaultOpen={false}
          variant="subtle"
          padding="md"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Anti-Tamper PIN Quota</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Each PIN allows a maximum of 5 distinct browser sessions before invalidation, preventing unauthorized public dissemination of student terminal grades.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>Batch Serialization</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All scratch card batches include chronological serial numbers (`SRN-2025-XXX`) stored in school audit registers for financial and administrative reconciliation.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Parent Portal Check</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Parents enter both the Student Admission Number and 16-digit PIN on the Public Result Portal to render authenticated, watermarked PDF report cards.
              </p>
            </div>
          </div>
        </CollapsibleCard>
      </CollapsibleCardGroup>
    </div>
  );
};

const ResultsQueue: React.FC<{
  title: string;
  empty: string;
  rows: AssessmentRecord[];
  actionLabel: string;
  onAction: (item: AssessmentRecord) => void;
}> = ({ title, empty, rows, actionLabel, onAction }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-100">
      <h2 className="font-display font-bold text-sm text-slate-900">{title}</h2>
    </div>
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-slate-500 bg-slate-50">
          <th className="px-4 py-3 font-bold">Assessment</th>
          <th className="p-3 font-bold">Class</th>
          <th className="p-3 font-bold">Subject</th>
          <th className="p-3 font-bold">Status</th>
          <th className="p-3 font-bold text-right"> </th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">{empty}</td></tr>}
        {rows.map((item) => (
          <tr key={item.id} className="border-t border-slate-100">
            <td className="px-4 py-3 font-semibold text-slate-900">{item.title}</td>
            <td className="p-3">{item.classLevel} {item.arm}</td>
            <td className="p-3">{item.subject}</td>
            <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold">{item.status}</span></td>
            <td className="p-3 text-right">
              <button type="button" onClick={() => onAction(item)} className="px-3 py-1.5 rounded-lg bg-indigo-950 text-white font-bold">{actionLabel}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
