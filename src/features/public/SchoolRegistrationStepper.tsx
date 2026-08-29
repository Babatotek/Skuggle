import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { useApp } from '../../context/AppContext';
import { apiRequest, describeApiError, initializeCsrf } from '../../lib/apiClient';

interface SchoolRegistrationStepperProps { onCancel: () => void; onComplete: () => void; onPreviewWelcome: () => void }

export const SchoolRegistrationStepper: React.FC<SchoolRegistrationStepperProps> = ({ onCancel, onComplete }) => {
  const { showToast } = useApp();
  const [schoolName, setSchoolName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (password.length < 8) return setError('Use a password with at least 8 characters.');
    if (password !== confirmation) return setError('Passwords do not match.');
    setIsSubmitting(true);
    try {
      await initializeCsrf();
      await apiRequest('/schools/register', { suppressErrorNotification: true, method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ schoolName: schoolName.trim(), adminName: adminName.trim(), adminEmail: adminEmail.trim().toLowerCase(), password, password_confirmation: confirmation }) });
      showToast('School account created', 'Verify your email, then complete the guided school setup.', 'success');
      onComplete();
    } catch (cause) { setError(describeApiError(cause)); } finally { setIsSubmitting(false); }
  };

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200';
  return (
    <main className="min-h-screen bg-[#f5f3ff] px-4 py-5 sm:py-8"><div className="mx-auto max-w-3xl">
      <header className="mb-5 flex items-center justify-between"><button type="button" onClick={onCancel} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back</button><BrandMark size="sm" showText /></header>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-indigo-950/5">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Building2 className="h-5 w-5" /></span><div><h1 className="font-display text-xl font-extrabold text-slate-900">Create your school workspace</h1><p className="mt-1 text-xs text-slate-500">Start with the essentials. Campus, curriculum, branding, contacts and staff are completed after sign-in.</p></div></div></div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5 sm:px-8">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">School name<div className="relative mt-1"><Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Greenfield Academy" className={fieldClass} /></div></label>
            <label className="text-xs font-semibold text-slate-600">Administrator name<div className="relative mt-1"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required autoComplete="name" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Your full name" className={fieldClass} /></div></label>
            <label className="text-xs font-semibold text-slate-600">Administrator email<div className="relative mt-1"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" autoComplete="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@school.edu.ng" className={fieldClass} /></div></label>
            <label className="text-xs font-semibold text-slate-600">Create password<div className="relative mt-1"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className={`${fieldClass} pr-10`} /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Show password">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-start-2">Confirm password<div className="relative mt-1"><ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Repeat password" className={fieldClass} /></div></label>
          </div>
          <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row"><p className="text-[11px] text-slate-500">More school details are collected in guided onboarding.</p><button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-60 sm:w-auto">{isSubmitting ? 'Creating workspace…' : 'Create school account'}<ArrowRight className="h-4 w-4" /></button></div>
        </form>
      </section>
    </div></main>
  );
};
