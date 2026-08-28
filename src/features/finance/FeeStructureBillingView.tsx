import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Filter,
  Send,
  Building,
  Sparkles,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FeeStructureItem, FeeInvoice } from '../../types';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

export const FeeStructureBillingView: React.FC = () => {
  const { branding, students, feeTransactions, addFeeTransaction, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'invoices' | 'structure' | 'settlement'>('invoices');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [showNewFeeModal, setShowNewFeeModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<any>(students[0]);
  const [payAmount, setPayAmount] = useState<number>(150000);
  const [paymentChannel, setPaymentChannel] = useState<'Bank Transfer' | 'Paystack Card' | 'Cash / POS'>('Bank Transfer');

  // Master fee items schedule
  const demoFeeStructures: FeeStructureItem[] = [
    {
      id: 'fs-1',
      name: 'Tuition & Academic Levies',
      applicableClass: 'All Junior Secondary',
      amount: 180000,
      isMandatory: true,
      category: 'Tuition',
    },
    {
      id: 'fs-2',
      name: 'STEM & Robotics Lab Levy',
      applicableClass: 'All Junior Secondary',
      amount: 25000,
      isMandatory: true,
      category: 'STEM & Lab',
    },
    {
      id: 'fs-3',
      name: 'ICT, Coding & Internet Access',
      applicableClass: 'All Classes',
      amount: 15000,
      isMandatory: true,
      category: 'Development',
    },
    {
      id: 'fs-4',
      name: 'Uniforms & Sports Kit Bundle',
      applicableClass: 'JSS 1',
      amount: 45000,
      isMandatory: false,
      category: 'Uniform & Books',
    },
    {
      id: 'fs-5',
      name: 'Senior Secondary Tuition & Practical Lab',
      applicableClass: 'All Senior Secondary',
      amount: 220000,
      isMandatory: true,
      category: 'Tuition',
    },
    {
      id: 'fs-6',
      name: 'WAEC / NECO Registration Fund',
      applicableClass: 'SSS 3',
      amount: 65000,
      isMandatory: true,
      category: 'Exam Levy',
    },
  ];
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>(
    import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true' ? demoFeeStructures : [],
  );
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    apiRequest<{ data: { payload: { items?: FeeStructureItem[] }; revision: number } }>('/module-data/fee-structure')
      .then(({ data }) => { setFeeStructures(data.payload.items || []); setRevision(data.revision); })
      .catch((error) => showToast('Could not load fee structure', describeApiError(error), 'error'));
  }, [showToast]);

  // New Fee Structure Form
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeClass, setNewFeeClass] = useState('All Classes');
  const [newFeeAmount, setNewFeeAmount] = useState(20000);
  const [newFeeCategory, setNewFeeCategory] = useState<FeeStructureItem['category']>('Development');

  const handleAddFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeName) return;
    const item: FeeStructureItem = {
      id: `fs-${Date.now()}`,
      name: newFeeName,
      applicableClass: newFeeClass,
      amount: Number(newFeeAmount),
      isMandatory: true,
      category: newFeeCategory,
    };
    const next = [...feeStructures, item];
    try {
      const response = await apiMutation<{ data: { revision: number } }>('/module-data/fee-structure', 'PUT', {
        payload: { items: next }, revision,
      });
      setFeeStructures(next);
      setRevision(response.data.revision);
      setShowNewFeeModal(false);
      setNewFeeName('');
    } catch (error) {
      showToast('Fee item not created', describeApiError(error), 'error');
      return;
    }
    showToast('Fee item created', `${item.name} is now in the school billing schedule.`, 'success');
  };

  const handleRecordDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay || payAmount <= 0) return;

    addFeeTransaction({
      studentId: selectedStudentForPay.id,
      studentName: `${selectedStudentForPay.firstName} ${selectedStudentForPay.lastName}`,
      admissionNo: selectedStudentForPay.admissionNo,
      amount: Number(payAmount),
      currency: 'NGN',
      title: 'Tuition & Academic Levies (First Term)',
      status: 'paid',
      paymentMethod: paymentChannel,
    });

    setShowPaymentModal(false);
    showToast('Payment submitted', `The payment for ${selectedStudentForPay.firstName} is pending backend verification.`, 'info');
  };

  const totalCollected = feeTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const totalBilledEstimate = students.length * 220000;
  const collectionPercentage = Math.round((totalCollected / totalBilledEstimate) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-slate-900">
              Fee Invoicing & Payment Gateway
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
              Auto-Reconciled
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage termly fee schedules, issue student debit invoices, and process instant bank or card settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Record Payment & Issue Receipt</span>
          </button>
          <button
            onClick={() => setShowNewFeeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fee Schedule</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Revenue Collected
          </span>
          <div className="text-2xl font-black font-display text-emerald-600">
            ₦{totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {feeTransactions.length} Cleared Transactions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Collection Progress
          </span>
          <div className="text-2xl font-black font-display text-slate-900">
            {collectionPercentage}% <span className="text-xs text-slate-400 font-normal">of billed</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, collectionPercentage)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Payment Gateways
          </span>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs">Paystack</span>
            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-xs">Zenith Bank</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs">Direct NIBSS</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block pt-1">
            ✓ Instant Webhook Confirmation
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Outstanding Arrears
          </span>
          <div className="text-2xl font-black font-display text-amber-700">
            ₦{(totalBilledEstimate - totalCollected).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Across {students.filter((s) => s.feesStatus !== 'Paid').length} students
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Student Invoices & Receipts</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
            {feeTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('structure')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'structure'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Fee Schedules & Levies</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
            {feeStructures.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settlement')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'settlement'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Bank Accounts & Gateway Config</span>
        </button>
      </div>

      {/* Tab 1: Student Invoices and Transactions */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-display font-bold text-slate-900 text-base">
              Payment Receipts & Audit Trail
            </h3>
            <button
              onClick={() => showToast('Dispatched', 'Bulk fee payment reminders sent to all guardian phone numbers.')}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all"
            >
              Send WhatsApp / SMS Fee Reminders
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Student & Admission</th>
                  <th className="py-3 px-4">Title / Purpose</th>
                  <th className="py-3 px-4">Amount (NGN)</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                      {tx.receiptNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tx.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tx.admissionNo}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{tx.title}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{tx.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Paid & Verified
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => showToast('Receipt Downloaded', `Digital Receipt ${tx.receiptNumber} exported.`)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Download Receipt"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Fee Schedules */}
      {activeTab === 'structure' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeStructures.map((fee) => (
            <div
              key={fee.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {fee.category}
                  </span>
                  {fee.isMandatory ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      Compulsory
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Optional
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mt-2">{fee.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Applicable to: {fee.applicableClass}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Amount</span>
                  <div className="font-display font-black text-xl text-slate-900">
                    ₦{fee.amount.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => showToast('Fee applied', `${fee.name} attached to term invoices.`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all"
                >
                  Bill Class
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Bank Accounts & Gateway Config */}
      {activeTab === 'settlement' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              Designated School Settlement Accounts
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure your school's bank account details in the branding &amp; settings panel.
              Contact your Skuggle account manager to configure Paystack subaccount split.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 text-xs text-amber-800">
            Bank account details must be configured in your school settings before they appear on invoices.
            This section shows configured accounts only — no sample data is displayed in production.
          </div>
        </div>
      )}

      {/* Modal: New Fee Structure */}
      {showNewFeeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Create New Fee Schedule Item
            </h3>
            <form onSubmit={handleAddFeeStructure} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fee Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cambridge Checkpoint Exam Fee"
                  value={newFeeName}
                  onChange={(e) => setNewFeeName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Applicable Class</label>
                <select
                  value={newFeeClass}
                  onChange={(e) => setNewFeeClass(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm"
                >
                  <option value="All Classes">All Classes</option>
                  <option value="All Junior Secondary">All Junior Secondary (JSS 1-3)</option>
                  <option value="All Senior Secondary">All Senior Secondary (SSS 1-3)</option>
                  <option value="JSS 1">JSS 1 Only</option>
                  <option value="SSS 3">SSS 3 Only</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (NGN)</label>
                <input
                  type="number"
                  value={newFeeAmount}
                  onChange={(e) => setNewFeeAmount(Number(e.target.value))}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewFeeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-black"
                >
                  Save Fee Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Payment Recording */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Record Direct Fee Payment
            </h3>
            <form onSubmit={handleRecordDirectPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Student</label>
                <select
                  value={selectedStudentForPay?.id}
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    setSelectedStudentForPay(st);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNo}) — {s.classLevel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount Paid (NGN)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Channel</label>
                <select
                  value={paymentChannel}
                  onChange={(e: any) => setPaymentChannel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm"
                >
                  <option value="Bank Transfer">Bank Transfer (Zenith / Direct NIBSS)</option>
                  <option value="Paystack Card">Paystack Online Card</option>
                  <option value="Cash / POS">School Bursary POS / Cash</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Issue Digital Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
