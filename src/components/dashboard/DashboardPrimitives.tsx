import React from 'react';

export type DashboardTone = 'indigo' | 'emerald' | 'blue' | 'amber' | 'slate';

const tones: Record<DashboardTone, string> = {
  indigo: 'from-indigo-950 via-slate-900 to-violet-950 border-indigo-800/40',
  emerald: 'from-emerald-950 via-slate-900 to-teal-950 border-emerald-800/40',
  blue: 'from-blue-950 via-slate-900 to-cyan-950 border-blue-800/40',
  amber: 'from-amber-950 via-slate-900 to-orange-950 border-amber-800/40',
  slate: 'from-slate-950 via-slate-900 to-slate-800 border-slate-700',
};

export const DashboardStack: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`space-y-6 ${className}`}>{children}</div>
);

export interface DashboardHeroProps {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  tone?: DashboardTone;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ eyebrow, title, description, meta, action, tone = 'indigo' }) => (
  <section className={`bg-gradient-to-r ${tones[tone]} text-white rounded-3xl p-6 sm:p-8 shadow-sm border`}>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 border border-white/15">{eyebrow}</span>
          {meta && <span className="text-xs text-slate-300 font-mono">{meta}</span>}
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">{title}</h1>
        {description && <p className="text-xs sm:text-sm text-slate-200 mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </section>
);

export interface DashboardMetricProps {
  label: React.ReactNode;
  value: React.ReactNode;
  trend?: React.ReactNode;
  detail?: React.ReactNode;
  valueClassName?: string;
}

export const DashboardMetric: React.FC<DashboardMetricProps> = ({ label, value, trend, detail, valueClassName = 'text-slate-900' }) => (
  <article className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs min-w-0">
    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{label}</span>
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-display font-extrabold text-2xl ${valueClassName}`}>{value}</span>
      {trend && <span className="text-xs font-semibold text-emerald-700">{trend}</span>}
    </div>
    {detail && <p className="text-[11px] text-slate-500 mt-1">{detail}</p>}
  </article>
);

export const DashboardMetricGrid: React.FC<React.PropsWithChildren<{ columns?: 2 | 3 | 4 }>> = ({ children, columns = 3 }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : columns === 4 ? 'lg:grid-cols-4' : ''} gap-4`}>{children}</div>
);

export const DashboardLoading: React.FC = () => (
  <div className="space-y-4 animate-pulse" role="status" aria-label="Loading dashboard">
    <div className="h-36 rounded-3xl bg-slate-200" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-2xl bg-slate-100 border border-slate-200" />)}
    </div>
  </div>
);
