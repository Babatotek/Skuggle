import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  Download,
  Lock,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentRecord } from '../../types';
import { LoadingButton } from '../../shared/ui';
import { feedbackBus } from '../../shared/feedback/feedbackBus';

interface MakePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentRecord | null;
  amount?: number;
}

export const MakePaymentModal: React.FC<MakePaymentModalProps> = ({
  isOpen,
  onClose,
  student,
  amount = 45000,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'ussd'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [receiptNo, setReceiptNo] = useState(`REC-${Math.floor(100000 + Math.random() * 900000)}`);

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    window.setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      feedbackBus.success(
        `Payment of ₦${amount.toLocaleString()} confirmed for ${student?.name || 'Nathan Bello'}.`,
      );
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Secure Fee Payment Gateway</h2>
              <p className="text-[10.5px] text-white/80">Royal Gateway Academy • 256-bit Encrypted</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isPaid ? (
          <form onSubmit={handlePay} className="p-6 space-y-4 text-xs">
            {/* Amount Banner */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <p className="text-slate-500 font-medium">Total Amount Due</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">₦{amount.toLocaleString()}</p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                First Term Tuition & ICT Levy • {student?.name || 'Nathan Bello'}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Select Payment Channel</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-center font-bold ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-2.5 rounded-xl border text-center font-bold ${
                    paymentMethod === 'transfer'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Bank Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ussd')}
                  className={`p-2.5 rounded-xl border text-center font-bold ${
                    paymentMethod === 'ussd'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  USSD Code
                </button>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Card Number</label>
                  <input
                    type="text"
                    required
                    defaultValue="5399 4100 8821 9024"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Expiry Date</label>
                    <input
                      type="text"
                      required
                      defaultValue="09/28"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">CVV</label>
                    <input
                      type="password"
                      required
                      defaultValue="812"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-slate-700 space-y-1">
                <p className="font-bold text-indigo-900">Dedicated Virtual Account:</p>
                <p className="font-mono text-sm font-bold text-slate-900">0129384756 (Wema Bank)</p>
                <p className="text-[10.5px] text-slate-500">Account Name: Royal Gateway Academy - Bello Nathan</p>
              </div>
            )}

            <LoadingButton
              type="submit"
              loading={isProcessing}
              loadingText="Processing Transaction…"
              icon={<Lock className="w-3.5 h-3.5" />}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all"
            >
              {`Authorize ₦${amount.toLocaleString()}`}
            </LoadingButton>
          </form>
        ) : (
          <div className="p-6 space-y-4 text-center text-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">Payment Successful!</h3>
              <p className="text-slate-500 mt-0.5">Transaction reference: {receiptNo}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1">
              <div className="flex justify-between"><span>Amount Paid:</span> <strong>₦{amount.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Student:</span> <strong>{student?.name || 'Nathan Bello'}</strong></div>
              <div className="flex justify-between"><span>Channel:</span> <strong>Direct Card Settlement</strong></div>
              <div className="flex justify-between"><span>Status:</span> <strong className="text-emerald-600">CONFIRMED (0.00 Balance)</strong></div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
