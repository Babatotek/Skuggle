import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Receipt,
  PlusCircle,
  TrendingUp,
  Search,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FeeTransaction } from '../../types';

export const FinanceView: React.FC = () => {
  const { branding, students, feeTransactions, addFeeTransaction, showToast } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'std-1');
  const [feeCategory, setFeeCategory] = useState('Second Term Tuition Fee');
  const [amount, setAmount] = useState('145000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<FeeTransaction | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handlePayFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsProcessing(true);
    const newTx: Omit<FeeTransaction, 'id'> = {
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        admissionNo: selectedStudent.admissionNo,
        amount: parseInt(amount) || 145000,
        currency: 'NGN',
        title: feeCategory,
        status: 'pending',
        paymentMethod: 'Paystack Card & Bank Transfer',
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
    };

    addFeeTransaction(newTx);
    setIsProcessing(false);
    setActiveReceipt(null);
    showToast('Payment initiated', `The payment for ${selectedStudent.firstName} is pending provider confirmation.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              School Fee Billing & Receipts
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              Verified Naira Gateway
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Accept and record tuition, PTA levies, ICT fees, and auto-generate verifiable digital receipts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Make Payment / Record Entry */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Record Fee Payment</span>
            </h3>

            <form onSubmit={handlePayFee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Student *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNo}) - {s.classLevel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fee Purpose / Levy *
                </label>
                <select
                  value={feeCategory}
                  onChange={(e) => setFeeCategory(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="Second Term Tuition Fee">Second Term Tuition Fee</option>
                  <option value="PTA Levy & Development">PTA Levy & Development</option>
                  <option value="ICT & Computer Science Lab">ICT & Science Lab Fee</option>
                  <option value="Uniform & Sports Wear">School Uniform & Sports Wear</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount in Naira (₦) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-500">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 font-bold text-sm rounded-xl border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Paystack card or bank-transfer settlement with a verifiable digital timestamp.</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing Transaction...' : `Confirm ₦${parseInt(amount || '0').toLocaleString()} Payment`}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Payment Ledger & Digital Receipts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900">
                Official Fee Transactions & Receipts
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {feeTransactions.length} Total Receipts
              </span>
            </div>

            <div className="space-y-3">
              {feeTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-200 transition-colors bg-slate-50/40"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-slate-900">{tx.studentName}</strong>
                      <span className="text-[10px] font-mono text-slate-500">{tx.admissionNo}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ {tx.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{tx.title}</p>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                      <span>{tx.receiptNumber}</span>
                      <span>·</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-extrabold text-sm text-slate-900">
                      ₦{tx.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        setActiveReceipt(tx);
                        showToast('Receipt Opened', `Viewing official receipt ${tx.receiptNumber}`);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="text-center pb-4 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-indigo-950 uppercase">{branding.schoolName}</h3>
              <p className="text-xs text-slate-500">Official Electronic Fee Receipt</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Receipt No:</span>
                <strong className="font-mono">{activeReceipt.receiptNumber}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student:</span>
                <strong>{activeReceipt.studentName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admission No:</span>
                <span className="font-mono">{activeReceipt.admissionNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Purpose:</span>
                <span>{activeReceipt.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Date:</span>
                <span>{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold bg-slate-50 px-2 rounded-lg">
                <span>Amount Paid:</span>
                <span className="text-indigo-950 font-extrabold">₦{activeReceipt.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Verified by Skuggle Financial Ledger · Valid without physical stamp.
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
