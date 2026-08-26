import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  HardDrive,
  Users,
  Cpu,
  Search,
} from 'lucide-react';
import { fetchPlatformUsage } from '@/shared/api/platform';
import { getApiError } from '@/shared/api/client';
import { appConfig } from '@/app/config';
import { PageSkeleton } from '@/shared/ui';

interface UsageViewProps {
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigateTab: (tab: string) => void;
}

type UsageTenant = {
  id: string;
  name: string;
  code: string;
  status: string;
  students: number;
  studentLimit: number;
  users: number;
  userLimit: number;
  storageBytes: number;
  storageLimit: number;
  aiRequestsToday: number;
  aiLimit: number;
};

const formatBytes = (bytes: number) => {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const UsageView: React.FC<UsageViewProps> = ({ onNavigateTab }) => {
  const [tenants, setTenants] = useState<UsageTenant[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!appConfig.liveApi) {
      setError('Live API disabled.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await fetchPlatformUsage();
        setSummary(data.summary ?? {});
        setTenants(
          (data.tenants ?? []).map((row) => ({
            id: String(row.id),
            name: String(row.name ?? 'Tenant'),
            code: String(row.code ?? ''),
            status: String(row.status ?? ''),
            students: Number(row.students ?? 0),
            studentLimit: Number(row.studentLimit ?? 0),
            users: Number(row.users ?? 0),
            userLimit: Number(row.userLimit ?? 0),
            storageBytes: Number(row.storageBytes ?? 0),
            storageLimit: Number(row.storageLimit ?? 0),
            aiRequestsToday: Number(row.aiRequestsToday ?? 0),
            aiLimit: Number(row.aiLimit ?? 0),
          })),
        );
      } catch (caught) {
        setError(getApiError(caught).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
    );
  }, [tenants, searchTerm]);

  if (loading) return <PageSkeleton label="Loading usage…" />;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
          Tenant usage
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Live quota usage across schools and individual workspaces.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Tenants</p>
          <p className="mt-1 text-2xl font-extrabold">{Number(summary.tenants ?? tenants.length).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Students</p>
          <p className="mt-1 text-2xl font-extrabold">{Number(summary.managedStudents ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> AI today</p>
          <p className="mt-1 text-2xl font-extrabold">{Number(summary.aiRequestsToday ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Active users</p>
          <p className="mt-1 text-2xl font-extrabold">{Number(summary.activeUsers ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter tenants…"
          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm"
        />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3">AI today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No usage rows found.
                </td>
              </tr>
            )}
            {filtered.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{tenant.name}</p>
                  <p className="text-xs text-slate-500">{tenant.code} · {tenant.status}</p>
                </td>
                <td className="px-4 py-3">
                  {tenant.students}
                  <span className="text-xs text-slate-400"> / {tenant.studentLimit || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  {tenant.users}
                  <span className="text-xs text-slate-400"> / {tenant.userLimit || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  {formatBytes(tenant.storageBytes)}
                  <span className="text-xs text-slate-400"> / {formatBytes(tenant.storageLimit)}</span>
                </td>
                <td className="px-4 py-3">
                  {tenant.aiRequestsToday}
                  <span className="text-xs text-slate-400"> / {tenant.aiLimit || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
