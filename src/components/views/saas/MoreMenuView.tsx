import React, { useEffect, useMemo, useState } from 'react';
import {
  MoreHorizontal,
  Shield,
  Megaphone,
  Key,
  Database,
  Search,
  Download,
  Send,
  RefreshCw,
} from 'lucide-react';
import { TenantBrandingSettings } from '../TenantBrandingSettings';
import {
  createPlatformBackup,
  createPlatformBroadcast,
  fetchPlatformApiCredentials,
  fetchPlatformAudit,
  fetchPlatformBackups,
  fetchPlatformBroadcasts,
  rotatePlatformApiCredential,
} from '@/shared/api/platform';
import { getApiError } from '@/shared/api/client';
import { appConfig } from '@/app/config';
import { feedbackBus } from '@/shared/feedback/feedbackBus';
import { PageSkeleton } from '@/shared/ui';

interface MoreMenuViewProps {
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigateTab: (tab: string) => void;
}

type AuditRow = {
  id: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  requestId?: string | null;
  occurredAt?: string | null;
};

export const MoreMenuView: React.FC<MoreMenuViewProps> = ({ onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'branding' | 'broadcasts' | 'apikeys' | 'backups'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [broadcasts, setBroadcasts] = useState<Array<Record<string, unknown>>>([]);
  const [backups, setBackups] = useState<Array<Record<string, unknown>>>([]);
  const [credentials, setCredentials] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all_schools');
  const [channel, setChannel] = useState('all');

  const reloadOps = async () => {
    const [audit, broadcastResult, backupResult, credentialResult] = await Promise.all([
      fetchPlatformAudit(),
      fetchPlatformBroadcasts(),
      fetchPlatformBackups(),
      fetchPlatformApiCredentials(),
    ]);
    setAuditLogs(
      (audit.data ?? []).map((row) => ({
        id: String(row.id),
        action: String(row.action ?? 'event'),
        resourceType: row.resourceType ? String(row.resourceType) : null,
        resourceId: row.resourceId ? String(row.resourceId) : null,
        requestId: row.requestId ? String(row.requestId) : null,
        occurredAt: row.occurredAt ? String(row.occurredAt) : null,
      })),
    );
    setBroadcasts(broadcastResult.data ?? []);
    setBackups(backupResult.data ?? []);
    setCredentials(credentialResult.data ?? []);
  };

  useEffect(() => {
    if (!appConfig.liveApi) {
      setError('Live API disabled.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        await reloadOps();
      } catch (caught) {
        setError(getApiError(caught).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredAudit = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        (log.resourceType ?? '').toLowerCase().includes(q) ||
        (log.resourceId ?? '').toLowerCase().includes(q),
    );
  }, [auditLogs, searchTerm]);

  const publishBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await createPlatformBroadcast({
        title: title.trim(),
        body: body.trim(),
        audience,
        channel,
        publish: true,
      });
      setTitle('');
      setBody('');
      feedbackBus.success('Broadcast published to school network');
      await reloadOps();
    } catch (caught) {
      feedbackBus.error(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const runBackup = async () => {
    setBusy(true);
    try {
      await createPlatformBackup();
      feedbackBus.success('Backup snapshot recorded');
      await reloadOps();
    } catch (caught) {
      feedbackBus.error(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const rotateCredential = async (id: string) => {
    setBusy(true);
    try {
      const result = await rotatePlatformApiCredential(id);
      feedbackBus.success(result.message);
      await reloadOps();
    } catch (caught) {
      feedbackBus.error(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { id: 'audit' as const, label: 'Audit trail', icon: Shield },
    { id: 'branding' as const, label: 'Branding', icon: MoreHorizontal },
    { id: 'broadcasts' as const, label: 'Broadcasts', icon: Megaphone },
    { id: 'apikeys' as const, label: 'API credentials', icon: Key },
    { id: 'backups' as const, label: 'Backups', icon: Database },
  ];

  if (loading) return <PageSkeleton label="Loading platform operations…" />;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <button type="button" onClick={() => onNavigateTab('overview')} className="text-xs font-semibold text-indigo-600 hover:underline">
          Super Admin HQ
        </button>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Platform operations centre</h1>
        <p className="text-sm text-slate-500 mt-1">
          Audit, network broadcasts, credential rotation metadata, and backup snapshots.
        </p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border ${
              activeSubTab === tab.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filter audit events…" className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <button
              type="button"
              onClick={() => {
                const headers = 'Occurred At,Action,Resource Type,Resource Id,Request Id\n';
                const bodyCsv = filteredAudit
                  .map((log) => `"${log.occurredAt ?? ''}","${log.action}","${log.resourceType ?? ''}","${log.resourceId ?? ''}","${log.requestId ?? ''}"`)
                  .join('\n');
                const blob = new Blob([headers + bodyCsv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `skuggle-audit-${new Date().toISOString().slice(0, 10)}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudit.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{log.occurredAt ? new Date(log.occurredAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600">{[log.resourceType, log.resourceId].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{log.requestId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'branding' && <TenantBrandingSettings />}

      {activeSubTab === 'broadcasts' && (
        <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
          <form onSubmit={(e) => void publishBroadcast(e)} className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Publish network broadcast</h2>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body" rows={6} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required />
            <div className="grid grid-cols-2 gap-2">
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="all_schools">All schools</option>
                <option value="school_admins">School admins</option>
                <option value="teachers">Teachers</option>
                <option value="trial_accounts">Trial accounts</option>
              </select>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="all">All channels</option>
                <option value="in_app">In-app</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              <Send className="w-3.5 h-3.5" /> Publish broadcast
            </button>
          </form>
          <div className="rounded-2xl border border-slate-100 bg-white divide-y divide-slate-100 overflow-hidden">
            {broadcasts.length === 0 && <p className="p-6 text-sm text-slate-500">No broadcasts yet.</p>}
            {broadcasts.map((item) => (
              <div key={String(item.id)} className="p-4">
                <p className="text-sm font-bold text-slate-900">{String(item.title)}</p>
                <p className="text-xs text-slate-500 mt-1">{String(item.summary ?? '')}</p>
                <p className="text-[11px] text-slate-400 mt-2 capitalize">
                  {String(item.status)} · {String(item.audience)} · {Number(item.recipientCount ?? 0)} recipients
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'apikeys' && (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-xs text-slate-500">
            Only metadata and rotation fingerprints are stored. Real secrets remain in server environment variables.
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Hint</th>
                <th className="px-4 py-3">Rotated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {credentials.map((item) => (
                <tr key={String(item.id)}>
                  <td className="px-4 py-3 font-semibold">{String(item.name)}</td>
                  <td className="px-4 py-3 capitalize">{String(item.provider)} · {String(item.environment)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{String(item.keyHint)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {item.lastRotatedAt ? new Date(String(item.lastRotatedAt)).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" disabled={busy} onClick={() => void rotateCredential(String(item.id))} className="text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Rotate metadata
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'backups' && (
        <div className="space-y-4">
          <button type="button" disabled={busy} onClick={() => void runBackup()} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
            <Database className="w-3.5 h-3.5" /> Create snapshot
          </button>
          <div className="rounded-2xl border border-slate-100 bg-white divide-y divide-slate-100">
            {backups.length === 0 && <p className="p-6 text-sm text-slate-500">No snapshots yet.</p>}
            {backups.map((item) => (
              <div key={String(item.id)} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{String(item.label)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">
                    {String(item.status)} · {String(item.trigger)}
                    {item.completedAt ? ` · ${new Date(String(item.completedAt)).toLocaleString()}` : ''}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {item.sizeBytes ? `${Math.round(Number(item.sizeBytes) / (1024 * 1024))} MB` : 'Size pending'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
