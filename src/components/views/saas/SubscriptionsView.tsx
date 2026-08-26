import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Search,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  fetchPlatformInvoices,
  generatePlatformInvoices,
  markPlatformInvoicePaid,
  remindPlatformInvoice,
} from '@/shared/api/platform';
import { getApiError } from '@/shared/api/client';
import { appConfig } from '@/app/config';
import { feedbackBus } from '@/shared/feedback/feedbackBus';
import { PageSkeleton } from '@/shared/ui';

interface SubscriptionsViewProps {
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigateTab: (tab: string) => void;
}

type Invoice = {
  id: string;
  invoiceNumber: string;
  schoolName?: string;
  schoolCode?: string;
  plan?: string;
  cycle: string;
  amountMinor: number;
  discountMinor: number;
  currency: string;
  status: string;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
  gateway: string;
  reference?: string | null;
};

const money = (minor: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(minor / 100);

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onNavigateTab }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState({ collectedMinor: 0, outstandingMinor: 0, invoiceCount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const result = await fetchPlatformInvoices({
      search: searchTerm || undefined,
      status: statusFilter === 'All' ? undefined : statusFilter,
    });
    setSummary({
      collectedMinor: Number(result.summary?.collectedMinor ?? 0),
      outstandingMinor: Number(result.summary?.outstandingMinor ?? 0),
      invoiceCount: Number(result.summary?.invoiceCount ?? 0),
    });
    setInvoices((result.data ?? []) as unknown as Invoice[]);
  };

  useEffect(() => {
    if (!appConfig.liveApi) {
      setError('Live API disabled.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        await load();
      } catch (caught) {
        setError(getApiError(caught).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const rows = useMemo(() => invoices, [invoices]);

  const generate = async () => {
    setBusy(true);
    try {
      const result = await generatePlatformInvoices();
      feedbackBus.success(`Generated ${result.created} invoice(s) for the current period`);
      await load();
    } catch (caught) {
      feedbackBus.error(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async (id: string) => {
    setBusy(true);
    try {
      await markPlatformInvoicePaid(id);
      feedbackBus.success('Invoice marked as paid');
      await load();
    } catch (caught) {
      feedbackBus.error(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const remind = async (id: string) => {
    setBusy(true);
    try {
      const result = await remindPlatformInvoice(id);
      feedbackBus.success(result.message);
      await load();
    } catch (caught) {
      feedbackBus.error(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageSkeleton label="Loading billing ledger…" />;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <button type="button" onClick={() => onNavigateTab('overview')} className="text-xs font-semibold text-indigo-600 hover:underline">
            Super Admin HQ
          </button>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            SaaS billing ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Invoice generation, collections, reminders, and settlement status across school tenants.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Generate period invoices
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-500">Collected</p>
          <p className="text-2xl font-extrabold mt-1">{money(summary.collectedMinor)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className="text-2xl font-extrabold mt-1 text-amber-700">{money(summary.outstandingMinor)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-500">Invoices</p>
          <p className="text-2xl font-extrabold mt-1">{summary.invoiceCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search invoice, school, reference…" className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
          <option value="All">All statuses</option>
          <option value="paid">paid</option>
          <option value="pending">pending</option>
          <option value="overdue">overdue</option>
          <option value="canceled">canceled</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No invoices yet. Generate the current period to create ledger entries from live subscriptions.
                </td>
              </tr>
            )}
            {rows.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-400">{invoice.reference ?? invoice.gateway}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="font-medium">{invoice.schoolName}</p>
                      <p className="text-xs text-slate-500">{invoice.schoolCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p>{invoice.plan}</p>
                  <p className="text-xs text-slate-500 capitalize">{invoice.cycle}</p>
                </td>
                <td className="px-4 py-3 font-semibold">{money(invoice.amountMinor - invoice.discountMinor, invoice.currency)}</td>
                <td className="px-4 py-3 capitalize">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">
                    {invoice.status === 'paid' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : invoice.status === 'overdue' ? <AlertTriangle className="w-3 h-3 text-amber-600" /> : <Clock className="w-3 h-3" />}
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{invoice.dueDate ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
                      <>
                        <button type="button" disabled={busy} onClick={() => void markPaid(invoice.id)} className="text-xs font-bold text-emerald-700 hover:underline">
                          Mark paid
                        </button>
                        <button type="button" disabled={busy} onClick={() => void remind(invoice.id)} className="text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1">
                          <Send className="w-3 h-3" /> Remind
                        </button>
                      </>
                    )}
                    {invoice.status === 'paid' && <span className="text-xs text-slate-400">Settled {invoice.paidDate}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
