import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Building2,
  GraduationCap,
  ShieldCheck,
  CreditCard,
  X,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan, SubscriptionPlanType } from '../../types';

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  phase?: 'personal' | 'school';
}

export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({
  isOpen,
  onClose,
  phase,
}) => {
  const {
    subscriptionPlans,
    activeSchoolPlan,
    activePersonalPlan,
    upgradePlan,
    branding,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'school' | 'individual'>(phase === 'personal' ? 'individual' : 'school');
  const [studentCount, setStudentCount] = useState<number>(350);
  const [includeIntelligenceAddon, setIncludeIntelligenceAddon] = useState<boolean>(true);

  useEffect(() => {
    if (phase) setActiveTab(phase === 'personal' ? 'individual' : 'school');
  }, [phase, isOpen]);

  if (!isOpen) return null;

  const schoolPlans = subscriptionPlans.filter((p) => p.category === 'school' || p.category === 'addon');
  const individualPlans = subscriptionPlans.filter((p) => p.category === 'personal');

  // Calculator Math
  const coreRatePerStudent = 1200; // ₦1,200 / student / term
  const intelligenceRatePerStudent = 600; // ₦600 / student / term
  const totalPerStudentTerm =
    coreRatePerStudent + (includeIntelligenceAddon ? intelligenceRatePerStudent : 0);
  const termTotalNaira = studentCount * totalPerStudentTerm;
  const annualTotalNaira = termTotalNaira * 3; // 3 terms / session

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    upgradePlan(plan.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Subscription & Entitlements Hub
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800">
                  Fair Nigerian Pricing
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transparent school per-student billing and personal educator subscriptions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher & Golden Rule Banner */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
            {phase !== 'personal' && (
            <button
              onClick={() => setActiveTab('school')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'school'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>School Institutional Plans</span>
            </button>
            )}
            {phase !== 'school' && (
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'individual'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Personal Educator & Learner Spaces</span>
            </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-amber-50/70 border border-amber-200 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Golden Rule:</strong> When a school subscribes, its teachers, parents, and students do not pay separately.
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8">
          {/* TAB 1: SCHOOL INSTITUTIONAL PLANS */}
          {activeTab === 'school' && (
            <div className="space-y-8">
              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {schoolPlans.map((plan) => {
                  const isCurrent = activeSchoolPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between relative ${
                        plan.highlight
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/10'
                          : isCurrent
                          ? 'border-emerald-600 bg-emerald-50/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {plan.highlight && (
                        <span className="absolute -top-3 right-6 px-3 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-600 text-white shadow-2xs">
                          Most Popular
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-display font-bold text-lg text-slate-900">{plan.name}</h4>
                          <span className="text-[11px] font-bold text-slate-500 capitalize">
                            {plan.billingPeriod.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="mb-4">
                          <span className="font-display font-extrabold text-2xl text-slate-900">
                            {plan.priceNGN === 0 ? '₦0 Free' : `₦${plan.priceNGN.toLocaleString()}`}
                          </span>
                          {plan.priceNGN > 0 && (
                            <span className="text-xs text-slate-500 ml-1">/ student / term</span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-6">{plan.tagline}</p>

                        <div className="space-y-2 mb-6 pt-4 border-t border-slate-100">
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                  feat.included ? 'text-emerald-600' : 'text-slate-300'
                                }`}
                              />
                              <span className={feat.included ? 'text-slate-700' : 'text-slate-400 line-through'}>
                                {feat.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : plan.highlight
                            ? 'bg-indigo-900 hover:bg-indigo-950 text-white shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Active School Plan</span>
                          </>
                        ) : (
                          <>
                            <span>Select {plan.name}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Term Tuition Fee Calculator */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Calculator className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-display font-bold text-base text-white">
                        School Term Budget Estimator
                      </h4>
                      <p className="text-xs text-slate-400">
                        Calculate exact cost based on your active student enrollment roster.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-white/10 rounded-full text-indigo-200">
                    Nigerian Naira (NGN)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Active Student Count: <span className="text-amber-400 font-extrabold text-sm">{studentCount} Students</span>
                    </label>
                    <input
                      type="range"
                      min={20}
                      max={1200}
                      step={10}
                      value={studentCount}
                      onChange={(e) => setStudentCount(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>20 Students</span>
                      <span>500 Students</span>
                      <span>1,200+ Students</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeIntelligenceAddon}
                        onChange={(e) => setIncludeIntelligenceAddon(e.target.checked)}
                        className="w-4 h-4 text-indigo-500 rounded accent-indigo-500"
                      />
                      <span className="text-xs font-bold text-white">Include Intelligence Add-On</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      +₦600/student/term for optical SmartMark bubble sheet grading and AI Student 360 radar.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
                      Estimated Cost Per Term
                    </span>
                    <span className="font-display font-extrabold text-2xl text-amber-400 block mt-1">
                      ₦{termTotalNaira.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Approx. ₦{annualTotalNaira.toLocaleString()} / Full Academic Session (3 terms)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INDIVIDUAL EDUCATOR & LEARNER PLANS */}
          {activeTab === 'individual' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {individualPlans.map((plan) => {
                  const isCurrent = activePersonalPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                        plan.highlight
                          ? 'border-purple-600 bg-purple-50/20 shadow-md ring-2 ring-purple-500/10'
                          : isCurrent
                          ? 'border-emerald-600 bg-emerald-50/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-display font-bold text-lg text-slate-900">{plan.name}</h4>
                          <span className="text-[11px] font-bold text-slate-500 capitalize">
                            {plan.billingPeriod.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="mb-4">
                          <span className="font-display font-extrabold text-2xl text-slate-900">
                            {plan.priceNGN === 0 ? '₦0 Free' : `₦${plan.priceNGN.toLocaleString()}`}
                          </span>
                          {plan.priceNGN > 0 && (
                            <span className="text-xs text-slate-500 ml-1">/ month</span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-6">{plan.tagline}</p>

                        <div className="space-y-2 mb-6 pt-4 border-t border-slate-100">
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                  feat.included ? 'text-emerald-600' : 'text-slate-300'
                                }`}
                              />
                              <span className={feat.included ? 'text-slate-700' : 'text-slate-400 line-through'}>
                                {feat.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : plan.highlight
                            ? 'bg-purple-900 hover:bg-purple-950 text-white shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Active Personal Plan</span>
                          </>
                        ) : (
                          <>
                            <span>Select {plan.name}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Free for School Community Note */}
              <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 leading-relaxed">
                  <strong>School Association Benefit:</strong> Are you a teacher, parent, or student in a subscribed school? You automatically get full access to your school's workspace without requiring an individual paid plan.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Secure Nigerian Gateway Support: Paystack, Flutterwave, Direct NIBSS Transfer</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl shadow-2xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
