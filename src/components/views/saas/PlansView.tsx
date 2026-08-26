import React, { useEffect, useState } from 'react';
import {
  Layers,
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  Building2,
  Cpu,
  Database,
  PhoneCall,
  DollarSign,
  ArrowRight,
  Plus,
  Edit3,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { SaaSPlanDefinition, SaaSPlanTier } from '../../../types';
import { feedbackBus } from '../../../shared/feedback/feedbackBus';
import { fetchPlans } from '@/shared/api/platform';
import { getApiError } from '@/shared/api/client';
import { appConfig } from '@/app/config';

interface PlansViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const [plans, setPlans] = useState<SaaSPlanDefinition[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'termly' | 'annual'>('termly');
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<SaaSPlanDefinition | null>(null);

  React.useEffect(() => {
    if (!appConfig.liveApi) {
      setLiveError('Live API disabled — plans catalogue unavailable.');
      return;
    }
    void (async () => {
      try {
        const result = await fetchPlans();
        const rows = (Array.isArray(result) ? result : []) as Array<Record<string, unknown>>;
        setPlans(
          rows.map((plan, index) => {
            const code = String(plan.code ?? `plan_${index}`);
            const name = String(plan.name ?? code);
            const tier = (
              code === 'pilot'
                ? 'Starter'
                : code === 'growth'
                  ? 'Growth'
                  : code === 'enterprise'
                    ? 'Enterprise'
                    : 'Growth'
            ) as SaaSPlanTier;
            const limits = (plan.limits as Record<string, number> | undefined) ?? {};
            const featureList = Array.isArray(plan.features) ? (plan.features as string[]) : [];
            const price = Math.round(Number(plan.priceMinor ?? 0) / 100);

            return {
              id: String(plan.id ?? code),
              name: tier,
              tagline: name,
              termlyPriceNGN: price,
              annualPriceNGN: Math.round(price * 10),
              maxStudents: limits.students ?? 0,
              maxTeachers: limits.users ?? 0,
              storageGB: Math.round((limits.storage_bytes ?? 0) / (1024 ** 3)) || 1,
              smartMarkMonthlyScans: 0,
              geminiAICredits: `${limits.ai_requests_per_day ?? 0}/day`,
              smsCreditsPerTerm: 0,
              popular: code === 'growth',
              features: featureList.map((title) => ({ title, included: true })),
              activeSchoolsCount: 0,
            } satisfies SaaSPlanDefinition;
          }),
        );
        setLiveError(null);
      } catch (error) {
        setLiveError(getApiError(error).message);
      }
    })();
  }, []);

  // Custom enterprise calculator state
  const [customStudents, setCustomStudents] = useState<number>(5000);
  const [customBranches, setCustomBranches] = useState<number>(5);
  const [includeDedicatedDB, setIncludeDedicatedDB] = useState<boolean>(true);
  const [includeWhiteLabelApp, setIncludeWhiteLabelApp] = useState<boolean>(true);

  const calculateCustomEstimate = () => {
    let base = 1800000; // Base Enterprise per term
    base += Math.max(0, customStudents - 3500) * 250;
    base += (customBranches - 1) * 200000;
    if (includeDedicatedDB) base += 350000;
    if (includeWhiteLabelApp) base += 450000;
    return billingCycle === 'annual' ? Math.round(base * 2.6) : base;
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200 overflow-x-hidden">
      {liveError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {liveError}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1 flex-wrap">
            <span className="text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab('overview')}>
              Super Admin HQ
            </span>
            <span>/</span>
            <span className="text-slate-800 font-bold">SaaS Plans & Pricing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 flex-wrap">
            <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 flex-shrink-0" />
            <span>Subscription Tier Matrix & Quotas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage pricing tiers, student enrollment quotas, SmartMark OCR limits, and feature flags.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto border border-slate-200 flex-shrink-0">
          <button
            onClick={() => setBillingCycle('termly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'termly'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Termly Billing (3 Terms/Yr)
          </button>

          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 4 Tier Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.popular;
          const price = billingCycle === 'annual' ? plan.annualPriceNGN : plan.termlyPriceNGN;
          const cycleLabel = billingCycle === 'annual' ? '/ year' : '/ term';

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 border flex flex-col justify-between relative transition-all hover:shadow-xl ${
                isPopular
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                  : 'border-slate-200 shadow-sm'
              }`}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div
                  className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-xs ${
                    isPopular
                      ? 'bg-indigo-600 text-white'
                      : plan.name === 'Enterprise'
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between mt-1">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {plan.activeSchoolsCount} Schools
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.tagline}</p>

                {/* Price Display */}
                <div className="mt-4 pb-4 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      ₦{price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{cycleLabel}</span>
                  </div>
                  <p className="text-[11px] text-indigo-600 font-medium mt-1">
                    {billingCycle === 'annual' ? 'Covers full 3-term academic session' : 'Billed at the start of each term'}
                  </p>
                </div>

                {/* Quota Highlights */}
                <div className="py-4 space-y-2.5 text-xs border-b border-slate-100">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Student Capacity</span>
                    <span className="font-bold text-slate-900">{plan.maxStudents === 'Unlimited' ? 'Unlimited' : `Up to ${plan.maxStudents.toLocaleString()}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Staff / Teachers</span>
                    <span className="font-bold text-slate-900">{plan.maxTeachers === 'Unlimited' ? 'Unlimited' : `Up to ${plan.maxTeachers}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">SmartMark OCR</span>
                    <span className="font-bold text-indigo-700">
                      {plan.smartMarkMonthlyScans === 'Unlimited' ? 'Unlimited Scans' : `${plan.smartMarkMonthlyScans.toLocaleString()} scans/mo`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Cloud Storage</span>
                    <span className="font-bold text-slate-900">{plan.storageGB} GB Vault</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">AI Tokens</span>
                    <span className="font-bold text-purple-700">{plan.geminiAICredits}</span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <div className="py-4 space-y-2 text-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Included Features:</p>
                  {plan.features.slice(0, 7).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      {feat.included ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <span className={feat.included ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                        {feat.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2">
                <button
                  onClick={() => {
                    setSelectedPlanForEdit(plan);
                    feedbackBus.info(`Configuring ${plan.name} Tier limits and features`);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configure {plan.name} Tier</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Custom Calculator & Add-On Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Custom Multi-Campus Quote Calculator (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Enterprise & Ministry Quote Estimator</h2>
              <p className="text-xs text-slate-500">Calculate custom terms for State School Boards, Diocesan Education Directorates, and Large Chains.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Slider 1: Total Students */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Total Enrolled Students</span>
                <span className="text-indigo-700 text-sm font-extrabold">{customStudents.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={customStudents}
                onChange={(e) => setCustomStudents(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>1,000</span>
                <span>25,000</span>
                <span>50,000+</span>
              </div>
            </div>

            {/* Slider 2: Campus Branches */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Campus Branches</span>
                <span className="text-indigo-700 text-sm font-extrabold">{customBranches} Campuses</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={customBranches}
                onChange={(e) => setCustomBranches(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>1 Branch</span>
                <span>10 Branches</span>
                <span>25+ Branches</span>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-slate-800">Isolated Virtual Private Cloud (Dedicated Database Instance)</span>
              </div>
              <input
                type="checkbox"
                checked={includeDedicatedDB}
                onChange={(e) => setIncludeDedicatedDB(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-slate-800">Custom White-Label Mobile App on Google Play / iOS App Store</span>
              </div>
              <input
                type="checkbox"
                checked={includeWhiteLabelApp}
                onChange={(e) => setIncludeWhiteLabelApp(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </label>
          </div>

          {/* Output Calculation */}
          <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl text-white flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] text-purple-200 font-semibold uppercase tracking-wider">Estimated Institutional Package:</p>
              <p className="text-2xl sm:text-3xl font-black mt-0.5">
                ₦{calculateCustomEstimate().toLocaleString()}{' '}
                <span className="text-xs font-semibold text-purple-200">
                  {billingCycle === 'annual' ? '/ year' : '/ term'}
                </span>
              </p>
            </div>

            <button
              onClick={() => onOpenModal('onboarding_wizard')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Generate Formal SLA Proposal
            </button>
          </div>
        </div>

        {/* Add-on Capacity Packs (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add-On Resource Bundles</h3>
              <p className="text-[11px] text-slate-500">Schools can purchase on-demand capacity boosts.</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Add-on 1 */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">SmartMark OCR Scan Booster</p>
                <p className="text-[11px] text-slate-500">+5,000 optical grading scans</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-indigo-700">₦45,000</p>
                <span className="text-[10px] text-slate-400">Never expires</span>
              </div>
            </div>

            {/* Add-on 2 */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">WhatsApp & SMS Bulk Pack</p>
                <p className="text-[11px] text-slate-500">10,000 instant parent alerts</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-indigo-700">₦35,000</p>
                <span className="text-[10px] text-slate-400">All Nigerian Telcos</span>
              </div>
            </div>

            {/* Add-on 3 */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Gemini AI Lesson & Quiz Pool</p>
                <p className="text-[11px] text-slate-500">5,000,000 inference tokens</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-indigo-700">₦60,000</p>
                <span className="text-[10px] text-slate-400">High speed Flash</span>
              </div>
            </div>

            {/* Add-on 4 */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Cloud Storage Expansion</p>
                <p className="text-[11px] text-slate-500">+100 GB Document Vault</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-indigo-700">₦25,000 / term</p>
                <span className="text-[10px] text-slate-400">Encrypted backup</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
