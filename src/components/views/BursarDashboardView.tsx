import React from 'react';
import {
  DollarSign,
  Receipt,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Wallet,
} from 'lucide-react';

interface BursarDashboardViewProps {
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigateTab: (tab: string) => void;
}

export const BursarDashboardView: React.FC<BursarDashboardViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Bursary workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-7 h-7 text-emerald-600" /> Fee collections & settlements
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Dedicated finance tools for fee ledgers, receipts, reminders, and reconciliation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Collected today', value: '₦—', icon: DollarSign },
          { label: 'Outstanding', value: '₦—', icon: AlertTriangle },
          { label: 'Receipts issued', value: '—', icon: Receipt },
          { label: 'Pending settlements', value: '—', icon: CreditCard },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{card.label}</p>
              <card.icon className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { id: 'payments', title: 'Fee ledger', detail: 'Review payment transactions and statuses.' },
          { id: 'receipts', title: 'Receipts', detail: 'Issue and retrieve official bursary receipts.' },
          { id: 'reminders', title: 'Fee reminders', detail: 'Chase outstanding balances by class or family.' },
          { id: 'reconciliation', title: 'Gateway reconciliation', detail: 'Match Paystack / bank transfers to student fees.' },
          { id: 'reports', title: 'Finance reports', detail: 'Collections, arrears, and term summaries.' },
          { id: 'settings', title: 'Fee structures', detail: 'Confirm fee items with school admin settings.' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id === 'payments' || item.id === 'receipts' || item.id === 'reminders' || item.id === 'reconciliation') {
                onNavigateTab('payments');
                return;
              }
              if (item.id === 'reports') {
                onNavigateTab('reports');
                return;
              }
              if (item.id === 'settings') {
                onOpenModal('fee_structure');
                onNavigateTab('settings');
              }
            }}
            className="rounded-2xl border border-slate-100 bg-white p-5 text-left hover:border-emerald-200 hover:bg-emerald-50/40 transition"
          >
            <p className="text-sm font-bold text-slate-900 flex items-center justify-between gap-2">
              {item.title}
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-5">{item.detail}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
