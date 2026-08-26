import React, { useEffect, useMemo, useState } from 'react';
import {
  LifeBuoy,
  Search,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import {
  fetchPlatformTicket,
  fetchPlatformTickets,
  replyPlatformTicket,
  resolvePlatformTicket,
} from '@/shared/api/platform';
import { getApiError } from '@/shared/api/client';
import { appConfig } from '@/app/config';
import { feedbackBus } from '@/shared/feedback/feedbackBus';
import { PageSkeleton } from '@/shared/ui';

interface SupportViewProps {
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigateTab: (tab: string) => void;
}

type Ticket = {
  id: string;
  ticketNumber: string;
  schoolName: string;
  requesterName: string;
  requesterRole: string;
  requesterEmail: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assignedAgent?: string;
  slaMinutesRemaining: number;
  updatedAt?: string;
  messages?: Array<{
    id: string;
    sender: string;
    senderType: string;
    content: string;
    timestamp?: string;
  }>;
};

const statusLabel = (status: string) => status.replaceAll('_', ' ');

export const SupportView: React.FC<SupportViewProps> = ({ onNavigateTab }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState({ open: 0, urgent: 0, resolved: 0, avgSlaMinutes: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadTickets = async () => {
    const result = await fetchPlatformTickets({
      search: searchTerm || undefined,
      status: statusFilter === 'All' ? undefined : statusFilter,
    });
    setSummary({
      open: Number(result.summary?.open ?? 0),
      urgent: Number(result.summary?.urgent ?? 0),
      resolved: Number(result.summary?.resolved ?? 0),
      avgSlaMinutes: Number(result.summary?.avgSlaMinutes ?? 0),
    });
    const rows = (result.data ?? []).map((row) => row as unknown as Ticket);
    setTickets(rows);
    if (!selectedId && rows[0]) {
      setSelectedId(rows[0].id);
    }
  };

  useEffect(() => {
    if (!appConfig.liveApi) {
      setError('Live API disabled.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        await loadTickets();
      } catch (caught) {
        setError(getApiError(caught).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (!selectedId || !appConfig.liveApi) return;
    void (async () => {
      try {
        const result = await fetchPlatformTicket(selectedId);
        setSelected(result.ticket as unknown as Ticket);
      } catch (caught) {
        feedbackBus.error(getApiError(caught).message);
      }
    })();
  }, [selectedId]);

  const filtered = useMemo(() => tickets, [tickets]);

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !replyText.trim()) return;
    setBusy(true);
    try {
      const result = await replyPlatformTicket(selected.id, replyText.trim(), 'waiting_on_school');
      setSelected(result.ticket as unknown as Ticket);
      setReplyText('');
      await loadTickets();
      feedbackBus.success('Reply sent to school contact');
    } catch (caught) {
      feedbackBus.error(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const resolve = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await resolvePlatformTicket(selected.id);
      setSelected(result.ticket as unknown as Ticket);
      await loadTickets();
      feedbackBus.success(`Ticket ${selected.ticketNumber} resolved`);
    } catch (caught) {
      feedbackBus.error(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageSkeleton label="Loading support desk…" />;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <button type="button" onClick={() => onNavigateTab('overview')} className="text-xs font-semibold text-indigo-600 hover:underline">
          Super Admin HQ
        </button>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 flex items-center gap-2">
          <LifeBuoy className="w-7 h-7 text-indigo-600" />
          Enterprise support desk
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Live tickets, SLA timers, and agent replies across school tenants.
        </p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Open queue</p><p className="text-2xl font-extrabold mt-1">{summary.open}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Urgent</p><p className="text-2xl font-extrabold mt-1 text-rose-600">{summary.urgent}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Resolved</p><p className="text-2xl font-extrabold mt-1">{summary.resolved}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Avg SLA left</p><p className="text-2xl font-extrabold mt-1">{summary.avgSlaMinutes}m</p></div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-4 min-h-[520px]">
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search tickets…" className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="All">All statuses</option>
              <option value="open">open</option>
              <option value="in_progress">in_progress</option>
              <option value="waiting_on_school">waiting_on_school</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 && <p className="p-6 text-sm text-slate-500 text-center">No tickets found.</p>}
            {filtered.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${selectedId === ticket.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-slate-400">{ticket.ticketNumber}</p>
                  <span className="text-[10px] font-bold uppercase text-slate-500">{ticket.priority}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{ticket.subject}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ticket.schoolName}</p>
                <p className="text-[11px] text-slate-400 mt-1 capitalize">{statusLabel(ticket.status)} · SLA {ticket.slaMinutesRemaining}m</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 grid place-items-center text-sm text-slate-500 p-8">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
              Select a ticket to manage the conversation.
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400">{selected.ticketNumber}</p>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{selected.subject}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {selected.schoolName} · {selected.requesterName} ({selected.requesterRole}) · {selected.requesterEmail}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    {selected.category} · {statusLabel(selected.status)} · Agent: {selected.assignedAgent ?? 'Unassigned'}
                  </p>
                </div>
                {selected.status !== 'resolved' && selected.status !== 'closed' && (
                  <button type="button" disabled={busy} onClick={() => void resolve()} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/60">
                {(selected.messages ?? []).map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.senderType === 'support_agent'
                        ? 'ml-auto bg-indigo-600 text-white'
                        : message.senderType === 'system'
                          ? 'mx-auto bg-slate-200 text-slate-700'
                          : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="text-[11px] font-bold opacity-80 mb-1">{message.sender}</p>
                    <p className="whitespace-pre-wrap leading-6">{message.content}</p>
                    <p className="text-[10px] opacity-70 mt-2">
                      {message.timestamp ? new Date(message.timestamp).toLocaleString() : ''}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={(e) => void sendReply(e)} className="p-4 border-t border-slate-100 flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write an agent reply…"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <button type="submit" disabled={busy || !replyText.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 flex items-center gap-1">
        {summary.urgent > 0 ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <Clock className="w-3 h-3" />}
        SLA clocks are stored per ticket and updated as agents respond.
      </p>
    </div>
  );
};
