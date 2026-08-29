import React from 'react';
import { CheckCircle2, LoaderCircle, ShieldAlert } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';

export const VerificationStatusPage: React.FC<{ status: string | null; onSignIn: () => void }> = ({ status, onSignIn }) => {
  const success = status === 'success';
  return <main className="min-h-screen bg-[#f3f0ff] px-4 py-10 flex items-center justify-center">
    <section className="w-full max-w-md rounded-3xl border border-violet-100 bg-white p-7 text-center shadow-xl shadow-violet-950/10">
      <div className="flex justify-center"><BrandMark size="sm" showText /></div>
      <div className={`mx-auto mt-7 flex h-14 w-14 items-center justify-center rounded-2xl ${success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {success ? <LoaderCircle className="h-7 w-7 animate-spin" /> : <ShieldAlert className="h-7 w-7" />}
      </div>
      <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900">{success ? 'Email verified' : 'Verification link unavailable'}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {success ? 'Your account is ready. We are securely opening your Skuggle workspace now.' : 'This verification link is invalid or has expired. Sign in to request a fresh link.'}
      </p>
      {!success && <button type="button" onClick={onSignIn} className="mt-6 w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700">Go to sign in</button>}
      {success && <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Verification complete</div>}
    </section>
  </main>;
};
