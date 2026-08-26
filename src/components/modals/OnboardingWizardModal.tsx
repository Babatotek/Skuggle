import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
  Calendar,
  Layers,
  Award,
  DollarSign,
  QrCode,
  Users,
  ShieldCheck,
  Rocket,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [schoolName, setSchoolName] = useState('Bright Future Academy');
  const [motto, setMotto] = useState('Knowledge is Light');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('Lagos State');
  const [plan, setPlan] = useState('Growth Plan (500-1500 students)');

  if (!isOpen) return null;

  const steps = [
    { num: 1, title: 'School Bio', icon: Building2 },
    { num: 2, title: 'Campuses', icon: Building2 },
    { num: 3, title: 'Sessions', icon: Calendar },
    { num: 4, title: 'Classes', icon: Layers },
    { num: 5, title: 'Grading', icon: Award },
    { num: 6, title: 'Fees', icon: DollarSign },
    { num: 7, title: 'SmartMark', icon: QrCode },
    { num: 8, title: 'Staff', icon: Users },
    { num: 9, title: 'Security', icon: ShieldCheck },
    { num: 10, title: 'Launch', icon: Rocket },
  ];

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep(prev => prev + 1);
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      alert(`🎉 Congratulations! ${schoolName} has been successfully provisioned on Skuggle Cloud.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
              Step {currentStep} of 10
            </span>
            <h2 className="text-base font-bold text-slate-900">
              10-Step School Onboarding & Cloud Tenant Setup
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Step Tracker */}
        <div className="px-6 py-2 bg-indigo-50/40 border-b border-indigo-100 flex items-center justify-between overflow-x-auto gap-1">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                currentStep === s.num
                  ? 'bg-indigo-600 text-white'
                  : currentStep > s.num
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{s.num}.</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Wizard Step Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Step 1: School Identity & General Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official School Name</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">School Motto / Slogan</label>
                  <input
                    type="text"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option>Nigeria</option>
                    <option>Ghana</option>
                    <option>Kenya</option>
                    <option>United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State / Province</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Step 2: Campuses & Facilities</h3>
              <p className="text-slate-500">Configure main campus and multi-branch campuses.</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span>Main Campus (Lekki Phase 1)</span>
                  <span className="text-emerald-600">Active Primary Campus</span>
                </div>
                <p className="text-slate-500">Capacity: 1,500 students • 48 classrooms • 4 science labs</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Step 3: Academic Sessions & Term Calendars</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold">
                  <p>Current Session</p>
                  <p className="text-base text-indigo-700 mt-1">2026/2027 Academic Year</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold">
                  <p>Active Term</p>
                  <p className="text-base text-indigo-700 mt-1">First Term (Weeks 1 - 13)</p>
                </div>
              </div>
            </div>
          )}

          {currentStep >= 4 && currentStep <= 9 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Step {currentStep}: {steps[currentStep - 1].title} Setup
              </h3>
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900">Pre-configured with Skuggle Best Practices</p>
                  <p className="text-[11px] text-emerald-700">Class arms, NERDC grading scales, fee heads & SmartMark templates are already auto-aligned.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 10 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
                <Rocket className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ready to Launch {schoolName}!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your dedicated subdomain <strong className="text-indigo-600">brightfuture.skuggle.com</strong> and cloud database are ready.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5"
          >
            <span>{currentStep === 10 ? 'Finalize & Launch School 🚀' : 'Next Step'}</span>
            {currentStep < 10 && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>
    </div>
  );
};
