import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  Plus,
  ArrowRight,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { fetchPlatformOverview, type PlatformOverview } from '@/shared/api/platform';
import { getApiError } from '@/shared/api/client';
import { appConfig } from '@/app/config';
import { PageSkeleton } from '@/shared/ui';

interface SuperAdminDashboardViewProps {
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigateTab: (tab: string) => void;
}

const formatNaira = (minor?: number) => {
  if (minor == null) return '—';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(minor / 100);
};

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!appConfig.liveApi) {
      setError('Live API is disabled. Platform HQ requires a connected backend.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        setOverview(await fetchPlatformOverview());
      } catch (caught) {
        setError(getApiError(caught).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredSchools = useMemo(() => {
    const schools = overview?.recentSchools ?? [];
    if (!searchTerm.trim()) return schools;
    const q = searchTerm.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.status ?? '').toLowerCase().includes(q),
    );
  }, [overview, searchTerm]);

  if (loading) {
    return <PageSkeleton label="Loading platform overview…" />;
  }

  if (error || !overview) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          {error ?? 'Platform overview unavailable.'}
        </div>
      </div>
    );
  }

  const metricIcon = (id: string) => {
    if (id.includes('student')) return <Users className="w-5 h-5" />;
    if (id.includes('subscription') || id.includes('revenue')) return <DollarSign className="w-5 h-5" />;
    if (id.includes('ai') || id.includes('failed')) return <Activity className="w-5 h-5" />;
    return <Building2 className="w-5 h-5" />;
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Platform HQ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {overview.greeting ?? 'Live multi-tenant overview'} · source {overview.source ?? 'live'}
          </p>
        </div>
        <button
          onClick={() => onOpenModal('onboarding_wizard')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Provision New School
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {overview.metrics.slice(0, 8).map((metric) => (
          <div
            key={metric.id}
            className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {metricIcon(metric.id)}
            </div>
            <div className="mt-2.5">
              <p className="text-[11.5px] font-medium text-slate-500">{metric.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </p>
              <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5 flex items-center gap-0.5">
                {metric.trend?.direction === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                <span>{metric.trend?.label ?? metric.helper ?? 'Live'}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {overview.revenue && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Catalogue MRR</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatNaira(overview.revenue.totalMinor)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{overview.revenue.trendLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('subscriptions')}
            className="text-xs font-bold text-indigo-600 inline-flex items-center gap-1"
          >
            View subscriptions <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {(overview.tasks?.length ?? 0) > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {overview.tasks!.map((task) => (
            <div key={task.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{task.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent schools</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter recent…"
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs w-full sm:w-56"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredSchools.length === 0 && (
            <p className="px-5 py-8 text-sm text-slate-500">No schools match this filter.</p>
          )}
          {filteredSchools.map((school) => (
            <div key={school.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{school.name}</p>
                <p className="text-[11px] text-slate-500">
                  {school.code} · {school.status}
                  {school.subscriptionPlan ? ` · ${school.subscriptionPlan}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('schools')}
                className="text-xs font-bold text-indigo-600"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
