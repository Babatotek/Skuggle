import React from 'react';
import { Check } from 'lucide-react';

export const WIZARD_STEPS = [
  { id: 'identity', label: 'Identity' },
  { id: 'academic', label: 'Academic' },
  { id: 'guardian', label: 'Guardian' },
  { id: 'contact', label: 'Contact' },
  { id: 'welfare', label: 'Welfare' },
  { id: 'documents', label: 'Documents' },
  { id: 'portal', label: 'Portal' },
  { id: 'review', label: 'Review' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

interface WizardStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (index: number) => void;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ currentStep, completedSteps, onStepClick }) => (
  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
    {WIZARD_STEPS.map((step, index) => {
      const isActive = index === currentStep;
      const isComplete = completedSteps.has(index);
      const isClickable = onStepClick && (isComplete || index <= currentStep);

      return (
        <React.Fragment key={step.id}>
          {index > 0 && <div className={`h-px w-4 sm:w-6 shrink-0 ${isComplete || index <= currentStep ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
          <button
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onStepClick?.(index)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              isActive ? 'bg-indigo-600 text-white' : isComplete ? 'text-indigo-700 hover:bg-indigo-50' : 'text-slate-400'
            } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              isActive ? 'bg-white/20 text-white' : isComplete ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {isComplete && !isActive ? <Check className="w-3 h-3" /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        </React.Fragment>
      );
    })}
  </div>
);
