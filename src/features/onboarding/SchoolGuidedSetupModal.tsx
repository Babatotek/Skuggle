import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  GraduationCap,
  BookOpen,
  Award,
  Users,
  UserCheck,
  Send,
  Rocket,
  X,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GuidedSetupStep } from '../../types';

interface SchoolGuidedSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const SchoolGuidedSetupModal: React.FC<SchoolGuidedSetupModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const { guidedSetupSteps, toggleGuidedSetupStep, branding } = useApp();

  if (!isOpen) return null;

  const completedCount = guidedSetupSteps.filter((s) => s.isDone).length;
  const progressPercent = Math.round((completedCount / guidedSetupSteps.length) * 100);

  const getStepIcon = (order: number) => {
    switch (order) {
      case 1:
        return Building2;
      case 2:
        return Calendar;
      case 3:
        return Layers;
      case 4:
        return GraduationCap;
      case 5:
        return BookOpen;
      case 6:
        return Award;
      case 7:
        return Users;
      case 8:
        return UserCheck;
      case 9:
        return Send;
      case 10:
        return Rocket;
      default:
        return Sparkles;
    }
  };

  const handleStepAction = (routeTab?: string) => {
    if (routeTab && onNavigateToTab) {
      onNavigateToTab(routeTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-slate-900">
                  10-Step School Launch Blueprint
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-100 text-indigo-800">
                  {branding.schoolName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Complete all foundational operational steps to launch a fully configured school portal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-indigo-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span>Launch Readiness Progress</span>
              <span className="text-amber-400 font-extrabold">{progressPercent}% Ready</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-indigo-200 sm:ml-4 whitespace-nowrap">
            {completedCount} of {guidedSetupSteps.length} Steps Complete
          </span>
        </div>

        {/* Step Items List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {guidedSetupSteps.map((step) => {
            const IconComponent = getStepIcon(step.step);
            return (
              <div
                key={step.step}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  step.isDone
                    ? 'bg-slate-50/70 border-slate-200 text-slate-700'
                    : 'bg-white border-indigo-200/80 shadow-2xs text-slate-900'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleGuidedSetupStep(step.step)}
                    className="mt-0.5 text-indigo-600 hover:text-indigo-800 transition-colors"
                    title={step.isDone ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {step.isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{step.step}
                      </span>
                      <h4
                        className={`font-display font-bold text-sm ${
                          step.isDone ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Complete this setup item to prepare the school workspace for launch.
                    </p>
                  </div>
                </div>

                {false && (
                  <button
                    onClick={() => handleStepAction('dashboard')}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>Configure</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Step completion status is persisted automatically to your school tenant.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-900 rounded-xl shadow-2xs"
          >
            Close Blueprint
          </button>
        </div>
      </motion.div>
    </div>
  );
};
