import React from 'react';
import { X } from 'lucide-react';
import { ResultCheckerForm } from '@/features/results/ResultCheckerForm';

interface ResultCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: { admissionNo?: string } | null;
}

export const ResultCheckerModal: React.FC<ResultCheckerModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Result PIN Checker</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <ResultCheckerForm
            initialAdmissionNo={student?.admissionNo ?? ''}
            compact
          />
        </div>
      </div>
    </div>
  );
};
