import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  ChevronLeft,
  Hash,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { EmailVerificationModal } from '../../components/EmailVerificationModal';
import { ForgotPasswordModal } from '../../components/ForgotPasswordModal';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { apiRequest, ApiError, initializeCsrf, describeApiError } from '../../lib/apiClient';

interface SchoolAuthPageProps {
  onSuccess: (role: UserRole) => void;
  onBack: () => void;
  onRegisterSchool: () => void;
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
    platform_super_admin: 'Platform Owner', bursar: 'Bursar',
  };
  return map[role.trim().toLowerCase().replace(/[\s-]+/g, '_')] ?? 'Student';
}

/* ── Spike-load button ─────────────────────────────────────────────────── */
interface SpikeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { loading: boolean }
const SpikeButton: React.FC<SpikeButtonProps> = ({ loading, children, className = '', ...rest }) => (
  <button {...rest} disabled={loading || rest.disabled}
    className={`relative w-full py-3.5 rounded-xl text-sm font-bold text-white overflow-hidden
      bg-[#4f46e5] hover:bg-[#4338ca] active:scale-[0.98] transition-all duration-150
      shadow-lg shadow-indigo-500/25 focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:opacity-60 ${className}`}>
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <motion.span key="bars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }} className="absolute inset-0 flex items-center justify-center gap-[3px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span key={i} className="w-[3px] rounded-full bg-indigo-200"
              animate={{ scaleY: [0.25, 1, 0.25] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.055, ease: 'easeInOut' }}
              style={{ height: 18, transformOrigin: 'center' }} />
          ))}
        </motion.span>
      ) : (
        <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }} className="flex items-center justify-center gap-2">{children}</motion.span>
      )}
    </AnimatePresence>
    <span className="invisible pointer-events-none select-none flex items-center justify-center gap-2" aria-hidden>{children}</span>
  </button>
);

/* ── Password field ─────────────────────────────────────────────────────── */
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
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#f7f8fc] text-sm text-slate-900
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
        <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)} aria-label={show ? 'Hide' : 'Show'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
};

/* ── Text field ─────────────────────────────────────────────────────────── */
interface TxtFieldProps {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string; required?: boolean;
  icon: React.ReactNode; mono?: boolean;
}
const TxtField: React.FC<TxtFieldProps> = ({ id, label, value, onChange, type = 'text', placeholder, autoComplete, required, icon, mono }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} required={required}
        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-[#f7f8fc] text-sm text-slate-900
          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all
          ${mono ? 'font-mono uppercase tracking-wider' : ''}`} />
    </div>
  </div>
);

/* ── Checkbox ───────────────────────────────────────────────────────────── */
const CheckboxField: React.FC<{ id: string; label: string; checked: boolean; onChange: (v: boolean) => void }> =
  ({ id, label, checked, onChange }) => (
    <div className="flex items-center gap-2.5">
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer" />
      <label htmlFor={id} className="text-xs text-slate-600 cursor-pointer select-none">{label}</label>
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
export const SchoolAuthPage: React.FC<SchoolAuthPageProps> = ({ onSuccess, onBack, onRegisterSchool }) => {
  const { showToast, registerPersonalAccount } = useApp();
  const [tab, setTab] = useState<AuthTab>('signin');

  /* sign-in */
  const [siEmail, setSiEmail]         = useState('');
  const [siPassword, setSiPassword]   = useState('');
  const [siSchoolCode, setSiSchoolCode] = useState('');
  const [siRemember, setSiRemember]   = useState(false);

  /* register */
  const [regName, setRegName]         = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regCode, setRegCode]         = useState('');
  const [regPwd, setRegPwd]           = useState('');
  const [regConfirm, setRegConfirm]   = useState('');

  /* shared */
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  /* MFA */
  const [mfaKey, setMfaKey]           = useState<string | null>(null);
  const [mfaCode, setMfaCode]         = useState('');
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
        body: JSON.stringify({
          email: siEmail.trim().toLowerCase(), password: siPassword,
          ...(siSchoolCode.trim() ? { school_code: siSchoolCode.trim().toUpperCase() } : {}),
        }),
      });
      const role = toUserRole(res.data.user.role);
      if (res.data.user.mfaRequired && !res.data.user.mfaConfirmed) {
        const setup = await apiRequest<MfaSetupResponse>('/auth/mfa/enable', { method: 'POST' });
        setPendingRole(role); setMfaKey(setup.data.setupKey); return;
      }
      window.dispatchEvent(new Event('skuggle:authenticated'));
      onSuccess(role);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'EMAIL_UNVERIFIED') {
        const email = e.fields.email?.[0] || siEmail.trim().toLowerCase();
        setPendingVerifyEmail(email);
        setSiEmail(email);
        return;
      }
      setError(e instanceof ApiError ? e.message : 'Sign in failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── register / activate ── */
  const register = async () => {
    if (regPwd !== regConfirm) { setError('Passwords do not match.'); return; }
    if (regPwd.length < 8)     { setError('Password must be at least 8 characters.'); return; }
    if (!regCode.trim())       { setError('Please enter your school or invitation code.'); return; }
    setLoading(true); clearErr();
    try {
      await registerPersonalAccount({
        persona: 'teacher', fullName: regName.trim(),
        email: regEmail.trim().toLowerCase(), phone: '',
        password: regPwd, birthDate: '', guardianName: '', guardianEmail: '',
        actionIntent: 'join_school', schoolInviteCode: regCode.trim().toUpperCase(),
      });
      setSiEmail(regEmail.trim().toLowerCase());
      switchTab('signin');
    } catch (e) {
      setError(describeApiError(e));
    } finally { setLoading(false); }
  };

  /* ── MFA ── */
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

  /* strength */
  const strength = regPwd.length >= 12 ? 'strong' : regPwd.length >= 8 ? 'good' : regPwd.length > 0 ? 'weak' : '';
  const strengthColor = strength === 'strong' ? 'bg-emerald-500' : strength === 'good' ? 'bg-amber-400' : 'bg-red-400';
  const strengthLabel = strength === 'strong' ? '✓ Strong' : strength === 'good' ? 'Good — could be stronger' : 'Too short (min 8)';
  const strengthText  = strength === 'strong' ? 'text-emerald-600' : strength === 'good' ? 'text-amber-600' : 'text-red-500';

  /* ─────────────────────────────── MFA overlays ──────────────────────────── */
  if (mfaKey) return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef2ff] p-4">
      <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-8 w-full max-w-md">
        <ShieldCheck className="w-8 h-8 text-indigo-600 mb-4" />
        <h2 className="font-display text-xl font-extrabold text-slate-900 mb-1">Secure your account</h2>
        <p className="text-xs text-slate-500 mb-4">Scan this key in your authenticator, then enter the 6-digit code.</p>
        <code className="block select-all break-all rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm font-bold text-indigo-900 mb-4">{mfaKey}</code>
        {error && <p className="mb-3 text-xs font-semibold text-red-600">{error}</p>}
        <form onSubmit={confirmMfa} className="flex gap-2">
          <input aria-label="Code" inputMode="numeric" autoComplete="one-time-code" value={mfaCode}
            onChange={e => setMfaCode(e.target.value)} placeholder="000 000" required
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <SpikeButton type="submit" loading={loading} className="!w-auto px-5 flex-shrink-0">Verify</SpikeButton>
        </form>
      </div>
    </div>
  );

  if (recoveryCodes.length > 0) return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef2ff] p-4">
      <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-8 w-full max-w-md">
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
    </div>
  );

  /* ─────────────────────────────── MAIN RENDER ───────────────────────────── */
  return (
    <>
      {forgotPasswordOpen && <ForgotPasswordModal initialEmail={siEmail} onClose={() => setForgotPasswordOpen(false)} />}
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8f9fe]">
      {pendingVerifyEmail && (
        <EmailVerificationModal
          email={pendingVerifyEmail}
          onClose={() => setPendingVerifyEmail(null)}
          onResent={() => showToast('Verification email sent', `Check ${pendingVerifyEmail} (and spam).`, 'success')}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL — dark purple, mascot, tagline
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] p-8 relative">
        {/* rounded container with gradient background */}
        <div
          className="w-full rounded-3xl flex flex-col justify-between p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #2e1065 0%, #1e1b4b 55%, #312e81 100%)' }}
        >
          {/* subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px)' }} />

          {/* top glow */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)' }} />
          {/* bottom glow */}
          <div className="absolute -bottom-16 right-0 w-64 h-64 rounded-full opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 65%)' }} />

          {/* brand - text only */}
          <div className="relative z-10 flex items-center gap-2.5">
            <span className="font-display font-extrabold text-white text-2xl tracking-tight">Skuggle</span>
          </div>

          {/* robot mascot - larger size, facing right toward the form */}
          <div className="relative z-10 flex items-center justify-center py-4 flex-1">
            <motion.img
              src="/skuggle-ai-login-new (2).png"
              alt="Skuggle AI mascot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }}
              whileHover={{ y: -6, transition: { type: 'spring', stiffness: 220, damping: 16 } }}
              className="w-[85%] max-w-[380px] drop-shadow-2xl object-contain select-none"
            />
          </div>

          {/* tagline */}
          <div className="relative z-10 space-y-5">
            <div>
              <p className="text-xs font-bold tracking-widest text-indigo-300 uppercase mb-2">Welcome back</p>
              <h2 className="font-display text-3xl xl:text-4xl font-extrabold text-white leading-tight">
                Your school day,<br />in one calm place.
              </h2>
            </div>
            <div className="space-y-2">
              {['Role-specific workspaces', 'Tenant- and permission-aware access'].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span className="text-xs text-indigo-200 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PANEL — form
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-white lg:bg-[#f8f9fe]">

        {/* mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <BrandMark size="sm" showText />
        </div>

        {/* desktop back */}
        <div className="hidden lg:flex items-center px-10 pt-8">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* form area */}
        <div className="flex-1 flex items-center justify-center px-5 py-8 lg:px-12">
          <div className="w-full max-w-[420px]">

            {/* header */}
            <div className="mb-7">
              <p className="text-[10px] font-bold tracking-[0.18em] text-indigo-600 uppercase mb-2">Secure Account Access</p>
              <h1 className="font-display text-[26px] font-extrabold text-slate-900 leading-tight mb-1">
                {tab === 'signin' ? 'Sign in to your account' : 'Activate your school account'}
              </h1>
              <p className="text-sm text-slate-500">
                {tab === 'signin'
                  ? 'Enter the details for your Skuggle school connected account.'
                  : 'Use your school or invitation code to set up your access.'}
              </p>
            </div>

            {/* tab toggle (subtle) */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1 mb-6">
              {(['signin', 'register'] as AuthTab[]).map(t => (
                <button key={t} type="button" onClick={() => switchTab(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200
                    ${tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {t === 'signin' ? 'Sign In' : 'Activate Account'}
                </button>
              ))}
            </div>

            {/* error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="mb-4">
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>

              {/* ── SIGN IN ── */}
              {tab === 'signin' && (
                <motion.form key="school-si" variants={slide} initial="hidden" animate="visible" exit="exit"
                  onSubmit={e => { e.preventDefault(); void signIn(); }} className="space-y-4" noValidate>

                  <TxtField id="s-si-email" label="Email address" value={siEmail} onChange={setSiEmail}
                    type="email" placeholder="h.lawal@school.edu.ng" autoComplete="email" required
                    icon={<Mail className="w-4 h-4" />} />

                  <PwdField id="s-si-pw" label="Password" value={siPassword} onChange={setSiPassword}
                    autoComplete="current-password" required
                    rightSlot={
                      <button type="button" onClick={() => setForgotPasswordOpen(true)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                        Forgot password?
                      </button>
                    } />

                  {/* optional school code */}
                  <TxtField id="s-si-code" label="School code (optional)" value={siSchoolCode}
                    onChange={v => setSiSchoolCode(v.toUpperCase())}
                    placeholder="e.g. CHIA-LAGOS" autoComplete="off"
                    icon={<Hash className="w-4 h-4" />} mono />

                  <CheckboxField id="s-si-remember" label="Keep me signed in on this device"
                    checked={siRemember} onChange={setSiRemember} />

                  <SpikeButton type="submit" loading={loading}>
                    Sign in <ArrowRight className="w-4 h-4" />
                  </SpikeButton>

                  <div className="pt-1 space-y-1.5 text-center">
                    <p className="text-xs text-slate-500">
                      New to Skuggle?{' '}
                      <button type="button" onClick={() => switchTab('register')}
                        className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        Create a free parent or student account
                      </button>
                    </p>
                    <p className="text-xs text-slate-500">
                      Registering an institution?{' '}
                      <button type="button" onClick={onRegisterSchool}
                        className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        Create a school account
                      </button>
                    </p>
                  </div>
                </motion.form>
              )}

              {/* ── ACTIVATE ── */}
              {tab === 'register' && (
                <motion.form key="school-reg" variants={slide} initial="hidden" animate="visible" exit="exit"
                  onSubmit={e => { e.preventDefault(); void register(); }} className="space-y-3.5" noValidate>

                  <div className="flex items-start gap-2.5 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Use your admin invitation or school code to activate your account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <TxtField id="s-reg-name" label="Full name" value={regName} onChange={setRegName}
                      placeholder="Your full name" autoComplete="name" required icon={<User className="w-4 h-4" />} />
                    <TxtField id="s-reg-email" label="Email address" value={regEmail} onChange={setRegEmail}
                      type="email" placeholder="you@school.edu.ng" autoComplete="email" required icon={<Mail className="w-4 h-4" />} />
                  <div>
                    <label htmlFor="s-reg-code" className="block text-xs font-semibold text-slate-600 mb-1">
                      School / invitation code
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input id="s-reg-code" type="text" value={regCode}
                        onChange={e => setRegCode(e.target.value.toUpperCase())}
                        placeholder="e.g. CHIA-LAGOS or INV-XXXX-XXXX"
                        autoComplete="off" required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-[#f7f8fc] text-sm text-slate-900
                          font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans
                          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
                    </div>
                  </div>
                    <PwdField id="s-reg-pw" label="Create password" value={regPwd} onChange={setRegPwd}
                      autoComplete="new-password" minLength={8} required hint="8+ characters; use a mix of letters, numbers and symbols" />
                  </div>

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

                  <div className="sm:max-w-[calc(50%-0.4375rem)]">
                    <PwdField id="s-reg-confirm" label="Confirm password" value={regConfirm} onChange={setRegConfirm}
                      autoComplete="new-password" required />
                  </div>

                  {regConfirm.length > 0 && (
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold -mt-1 ${regPwd === regConfirm ? 'text-emerald-600' : 'text-red-500'}`}>
                      {regPwd === regConfirm
                        ? <><CheckCircle2 className="w-3.5 h-3.5" />Passwords match</>
                        : <><AlertCircle className="w-3.5 h-3.5" />Passwords don't match</>}
                    </div>
                  )}

                  <SpikeButton type="submit" loading={loading}>
                    Activate School Account <ArrowRight className="w-4 h-4" />
                  </SpikeButton>

                  <p className="text-center text-xs text-slate-500 pt-1">
                    Already have credentials?{' '}
                    <button type="button" onClick={() => switchTab('signin')}
                      className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Sign in</button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
