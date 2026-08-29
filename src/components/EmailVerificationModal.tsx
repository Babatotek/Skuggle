import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail } from 'lucide-react';
import { apiRequest, describeApiError, initializeCsrf } from '../../lib/apiClient';

interface EmailVerificationModalProps {
  email: string;
  onClose: () => void;
  onResent?: () => void;
  title?: string;
  description?: string;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  email,
  onClose,
  onResent,
  title = 'Verify your email',
  description,
}) => {
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    setResending(true);
    setError(null);
    setFeedback(null);
    try {
      await initializeCsrf();
      await apiRequest('/auth/email/resend', {
        suppressErrorNotification: true,
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setFeedback(`Verification email sent to ${email}. Check inbox and spam.`);
      onResent?.();
    } catch (cause) {
      setError(describeApiError(cause));
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="verify-gate"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-verify-gate-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Mail className="h-6 w-6" />
          </div>
          <h2 id="email-verify-gate-title" className="text-center font-display text-xl font-extrabold text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 leading-relaxed">
            {description ?? (
              <>
                Your account <span className="font-semibold text-slate-900">{email}</span> is not verified yet.
                Open the Skuggle link in your inbox, then sign in again.
              </>
            )}
          </p>
          {feedback && (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[11px] font-semibold text-emerald-800">
              {feedback}
            </p>
          )}
          {error && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-semibold text-red-700">
              {error}
            </p>
          )}
          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-colors"
            >
              Got it — back to sign in
            </button>
            <button
              type="button"
              disabled={resending || !email}
              onClick={() => void resend()}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-60 transition-colors"
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
