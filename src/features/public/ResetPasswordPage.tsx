import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { apiRequest, describeApiError, initializeCsrf } from '../../lib/apiClient';

export const ResetPasswordPage: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const params = new URLSearchParams(window.location.search);
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const email = params.get('email') || ''; const token = params.get('token') || '';
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try { await initializeCsrf(); await apiRequest('/auth/reset-password', { method: 'POST', suppressErrorNotification: true, body: JSON.stringify({ token, email, password, password_confirmation: confirmation }) }); setDone(true); }
    catch (cause) { setError(describeApiError(cause)); } finally { setLoading(false); }
  };
  const validLength = password.length >= 10;
  const matches = password.length > 0 && password === confirmation;
  return <main className="min-h-screen bg-[#f3f0ff] p-4 flex items-center justify-center"><section className="w-full max-w-md rounded-3xl border border-violet-100 bg-white p-7 shadow-xl shadow-violet-950/10">
    <BrandMark size="sm" showText />
    <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">{done ? <CheckCircle2 className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}</div>
    <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900">{done ? 'Password updated' : 'Choose a new password'}</h1>
    <p className="mt-1 text-sm text-slate-600">{done ? 'Your account is secure and ready for you.' : `Resetting the password for ${email || 'your Skuggle account'}.`}</p>
    {done ? <><button onClick={onDone} className="mt-6 w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700">Continue to sign in</button></> : <form onSubmit={submit} className="mt-5 space-y-3">
      {!email || !token ? <><p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">This reset link is incomplete or invalid. Request a new link from the sign-in page.</p><button type="button" onClick={onDone} className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white">Return to sign in</button></> : <>
        <div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} minLength={10} required autoFocus autoComplete="new-password" aria-label="New password" placeholder="New password" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
        <input type={showPassword ? 'text' : 'password'} value={confirmation} onChange={e => setConfirmation(e.target.value)} minLength={10} required autoComplete="new-password" aria-label="Confirm new password" placeholder="Confirm new password" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600"><p className={`flex items-center gap-2 ${validLength ? 'text-emerald-700' : ''}`}><ShieldCheck className="h-4 w-4" /> At least 10 characters</p><p className={`mt-1 flex items-center gap-2 ${matches ? 'text-emerald-700' : ''}`}><ShieldCheck className="h-4 w-4" /> Passwords match</p></div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
        <button disabled={loading || !validLength || !matches} className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{loading ? 'Resetting…' : 'Reset password'}</button>
      </>}
    </form>}
  </section></main>;
};
