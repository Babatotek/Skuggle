import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  ChevronDown,
  Layers,
  Send,
  Building,
  ShieldCheck,
  FileText,
  PieChart as PieChartIcon,
  Check,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface PrincipalFinanceViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface RequisitionItem {
  id: string;
  department: string;
  requestedBy: string;
  item: string;
  amount: number;
  date: string;
  priority: 'High' | 'Medium' | 'Routine';
  status: 'Pending Principal Approval' | 'Approved' | 'Declined';
}

const REQUISITION_DATA: RequisitionItem[] = [
  {
    id: 'req_101',
    department: 'Science & Laboratories',
    requestedBy: 'Mrs. Folashade Adeleke',
    item: 'WAEC Chemistry & Physics Practical Reagents & Glassware',
    amount: 450000,
    date: '18 Oct 2026',
    priority: 'High',
    status: 'Pending Principal Approval'
  },
  {
    id: 'req_102',
    department: 'Facilities & Logistics',
    requestedBy: 'Mr. Jude Alabi (Estate Mgr)',
    item: '2,500L Diesel Generator Fuel & Bi-Weekly Servicing',
    amount: 1250000,
    date: '17 Oct 2026',
    priority: 'High',
    status: 'Pending Principal Approval'
  },
  {
    id: 'req_103',
    department: 'ICT & Innovation Lab',
    requestedBy: 'Engr. Aliyu Ibrahim',
    item: 'Fiber-Optic High-Speed Bandwidth & OMR Cloud Licenses',
    amount: 280000,
    date: '16 Oct 2026',
    priority: 'Medium',
    status: 'Pending Principal Approval'
  },
  {
    id: 'req_104',
    department: 'Sports & Co-Curricular',
    requestedBy: 'Mr. Emmanuel Danjuma',
    item: 'Inter-House Sports Trophies, Medals & Track Kits',
    amount: 320000,
    date: '15 Oct 2026',
    priority: 'Medium',
    status: 'Pending Principal Approval'
  }
];

const CLASS_FEE_COLLECTION = [
  { classArm: 'JSS 1 (A-D)', totalInvoiced: 31200000, collected: 27800000, outstanding: 3400000, rate: 89.1 },
  { classArm: 'JSS 2 (A-D)', totalInvoiced: 29800000, collected: 26100000, outstanding: 3700000, rate: 87.5 },
  { classArm: 'JSS 3 (BECE)', totalInvoiced: 32500000, collected: 29900000, outstanding: 2600000, rate: 92.0 },
  { classArm: 'SSS 1 (A-D)', totalInvoiced: 30100000, collected: 24800000, outstanding: 5300000, rate: 82.3 },
  { classArm: 'SSS 2 (A-D)', totalInvoiced: 28900000, collected: 23900000, outstanding: 5000000, rate: 82.6 },
  { classArm: 'SSS 3 (WAEC Cohort)', totalInvoiced: 31700000, collected: 30300000, outstanding: 1400000, rate: 95.5 }
];

const REVENUE_STREAM_PIE = [
  { name: 'Tuition Fees', value: 124000000, color: '#6366F1' },
  { name: 'Boarding & Hostel', value: 34500000, color: '#10B981' },
  { name: 'STEM & Robotics Lab', value: 12800000, color: '#F59E0B' },
  { name: 'Transportation & Bus', value: 8200000, color: '#3B82F6' },
  { name: 'Uniforms & Stationery', value: 4700000, color: '#EC4899' }
];

export const PrincipalFinanceView: React.FC<PrincipalFinanceViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'collection' | 'requisitions' | 'streams' | 'payroll'>('collection');
  const [selectedTerm, setSelectedTerm] = useState('First Term, 2026/2027');
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>(REQUISITION_DATA);

  const handleApproveRequisition = (id: string, item: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
    );
    feedbackBus.success(`Requisition for "${item}" officially approved by Principal.`);
  };

  const handleDeclineRequisition = (id: string, item: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Declined' } : r))
    );
    feedbackBus.success(`Requisition for "${item}" returned for budget revision.`);
  };

  const handleSendDebtorReminders = () => {
    feedbackBus.success('Automated Fee Arrears SMS & Email reminders dispatched to parents of 94 outstanding accounts.');
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Finance Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Fee collection summaries, payroll data, and revenue analytics will populate once fee heads are configured and payments are recorded.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <DollarSign className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No financial records yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Configure fee heads in school setup and record student payments to see financial summaries here.</p>
        </div>
      </div>
    );
  }

  return (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] uppercase tracking-wide">
              Bursary & Fiscal Governance
            </span>
            <span className="text-xs text-slate-400 font-medium">{selectedTerm}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Executive Financial Governance & Tuition Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Institution revenue monitoring, debt recovery tracking, departmental expense approvals, and staff payroll audits.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSendDebtorReminders}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-200 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Fee Reminder SMS</span>
          </button>

          <button
            onClick={() => {
              const headers = 'ClassArm,TotalInvoiced,Collected,Outstanding,CollectionRate\n';
              const rows = CLASS_FEE_COLLECTION.map((c) => `"${c.classArm}",${c.totalInvoiced},${c.collected},${c.outstanding},${c.rate}%`).join('\n');
              const blob = new Blob([headers + rows], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Royal_Gateway_Finance_Summary_${selectedTerm.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* 6 Executive Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Invoiced Revenue */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Term Invoiced Fees</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">₦184.2M</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              1,248 student billings
            </p>
          </div>
        </div>

        {/* Card 2: Collected Revenue */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Collected to Date</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">₦156.8M</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>85.1% collection rate</span>
            </p>
          </div>
        </div>

        {/* Card 3: Outstanding Arrears */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Fee Arrears (Defaulters)</p>
            <p className="text-xl font-extrabold text-rose-600 mt-0.5">₦27.4M</p>
            <p className="text-[10.5px] text-rose-600 font-semibold mt-0.5">
              14.9% pending clearance
            </p>
          </div>
        </div>

        {/* Card 4: Operating Expenses */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Operating Expenses (Opex)</p>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">₦42.6M</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              Utilities, diesel & labs
            </p>
          </div>
        </div>

        {/* Card 5: Net Cash Surplus */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Net Cash Surplus</p>
            <p className="text-xl font-extrabold text-blue-600 mt-0.5">+₦114.2M</p>
            <p className="text-[10.5px] text-blue-600 font-semibold mt-0.5">
              Healthy reserve ratio
            </p>
          </div>
        </div>

        {/* Card 6: Requisitions Pending */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Pending Approvals</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">
              {requisitions.filter((r) => r.status === 'Pending Principal Approval').length}
            </p>
            <p className="text-[10.5px] text-purple-600 font-semibold mt-0.5">
              ₦2.3M awaiting sign-off
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          id="tab-principal-finance-collection"
          onClick={() => setActiveSubTab('collection')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'collection'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Fee Recovery & Class Ledger</span>
        </button>

        <button
          id="tab-principal-finance-requisitions"
          onClick={() => setActiveSubTab('requisitions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'requisitions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Departmental Requisition Approvals</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500 text-white">
            {requisitions.filter((r) => r.status === 'Pending Principal Approval').length}
          </span>
        </button>

        <button
          id="tab-principal-finance-streams"
          onClick={() => setActiveSubTab('streams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'streams'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PieChartIcon className="w-3.5 h-3.5" />
          <span>Revenue Streams & Invoicing Breakdown</span>
        </button>

        <button
          id="tab-principal-finance-payroll"
          onClick={() => setActiveSubTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'payroll'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Faculty & Staff Remuneration Ledger</span>
        </button>
      </div>

      {/* SUB-TAB 1: FEE RECOVERY & CLASS LEDGER */}
      {activeSubTab === 'collection' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Termly Tuition Fee Collection Status by Class Arm</h3>
              <p className="text-xs text-slate-500">Live reconciliation of bank transfers, online gateway payments, and cash deposits.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Class Cohort</th>
                  <th className="py-3 px-3">Total Invoiced</th>
                  <th className="py-3 px-3">Total Collected</th>
                  <th className="py-3 px-3">Outstanding Arrears</th>
                  <th className="py-3 px-3 text-center">Collection Rate</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {CLASS_FEE_COLLECTION.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                      {item.classArm}
                    </td>

                    <td className="py-3 px-3 text-slate-800 font-semibold">
                      ₦{(item.totalInvoiced / 1000000).toFixed(1)}M
                    </td>

                    <td className="py-3 px-3 text-emerald-600 font-bold">
                      ₦{(item.collected / 1000000).toFixed(1)}M
                    </td>

                    <td className="py-3 px-3 text-rose-600 font-bold">
                      ₦{(item.outstanding / 1000000).toFixed(1)}M
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.rate}%` }} />
                        </div>
                        <span className="font-extrabold text-[11px] text-slate-900">{item.rate}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          feedbackBus.success(`Dispatched fee reminder to defaulting parents in ${item.classArm}`);
                        }}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-xs transition-colors"
                      >
                        Notify Defaulters
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REQUISITION APPROVALS */}
      {activeSubTab === 'requisitions' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Departmental Procurement & Expense Requisitions</h3>
              <p className="text-xs text-slate-500">Expenditure requests exceeding ₦100,000 requiring Principal executive sign-off before Bursary disbursement.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requisitions.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10.5px] font-bold">
                        {req.department}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">{req.item}</h4>
                    </div>
                    <span className="text-base font-extrabold text-slate-900">
                      ₦{req.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                    <p>Requested by: <strong className="text-slate-700">{req.requestedBy}</strong></p>
                    <p>Date: {req.date} • Priority: <strong className={req.priority === 'High' ? 'text-rose-600' : 'text-amber-600'}>{req.priority}</strong></p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                    req.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : req.status === 'Declined'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    {req.status}
                  </span>

                  {req.status === 'Pending Principal Approval' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeclineRequisition(req.id, req.item)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                        title="Decline / Request Revision"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApproveRequisition(req.id, req.item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Sign</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: REVENUE STREAMS */}
      {activeSubTab === 'streams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Stream Composition</h3>
              <p className="text-xs text-slate-500">Distribution of term gross earnings (₦184.2M Total)</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_STREAM_PIE} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `₦${v / 1000000}M`} />
                  <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₦${(val / 1000000).toFixed(1)}M`, 'Amount']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Channel Breakdown</h3>
              <p className="text-xs text-slate-500">Payment method disbursement</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Online Gateway (Paystack/Flutterwave)</span>
                <strong className="text-slate-900">62% (₦97.2M)</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Direct NIBSS / Bank Transfer</span>
                <strong className="text-slate-900">28% (₦43.9M)</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">POS / Bursary Desk</span>
                <strong className="text-slate-900">10% (₦15.7M)</strong>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-medium">
              ✓ Automated daily reconciliation verified against Zenith & Access Bank corporate accounts.
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PAYROLL */}
      {activeSubTab === 'payroll' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty & Staff Monthly Payroll Schedule</h3>
              <p className="text-xs text-slate-500">78 Total Staff • Monthly Gross Remuneration: ₦24,850,000 • PAYE & Pension Remitted</p>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              ● October Payroll Disbursed on 25th
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-500">Academic Staff (58 Teachers)</span>
              <p className="text-lg font-extrabold text-slate-900">₦18,400,000</p>
              <p className="text-emerald-600 font-semibold">100% Disbursed</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-500">Non-Academic & Admin (20 Staff)</span>
              <p className="text-lg font-extrabold text-slate-900">₦6,450,000</p>
              <p className="text-emerald-600 font-semibold">100% Disbursed</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-500">Statutory Deductions (PAYE + PenCom)</span>
              <p className="text-lg font-extrabold text-slate-900">₦3,720,000</p>
              <p className="text-blue-600 font-semibold">Remitted to State IRS</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
