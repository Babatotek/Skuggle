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

export const ResultsManagementView: React.FC = () => {
  const { branding, resultPINs, generatePINs, showToast } = useApp();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <KeyRound className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              Result Checking PINs & Scratch Cards
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full">
              {resultPINs.length} Active PINs
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate and manage scratch-card PIN batches for student report card access on the public portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintPINs}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PIN Batch Cards</span>
          </button>
        </div>
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

