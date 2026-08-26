import React from 'react';
import {
  ClipboardCheck,
  FileSpreadsheet,
  KeyRound,
  Upload,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

interface ExamOfficerDashboardViewProps {
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigateTab: (tab: string) => void;
}

export const ExamOfficerDashboardView: React.FC<ExamOfficerDashboardViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Examination office</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-indigo-600" /> Assessments, scores & publication
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create assessments, enter scores, publish results, and manage result PINs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Open assessments', value: '—', icon: ClipboardCheck },
          { label: 'Scores pending', value: '—', icon: Upload },
          { label: 'Ready to publish', value: '—', icon: FileSpreadsheet },
          { label: 'Active result PINs', value: '—', icon: KeyRound },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{card.label}</p>
              <card.icon className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { id: 'assessments', title: 'Assessments', detail: 'Create CA / exam windows and assign subjects.' },
          { id: 'scores', title: 'Score entry', detail: 'Enter or import marks for open assessments.' },
          { id: 'results', title: 'Results publish', detail: 'Review and publish term results to parents.' },
          { id: 'pins', title: 'Result PINs', detail: 'Issue and rotate public result-checker PINs.' },
          { id: 'reports', title: 'Exam reports', detail: 'Broadsheets, subject analysis, and failure lists.' },
          { id: 'smartmark', title: 'SmartMark', detail: 'Scan OMR / scripts into the gradebook.' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id === 'assessments' || item.id === 'scores') {
                onNavigateTab('assessments');
                return;
              }
              if (item.id === 'results' || item.id === 'pins') {
                onNavigateTab('results');
                return;
              }
              if (item.id === 'reports') {
                onNavigateTab('reports');
                return;
              }
              onOpenModal('smartmark_scan');
            }}
            className="rounded-2xl border border-slate-100 bg-white p-5 text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition"
          >
            <p className="text-sm font-bold text-slate-900 flex items-center justify-between gap-2">
              {item.title}
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-5">{item.detail}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
