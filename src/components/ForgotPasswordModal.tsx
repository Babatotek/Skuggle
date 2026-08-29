import React, { useState } from 'react';
import { CheckCircle2, Mail, X } from 'lucide-react';
import { apiRequest, describeApiError, initializeCsrf } from '../lib/apiClient';

export const ForgotPasswordModal: React.FC<{ initialEmail?: string; onClose: () => void }> = ({ initialEmail = '', onClose }) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(null); setMessage(null);
    try {
      await initializeCsrf();
      const response = await apiRequest<{ data: { message: string } }>('/auth/forgot-password', { method: 'POST', suppressErrorNotification: true, body: JSON.stringify({ email: email.trim().toLowerCase() }) });
      setMessage(response.data.message);
    } catch (cause) { setError(describeApiError(cause)); }
    finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/55 p-4" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Mail className="h-6 w-6" /></div>
      <h2 id="forgot-password-title" className="font-display text-xl font-extrabold text-slate-900">Reset your password</h2>
      <p className="mt-1 text-sm text-slate-600">Enter the email registered to your Skuggle account.</p>
      {message ? <div className="mt-5 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-semibold leading-relaxed text-emerald-800">{message}</p><button type="button" onClick={onClose} className="mt-4 w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700">Back to sign in</button></div> : <form onSubmit={submit} className="mt-5 space-y-3">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60">{loading ? 'Checking…' : 'Send reset link'}</button>
      </form>}
    </div>
  </div>;
};
