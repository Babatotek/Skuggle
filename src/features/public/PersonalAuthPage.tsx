import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Phone,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { apiRequest, ApiError, initializeCsrf, describeApiError } from '../../lib/apiClient';

interface PersonalAuthPageProps {
  onSuccess: (role: UserRole) => void;
  onBack: () => void;
}

type AuthTab = 'signin' | 'register';

interface LoginResponse {
  success: true;
  data: { user: { role: string; mfaRequired: boolean; mfaConfirmed: boolean } };
}
interface MfaSetupResponse { success: true; data: { setupKey: string } }
interface MfaConfirmResponse { success: true; data: { confirmed: true; recoveryCodes: string[] } }

function toUserRole(role: string): UserRole {
  const map: Record<string, UserRole> = {
    school_admin: 'School Admin', principal: 'Principal', teacher: 'Teacher',
    parent: 'Parent', student: 'Student', platform_owner: 'Platform Owner',
    platform_super_admin: 'Platform Owner',
  };
  return map[role.trim().toLowerCase().replace(/[\s-]+/g, '_')] ?? 'Student';
}

/* ── Spike-load animation button ─────────────────────────────────────────── */
interface SpikeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean;
}
const SpikeButton: React.FC<SpikeButtonProps> = ({ loading, children, className = '', ...rest }) => (
  <button
    {...rest}
    disabled={loading || rest.disabled}
    className={`relative w-full py-3.5 rounded-xl text-sm font-bold text-white overflow-hidden
      bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.98] transition-all duration-150
      shadow-lg shadow-violet-500/25 focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:opacity-60 ${className}`}
  >
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <motion.span key="bars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }} className="absolute inset-0 flex items-center justify-center gap-[3px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span key={i} className="w-[3px] rounded-full bg-violet-200"
              animate={{ scaleY: [0.25, 1, 0.25] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.055, ease: 'easeInOut' }}
              style={{ height: 18, transformOrigin: 'center' }} />
          ))}
        </motion.span>
      ) : (
        <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }} className="flex items-center justify-center gap-2">
          {children}
        </motion.span>
      )}
    </AnimatePresence>
    {/* height anchor — keeps button size stable */}
    <span className="invisible pointer-events-none select-none flex items-center justify-center gap-2" aria-hidden>
      {children}
    </span>
  </button>
);

/* ── Password field ───────────────────────────────────────────────────────── */
interface PwdFieldProps {
  id: string; label: string; value: string; onChange: (v: string) => void;
  autoComplete?: string; minLength?: number; required?: boolean; hint?: string;
  rightSlot?: React.ReactNode;
}
const PwdField: React.FC<PwdFieldProps> = ({ id, label, value, onChange, autoComplete = 'current-password', minLength, required, hint, rightSlot }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-xs font-semibold text-slate-600">{label}</label>
        {rightSlot}
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          placeholder="••••••••" autoComplete={autoComplete} minLength={minLength} required={required}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all" />
        <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)} aria-label={show ? 'Hide' : 'Show'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
};

/* ── Text input ───────────────────────────────────────────────────────────── */
interface TxtFieldProps {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string; required?: boolean;
  icon: React.ReactNode;
}
const TxtField: React.FC<TxtFieldProps> = ({ id, label, value, onChange, type = 'text', placeholder, autoComplete, required, icon }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} required={required}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900
          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all" />
    </div>
  </div>
);

/* ── Slide animation ─────────────────────────────────────────────────────── */
const slide = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: -16, transition: { duration: 0.18, ease: 'easeIn' as const } },
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export const PersonalAuthPage: React.FC<PersonalAuthPageProps> = ({ onSuccess, onBack }) => {
  const { showToast, registerPersonalAccount } = useApp();
  const [tab, setTab] = useState<AuthTab>('signin');

  /* sign-in */
  const [siEmail, setSiEmail]       = useState('');
  const [siPassword, setSiPassword] = useState('');

  /* register */
  const [regName, setRegName]       = useState('');
  const [regEmail, setRegEmail]     = useState('');
  const [regPhone, setRegPhone]     = useState('');
  const [regPwd, setRegPwd]         = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  /* shared */
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  /* MFA */
  const [mfaKey, setMfaKey]         = useState<string | null>(null);
  const [mfaCode, setMfaCode]       = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [pendingRole, setPendingRole] = useState<UserRole>('Student');

  const clearErr = () => setError(null);
  const switchTab = (t: AuthTab) => { setTab(t); clearErr(); };

  /* ── sign in ── */
  const signIn = async () => {
    setLoading(true); clearErr();
    try {
      await initializeCsrf();
      const res = await apiRequest<LoginResponse>('/auth/login', {
        suppressErrorNotification: true, method: 'POST',
        body: JSON.stringify({ email: siEmail.trim().toLowerCase(), password: siPassword }),
      });
      const role = toUserRole(res.data.user.role);
      if (res.data.user.mfaRequired && !res.data.user.mfaConfirmed) {
        const setup = await apiRequest<MfaSetupResponse>('/auth/mfa/enable', { method: 'POST' });
        setPendingRole(role); setMfaKey(setup.data.setupKey); return;
      }
      window.dispatchEvent(new Event('skuggle:authenticated'));
      onSuccess(role);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Sign in failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── register ── */
  const register = async () => {
    if (regPwd !== regConfirm) { setError('Passwords do not match.'); return; }
    if (regPwd.length < 8)     { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); clearErr();
    try {
      await registerPersonalAccount({
        persona: 'student', fullName: regName.trim(),
        email: regEmail.trim().toLowerCase(), phone: regPhone.trim(),
        password: regPwd, birthDate: '', guardianName: '', guardianEmail: '',
        actionIntent: 'personal_space',
      });
      showToast('Account created', 'Welcome! Sign in to continue.', 'success');
      setSiEmail(regEmail.trim().toLowerCase());
      switchTab('signin');
    } catch (e) {
      setError(describeApiError(e));
    } finally { setLoading(false); }
  };

  /* ── MFA confirm ── */
  const confirmMfa = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); clearErr();
    try {
      const res = await apiRequest<MfaConfirmResponse>('/auth/mfa/confirm', {
        suppressErrorNotification: true, method: 'POST',
        body: JSON.stringify({ code: mfaCode.trim() }),
      });
      setRecoveryCodes(res.data.recoveryCodes); setMfaKey(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Code could not be confirmed.');
    } finally { setLoading(false); }
  };

  const finishMfa = () => { window.dispatchEvent(new Event('skuggle:authenticated')); onSuccess(pendingRole); };

  /* strength helper */
  const strength = regPwd.length >= 12 ? 'strong' : regPwd.length >= 8 ? 'good' : regPwd.length > 0 ? 'weak' : '';
  const strengthColor = strength === 'strong' ? 'bg-emerald-500' : strength === 'good' ? 'bg-amber-400' : 'bg-red-400';
  const strengthLabel = strength === 'strong' ? '✓ Strong' : strength === 'good' ? 'Good — could be stronger' : 'Too short (min 8)';
  const strengthText  = strength === 'strong' ? 'text-emerald-600' : strength === 'good' ? 'text-amber-600' : 'text-red-500';

  /* ───────────────────────────── RENDER ─────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-[#f3f0ff]">

      {/* ── top bar ── */}
      <div className="flex items-center justify-between px-6 py-4 max-w-lg mx-auto w-full">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <BrandMark size="sm" showText />
      </div>

      {/* ── centered card ── */}
      <div className="flex-1 flex items-center justify-center px-4 pb-6">
        <div className="w-full max-w-[440px]">

          {/* MFA setup */}
          {mfaKey && (
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-7">
              <Lock className="w-8 h-8 text-indigo-600 mb-4" />
              <h2 className="font-display text-xl font-extrabold text-slate-900 mb-1">Two-factor setup</h2>
              <p className="text-xs text-slate-500 mb-4">Scan this key in your authenticator, then enter the 6-digit code.</p>
              <code className="block select-all break-all rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm font-bold text-indigo-900 mb-4">{mfaKey}</code>
              {error && <p className="mb-3 text-xs font-semibold text-red-600">{error}</p>}
              <form onSubmit={confirmMfa} className="flex gap-2">
                <input aria-label="Code" inputMode="numeric" autoComplete="one-time-code" value={mfaCode}
                  onChange={e => setMfaCode(e.target.value)} placeholder="000 000" required
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <SpikeButton type="submit" loading={loading} className="w-auto px-5 flex-shrink-0 !w-auto">Verify</SpikeButton>
              </form>
            </div>
          )}

          {/* MFA recovery */}
          {recoveryCodes.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-7">
              <h2 className="font-display text-xl font-extrabold text-slate-900 mb-1">Save recovery codes</h2>
              <p className="text-xs text-slate-500 mb-4">Store these safely — they won't be shown again.</p>
              <ul className="grid grid-cols-2 gap-1 bg-amber-50 border border-amber-200 rounded-xl p-3 font-mono text-xs text-slate-800 mb-5">
                {recoveryCodes.map(c => <li key={c}>{c}</li>)}
              </ul>
              <button type="button" onClick={finishMfa}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors">
                I saved them — continue
              </button>
            </div>
          )}

          {/* Main auth card */}
          {!mfaKey && recoveryCodes.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

              {/* card header */}
              <div className="px-7 pt-7 pb-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-[22px] font-extrabold text-slate-900 leading-tight">Personal Space</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your independent learning workspace — study, teach, or manage your family.
                  </p>
                </div>
              </div>

              {/* tab bar */}
              <div className="px-7">
                <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
                  {(['signin', 'register'] as AuthTab[]).map(t => (
                    <button key={t} type="button" onClick={() => switchTab(t)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200
                        ${tab === t ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                      {t === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                  ))}
                </div>
              </div>

              {/* error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="px-7 pt-3">
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-red-700">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* forms */}
              <div className="px-7 pt-4 pb-7">
                <AnimatePresence mode="wait" initial={false}>

                  {/* ── SIGN IN ── */}
                  {tab === 'signin' && (
                    <motion.form key="si" variants={slide} initial="hidden" animate="visible" exit="exit"
                      onSubmit={e => { e.preventDefault(); void signIn(); }} className="space-y-4" noValidate>
                      <TxtField id="si-email" label="Email address" value={siEmail} onChange={setSiEmail}
                        type="email" placeholder="you@example.com" autoComplete="email" required
                        icon={<Mail className="w-4 h-4" />} />
                      <PwdField id="si-pw" label="Password" value={siPassword} onChange={setSiPassword}
                        autoComplete="current-password" required
                        rightSlot={
                          <button type="button" onClick={() => showToast('Password Reset', 'Check your email for a reset link.', 'info')}
                            className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                            Forgot password?
                          </button>
                        } />
                      <SpikeButton type="submit" loading={loading}>
                        Sign In <ArrowRight className="w-4 h-4" />
                      </SpikeButton>
                      <p className="text-center text-xs text-slate-500 pt-1">
                        No account?{' '}
                        <button type="button" onClick={() => switchTab('register')}
                          className="font-bold text-violet-600 hover:text-violet-800 transition-colors">Create one free</button>
                      </p>
                    </motion.form>
                  )}

                  {/* ── REGISTER ── */}
                  {tab === 'register' && (
                    <motion.form key="reg" variants={slide} initial="hidden" animate="visible" exit="exit"
                      onSubmit={e => { e.preventDefault(); void register(); }} className="space-y-3.5" noValidate>
                      <TxtField id="reg-name" label="Full name" value={regName} onChange={setRegName}
                        placeholder="Oluwatosin Fanimo" autoComplete="name" required icon={<User className="w-4 h-4" />} />
                      <TxtField id="reg-email" label="Email address" value={regEmail} onChange={setRegEmail}
                        type="email" placeholder="you@example.com" autoComplete="email" required icon={<Mail className="w-4 h-4" />} />
                      <TxtField id="reg-phone" label="Phone (optional)" value={regPhone} onChange={setRegPhone}
                        type="tel" placeholder="+234 800 000 0000" autoComplete="tel" icon={<Phone className="w-4 h-4" />} />
                      <PwdField id="reg-pw" label="Create password" value={regPwd} onChange={setRegPwd}
                        autoComplete="new-password" minLength={8} required hint="At least 8 characters" />

                      {/* strength bar */}
                      {regPwd.length > 0 && (
                        <div className="space-y-1 -mt-1">
                          <div className="flex gap-1">
                            {[4, 6, 8, 10, 12].map(t => (
                              <div key={t} className={`flex-1 h-1 rounded-full transition-all duration-300 ${regPwd.length >= t ? strengthColor : 'bg-slate-200'}`} />
                            ))}
                          </div>
                          <p className={`text-[10px] font-semibold ${strengthText}`}>{strengthLabel}</p>
                        </div>
                      )}

                      <PwdField id="reg-confirm" label="Confirm password" value={regConfirm} onChange={setRegConfirm}
                        autoComplete="new-password" required />

                      {/* match indicator */}
                      {regConfirm.length > 0 && (
                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold -mt-1 ${regPwd === regConfirm ? 'text-emerald-600' : 'text-red-500'}`}>
                          {regPwd === regConfirm
                            ? <><CheckCircle2 className="w-3.5 h-3.5" />Passwords match</>
                            : <><AlertCircle className="w-3.5 h-3.5" />Passwords don't match</>}
                        </div>
                      )}

                      <SpikeButton type="submit" loading={loading}>
                        Create Personal Account <ArrowRight className="w-4 h-4" />
                      </SpikeButton>
                      <p className="text-center text-xs text-slate-500 pt-1">
                        Already have an account?{' '}
                        <button type="button" onClick={() => switchTab('signin')}
                          className="font-bold text-violet-600 hover:text-violet-800 transition-colors">Sign in</button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
