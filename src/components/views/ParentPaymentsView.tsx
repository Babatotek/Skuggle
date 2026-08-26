import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Building,
  ShieldCheck,
  Smartphone,
  Check,
  X,
  Sparkles,
  ArrowUpRight,
  Filter,
  FileText,
  Copy
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface ParentPaymentsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface FeeItem {
  id: string;
  category: string;
  amount: number;
  description: string;
  status: 'Paid' | 'Outstanding';
}

interface ChildInvoice {
  childId: string;
  childName: string;
  classArm: string;
  totalBill: number;
  amountPaid: number;
  balanceDue: number;
  status: 'Fully Paid' | 'Partial' | 'Pending';
  dueDate: string;
  items: FeeItem[];
}

interface PaymentTransaction {
  id: string;
  receiptNo: string;
  childName: string;
  amount: number;
  paymentMethod: string;
  channel: 'Paystack Card' | 'Bank Transfer' | 'POS' | 'USSD';
  paidAt: string;
  status: 'Confirmed' | 'Pending Verification';
  term: string;
}

const INVOICES_DATA: ChildInvoice[] = [
  {
    childId: 'child_1',
    childName: 'Nathan Bello',
    classArm: 'JSS 2A',
    totalBill: 495000,
    amountPaid: 450000,
    balanceDue: 45000,
    status: 'Partial',
    dueDate: '31 Oct 2026',
    items: [
      { id: 'f_1', category: 'Tuition & Academic Instruction', amount: 280000, description: 'Core secondary curriculum & exams', status: 'Paid' },
      { id: 'f_2', category: 'STEM & Robotics Lab Levy', amount: 45000, description: 'Hands-on hardware & robotics kit', status: 'Paid' },
      { id: 'f_3', category: 'Bus Transport Shuttle (Route 4)', amount: 65000, description: 'Lekki Phase 1 round-trip transit', status: 'Paid' },
      { id: 'f_4', category: 'Cafeteria Hot Lunch Plan', amount: 50000, description: 'Nutritious daily lunch & juice', status: 'Paid' },
      { id: 'f_5', category: 'PTA & Infrastructure Levy', amount: 10000, description: 'Parent-Teacher Association fund', status: 'Paid' },
      { id: 'f_6', category: 'Cambridge Checkpoint Prep Fee', amount: 45000, description: 'International mock assessment', status: 'Outstanding' }
    ]
  },
  {
    childId: 'child_2',
    childName: 'Chidera Bello',
    classArm: 'Primary 4B',
    totalBill: 425000,
    amountPaid: 425000,
    balanceDue: 0,
    status: 'Fully Paid',
    dueDate: '15 Oct 2026',
    items: [
      { id: 'f_7', category: 'Tuition & Instruction', amount: 240000, description: 'Primary section tuition & continuous assessment', status: 'Paid' },
      { id: 'f_8', category: 'Textbooks & Learning Workbook Pack', amount: 60000, description: 'Complete curriculum workbook set', status: 'Paid' },
      { id: 'f_9', category: 'Bus Transport Shuttle (Route 4)', amount: 65000, description: 'Lekki Phase 1 round-trip transit', status: 'Paid' },
      { id: 'f_10', category: 'Cafeteria Hot Lunch Plan', amount: 50000, description: 'Nutritious daily lunch', status: 'Paid' },
      { id: 'f_11', category: 'PTA Levy', amount: 10000, description: 'PTA annual development fund', status: 'Paid' }
    ]
  },
  {
    childId: 'child_3',
    childName: 'Somto Bello',
    classArm: 'Nursery 2A',
    totalBill: 360000,
    amountPaid: 345000,
    balanceDue: 15000,
    status: 'Partial',
    dueDate: '31 Oct 2026',
    items: [
      { id: 'f_12', category: 'Early Childhood Tuition & Montessori Care', amount: 210000, description: 'Nursery instruction & care', status: 'Paid' },
      { id: 'f_13', category: 'Art, Craft & Sensory Play Pack', amount: 35000, description: 'Clay, paints & early developmental materials', status: 'Paid' },
      { id: 'f_14', category: 'Bus Transport Shuttle (Route 4)', amount: 65000, description: 'Lekki Phase 1 round-trip transit', status: 'Paid' },
      { id: 'f_15', category: 'Cafeteria Meal & Morning Snack', amount: 35000, description: 'Nursery fruit snack & lunch', status: 'Paid' },
      { id: 'f_16', category: 'Nursery Graduation & Costume Deposit', amount: 15000, description: 'End of year staging costume', status: 'Outstanding' }
    ]
  }
];

const TRANSACTIONS_HISTORY: PaymentTransaction[] = [
  {
    id: 'tx_1',
    receiptNo: 'RCP-2026-8910',
    childName: 'Nathan Bello',
    amount: 450000,
    paymentMethod: 'Mastercard •••• 4092',
    channel: 'Paystack Card',
    paidAt: '12 Sep 2026, 11:24 AM',
    status: 'Confirmed',
    term: 'First Term 2026/2027'
  },
  {
    id: 'tx_2',
    receiptNo: 'RCP-2026-8911',
    childName: 'Chidera Bello',
    amount: 425000,
    paymentMethod: 'Direct Bank Transfer',
    channel: 'Bank Transfer',
    paidAt: '12 Sep 2026, 11:30 AM',
    status: 'Confirmed',
    term: 'First Term 2026/2027'
  },
  {
    id: 'tx_3',
    receiptNo: 'RCP-2026-8912',
    childName: 'Somto Bello',
    amount: 345000,
    paymentMethod: 'Visa •••• 1184',
    channel: 'Paystack Card',
    paidAt: '14 Sep 2026, 02:15 PM',
    status: 'Confirmed',
    term: 'First Term 2026/2027'
  }
];

export const ParentPaymentsView: React.FC<ParentPaymentsViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'history' | 'installments' | 'bank_info'>('invoices');
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  const totalBilled = INVOICES_DATA.reduce((acc, curr) => acc + curr.totalBill, 0);
  const totalPaid = INVOICES_DATA.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalOutstanding = INVOICES_DATA.reduce((acc, curr) => acc + curr.balanceDue, 0);

  const filteredInvoices = selectedChildId === 'all'
    ? INVOICES_DATA
    : INVOICES_DATA.filter(inv => inv.childId === selectedChildId);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    feedbackBus.info(`Account number ${text} copied to clipboard!`);
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Payments & Fees</h1>
          <p className="text-sm text-slate-500 mt-1">Fee invoices, payment history, and installment plans for your children will appear here once the school configures fees and generates invoices.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No invoices yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Your school needs to configure fee heads and generate invoices before they appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] uppercase tracking-wide">
              Bursary & School Fees Ledger
            </span>
            <span className="text-xs text-slate-400 font-medium">Bursary Clearance: 95.3% Cleared</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Family Fee Accounts & Online Payment Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pay term fees via instant online card/transfer, retrieve official bursary receipts, and manage installment schedules.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenModal('make_payment')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Outstanding Fees (₦{totalOutstanding.toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* 4 Executive Financial Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Invoiced */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Total Term Invoices (3 Wards)</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">₦{totalBilled.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              First Term 2026/2027 Academic Session
            </p>
          </div>
        </div>

        {/* Card 2: Total Paid */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Total Settled & Reconciled</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">₦{totalPaid.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              95.3% Total Family Clearance Rate
            </p>
          </div>
        </div>

        {/* Card 3: Outstanding Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Current Outstanding Balance</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">₦{totalOutstanding.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Due before mid-term break (31 Oct)
            </p>
          </div>
        </div>

        {/* Card 4: Exam Clearance Pass */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Bursary Clearance Cards</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">3 / 3 Cleared</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Eligible for Terminal Exams
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'invoices'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Current Term Invoices & Breakdown</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Payment History & Receipts ({TRANSACTIONS_HISTORY.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('installments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'installments'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Installment Milestones & Schedules</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bank_info')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'bank_info'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Official School Bank Accounts</span>
        </button>
      </div>

      {/* SUB-TAB 1: INVOICES & ITEMIZED BREAKDOWN */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          
          {/* Ward Filter Pills */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-400 font-medium">Filter Ward:</span>
            <button
              onClick={() => setSelectedChildId('all')}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                selectedChildId === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Wards (3)
            </button>
            {INVOICES_DATA.map((inv) => (
              <button
                key={inv.childId}
                onClick={() => setSelectedChildId(inv.childId)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  selectedChildId === inv.childId
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {inv.childName} ({inv.classArm})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.childId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{inv.childName}</h3>
                      <p className="text-xs text-indigo-600 font-semibold">{inv.classArm} • First Term Invoice</p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                      inv.status === 'Fully Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="py-3 space-y-2 text-xs">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Itemized Fee Components</p>
                    {inv.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                        <div>
                          <p className="font-semibold text-slate-800">{item.category}</p>
                          <p className="text-[10.5px] text-slate-400">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 font-mono">₦{item.amount.toLocaleString()}</p>
                          <span className={`text-[10px] font-bold ${item.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Total Bill:</span>
                    <span className="font-bold text-slate-900 font-mono">₦{inv.totalBill.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Amount Settled:</span>
                    <span className="font-bold text-emerald-600 font-mono">₦{inv.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-extrabold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-800">Balance Due:</span>
                    <span className={`font-mono ${inv.balanceDue > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                      ₦{inv.balanceDue.toLocaleString()}
                    </span>
                  </div>

                  {inv.balanceDue > 0 ? (
                    <button
                      onClick={() => onOpenModal('make_payment', inv)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 transition-all cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Balance (₦{inv.balanceDue.toLocaleString()})</span>
                    </button>
                  ) : (
                    <div className="py-2 bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fully Settled & Cleared</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PAYMENT HISTORY & RECEIPTS */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Bursary Receipts & Transaction History</h3>
              <p className="text-xs text-slate-500">Every transaction generates an instant digital tax-compliant school receipt.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Receipt Number</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3">Payment Channel</th>
                  <th className="py-3 px-3">Date & Timestamp</th>
                  <th className="py-3 px-3 text-center">Bursary Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {TRANSACTIONS_HISTORY.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold font-mono text-indigo-700">
                      {tx.receiptNo}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900">
                      {tx.childName}
                    </td>

                    <td className="py-3 px-3 font-extrabold text-slate-900 font-mono">
                      ₦{tx.amount.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div className="font-semibold">{tx.channel}</div>
                      <div className="text-[10px] text-slate-400">{tx.paymentMethod}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      {tx.paidAt}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                        {tx.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          feedbackBus.success(`Official PDF Receipt for ${tx.receiptNo} downloaded!`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INSTALLMENT MILESTONES */}
      {activeSubTab === 'installments' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4 max-w-3xl mx-auto">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Termly 60/40 Installment Payment Policy</h3>
            <p className="text-xs text-slate-500">Royal Gateway Academy allows parents to split tuition across 2 scheduled milestones.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-sm">Milestone 1: 60% Resumption Deposit</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">
                  Completed on 14 Sep 2026
                </span>
              </div>
              <p className="text-emerald-800">
                Minimum 60% fee payment required before student class admission and textbooks issuance.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-sm">Milestone 2: 40% Final Settlement</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10.5px]">
                  Due: 31 October 2026
                </span>
              </div>
              <p className="text-amber-800">
                Remaining 40% balance (₦60,000 across Nathan and Somto) must be settled before mid-term examinations to issue clearance cards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: BANK ACCOUNT INFO */}
      {activeSubTab === 'bank_info' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4 max-w-3xl mx-auto">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Direct Bank Deposit & Wire Transfer Details</h3>
            <p className="text-xs text-slate-500">When making electronic wire transfers or branch deposits, use the student Admission Number in payment narration.</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Bank Name</p>
                <p className="font-bold text-slate-900 text-sm">Zenith Bank Plc</p>
                <p className="text-xs text-slate-600 mt-1">Account Name: <strong>Royal Gateway Academy Limited</strong></p>
                <p className="font-mono font-extrabold text-indigo-600 text-base mt-0.5">1014928374</p>
              </div>
              <button
                onClick={() => handleCopyAccount('1014928374')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Account</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Bank Name</p>
                <p className="font-bold text-slate-900 text-sm">Guaranty Trust Bank (GTBank)</p>
                <p className="text-xs text-slate-600 mt-1">Account Name: <strong>Royal Gateway Academy Limited</strong></p>
                <p className="font-mono font-extrabold text-indigo-600 text-base mt-0.5">0129482019</p>
              </div>
              <button
                onClick={() => handleCopyAccount('0129482019')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Account</span>
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important Narration Rule:</strong> Please enter <code>RGA/2024/0412 (Nathan Bello)</code> as the bank transfer description to ensure automated bursary reconciliation within 10 minutes.
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
