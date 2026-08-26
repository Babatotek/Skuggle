import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Server,
  Cpu,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { fetchPlatformGoLive, fetchPlatformSystemHealth } from '@/shared/api/platform';
import { getApiError } from '@/shared/api/client';
import { appConfig } from '@/app/config';
import { PageSkeleton } from '@/shared/ui';

interface SystemHealthViewProps {
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigateTab: (tab: string) => void;
}

type HealthPayload = {
  status: string;
  checkedAt?: string;
  checks: Record<string, boolean>;
  queue: { pending: number; failed: number };
  runtime: Record<string, unknown>;
};

type GoLivePayload = {
  ready: boolean;
  checkedAt?: string;
  gates: Array<{
    id: string;
    label: string;
    status: string;
    detail: string;
    action: string;
  }>;
  commands: Record<string, string>;
};

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({ onNavigateTab }) => {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [goLive, setGoLive] = useState<GoLivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!appConfig.liveApi) {
      setError('Live API disabled.');
      setLoading(false);
      return;
    }
    try {
      const [healthResult, goLiveResult] = await Promise.all([
        fetchPlatformSystemHealth(),
        fetchPlatformGoLive(),
      ]);
      setHealth(healthResult);
      setGoLive(goLiveResult);
      setError(null);
    } catch (caught) {
      setError(getApiError(caught).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton label="Checking system health…" />;

  const checks = health?.checks ?? {};
  const ready = health?.status === 'ready';

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => onNavigateTab('overview')}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Super Admin HQ
          </button>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            System health
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Runtime probes plus go-live gates for MFA, mail, backups, and security sign-off.
          </p>
        </div>
        <button
          type="button"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void load();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Re-check
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      <div
        className={`rounded-2xl border p-5 flex items-center gap-3 ${
          ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
        }`}
      >
        {ready ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        )}
        <div>
          <p className="font-bold text-slate-900 capitalize">Runtime: {health?.status ?? 'unknown'}</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Checked {health?.checkedAt ? new Date(health.checkedAt).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Go-live gates</h2>
          </div>
          <span className={`text-xs font-bold uppercase ${goLive?.ready ? 'text-emerald-700' : 'text-amber-700'}`}>
            {goLive?.ready ? 'Ready' : 'Open'}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {(goLive?.gates ?? []).map((gate) => (
            <div key={gate.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{gate.label}</p>
                  <p className="text-xs text-slate-600 mt-1">{gate.detail}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{gate.action}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                    gate.status === 'pass'
                      ? 'bg-emerald-50 text-emerald-700'
                      : gate.status === 'warn'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {gate.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        {goLive?.commands && (
          <div className="px-5 py-3 bg-slate-50 text-[11px] text-slate-500 font-mono space-y-1">
            {Object.entries(goLive.commands).map(([key, command]) => (
              <p key={key}>{command}</p>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(checks).map(([name, ok]) => (
          <div key={name} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{name}</p>
              {ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
            </div>
            <p className="mt-2 text-lg font-extrabold text-slate-900">{ok ? 'Healthy' : 'Degraded'}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" /> Queue
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Pending: <strong>{health?.queue.pending ?? 0}</strong>
          </p>
          <p className="text-sm text-slate-700">
            Failed: <strong>{health?.queue.failed ?? 0}</strong>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Runtime
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {Object.entries(health?.runtime ?? {}).map(([key, value]) => (
              <li key={key}>
                <span className="font-semibold text-slate-800">{key}:</span> {String(value)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 flex gap-2">
        <Database className="w-4 h-4 shrink-0 mt-0.5" />
        Follow docs/GO_LIVE_OPS_RUNBOOK.md on the target host to close open gates.
      </div>
      <p className="text-[11px] text-slate-400 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Health: `/platform/system-health` · Gates: `/platform/go-live`
      </p>
    </div>
  );
};
