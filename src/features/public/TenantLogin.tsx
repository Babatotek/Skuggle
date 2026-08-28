import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  User,
  GraduationCap,
  Users,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Compass,
  Laptop,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandMark } from '../../components/BrandMark';
import { UserRole } from '../../types';
import { apiRequest, ApiError, initializeCsrf } from '../../lib/apiClient';

interface TenantLoginProps {
  onSuccess: (role: UserRole) => void;
  onBackToLanding: () => void;
  onOpenResultChecker: () => void;
}

interface LoginResponse {
  success: true;
  data: { user: { role: string; mfaRequired: boolean; mfaConfirmed: boolean } };
}

interface MfaSetupResponse {
  success: true;
  data: { setupKey: string };
}

interface MfaConfirmResponse {
  success: true;
  data: { confirmed: true; recoveryCodes: string[] };
}

function toUserRole(role: string): UserRole {
  const roles: Record<string, UserRole> = {
    school_admin: 'School Admin', principal: 'Principal', teacher: 'Teacher',
    parent: 'Parent', student: 'Student', platform_owner: 'Platform Owner',
  };
  return roles[role.trim().toLowerCase().replace(/[ -]+/g, '_')] || 'Student';
}

export const TenantLogin: React.FC<TenantLoginProps> = ({
  onSuccess,
  onBackToLanding,
  onOpenResultChecker,
}) => {
  const { branding, showToast } = useApp();

  // Space Category Mode: 'school' | 'personal'
  const [selectedSpaceCategory, setSelectedSpaceCategory] = useState<'school' | 'personal'>('school');

  // School Space Login State
  const [schoolRole, setSchoolRole] = useState<UserRole>('Teacher');
  const [schoolIdentifier, setSchoolIdentifier] = useState('');
  const [schoolPassword, setSchoolPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState(branding.schoolCode || 'CHIA-LAGOS');

  // Personal Space Login State
  const [personalRole, setPersonalRole] = useState<'Teacher' | 'Parent' | 'Student'>('Teacher');
  const [personalIdentifier, setPersonalIdentifier] = useState('');
  const [personalPassword, setPersonalPassword] = useState('');

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [mfaSetupKey, setMfaSetupKey] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([]);
  const [pendingRole, setPendingRole] = useState<UserRole>('Student');

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await initializeCsrf();
      const response = await apiRequest<LoginResponse>('/auth/login', {
        suppressErrorNotification: true,
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const authenticatedRole = toUserRole(response.data.user.role);
      if (response.data.user.mfaRequired && !response.data.user.mfaConfirmed) {
        const setup = await apiRequest<MfaSetupResponse>('/auth/mfa/enable', { method: 'POST' });
        setPendingRole(authenticatedRole);
        setMfaSetupKey(setup.data.setupKey);
        return;
      }
      window.dispatchEvent(new Event('skuggle:authenticated'));
      onSuccess(authenticatedRole);
    } catch (error) {
      setLoginError(error instanceof ApiError ? error.message : 'Sign in could not be completed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await apiRequest<MfaConfirmResponse>('/auth/mfa/confirm', {
        suppressErrorNotification: true,
        method: 'POST',
        body: JSON.stringify({ code: mfaCode.trim() }),
      });
      setMfaRecoveryCodes(response.data.recoveryCodes);
      setMfaSetupKey(null);
    } catch (error) {
      setLoginError(error instanceof ApiError ? error.message : 'The authenticator code could not be confirmed.');
    } finally {
      setIsLoading(false);
    }
  };

  const finishMfaEnrollment = () => {
    window.dispatchEvent(new Event('skuggle:authenticated'));
    onSuccess(pendingRole);
  };

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void signIn(schoolIdentifier, schoolPassword);
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void signIn(personalIdentifier, personalPassword);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBackToLanding}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Back to Homepage
        </button>
        <button
          onClick={onOpenResultChecker}
          className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Check Result PIN</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-xl mx-auto w-full my-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {loginError && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
              {loginError}
            </div>
          )}
          {mfaSetupKey && (
            <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <h2 className="font-display text-lg font-extrabold text-indigo-950">Secure your administrator account</h2>
              <p className="mt-2 text-xs leading-relaxed text-indigo-800">Add this setup key to your authenticator app, then enter the current six-digit code. MFA is required before privileged changes.</p>
              <code className="mt-3 block select-all break-all rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-950 border border-indigo-200">{mfaSetupKey}</code>
              <form onSubmit={confirmMfa} className="mt-4 flex gap-2">
                <input aria-label="Authenticator code" inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-indigo-300 bg-white px-3 py-2 text-sm" required />
                <button disabled={isLoading} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">Confirm MFA</button>
              </form>
            </div>
          )}
          {mfaRecoveryCodes.length > 0 && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-display text-lg font-extrabold text-amber-950">Save your recovery codes</h2>
              <p className="mt-2 text-xs text-amber-800">Store these one-time codes in a password manager. They will not be shown again.</p>
              <ul className="my-3 grid grid-cols-2 gap-1 rounded-xl bg-white p-3 font-mono text-xs text-slate-800 border border-amber-200">
                {mfaRecoveryCodes.map((code) => <li key={code}>{code}</li>)}
              </ul>
              <button type="button" onClick={finishMfaEnrollment} className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white">I saved the codes — continue</button>
            </div>
          )}
          {/* Logo / Header */}
          {!mfaSetupKey && mfaRecoveryCodes.length === 0 && <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <BrandMark size="md" showText={true} />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Select whether you are accessing an official institutional <strong>School Space</strong> or your independent <strong>Personal Space</strong>.
            </p>
          </div>}

          {/* Space Category Tabs */}
          {!mfaSetupKey && mfaRecoveryCodes.length === 0 && <><div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/80 rounded-2xl mb-6 border border-slate-200/70">
            <button
              type="button"
              onClick={() => setSelectedSpaceCategory('school')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedSpaceCategory === 'school'
                  ? 'bg-white text-indigo-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className={`w-4 h-4 ${selectedSpaceCategory === 'school' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="text-left">
                <span className="block leading-tight font-extrabold">School Space</span>
                <span className="text-[10px] font-normal text-slate-500 block">Institutional Portal</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSpaceCategory('personal')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedSpaceCategory === 'personal'
                  ? 'bg-white text-purple-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className={`w-4 h-4 ${selectedSpaceCategory === 'personal' ? 'text-purple-600' : 'text-slate-400'}`} />
              <div className="text-left">
                <span className="block leading-tight font-extrabold">Personal Space</span>
                <span className="text-[10px] font-normal text-slate-500 block">Independent & Family Hub</span>
              </div>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* CATEGORY 1: SCHOOL SPACE FORM                                             */}
          {/* ========================================================================= */}
          {selectedSpaceCategory === 'school' ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tenant Badge */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    CH
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950">{branding.schoolName}</h4>
                    <p className="text-[11px] text-indigo-700">
                      Tenant Code: <span className="font-mono font-bold">{branding.schoolCode}</span> · {branding.currentTerm}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Verified Portal
                </span>
              </div>

              {/* School Role Selector */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Your School Role & Responsibility
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(['Teacher', 'Principal', 'School Admin', 'Parent', 'Student'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSchoolRole(r)}
                      className={`p-2 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                        schoolRole === r
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'School Admin' ? 'Admin' : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSchoolSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {schoolRole === 'Student'
                      ? 'Student Admission Number / Email'
                      : schoolRole === 'Parent'
                      ? 'Registered Parent Email or Phone'
                      : 'School Staff ID or Institutional Email'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={schoolIdentifier}
                      onChange={(e) => setSchoolIdentifier(e.target.value)}
                      placeholder="e.g. tosin.fanimo@crownheights.edu.ng"
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 font-medium"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password / Access Code
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Password Recovery', 'Check your registered school email for reset link.')}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={schoolPassword}
                      onChange={(e) => setSchoolPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading School Environment...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter School Space as {schoolRole}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

            </motion.div>
          ) : (
            /* ========================================================================= */
            /* CATEGORY 2: PERSONAL SPACE FORM                                           */
            /* ========================================================================= */
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Personal Space Explanatory Callout */}
              <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-950">Independent Personal Workspace</h4>
                  <p className="text-[11px] text-purple-700">
                    Use your independent lesson bank, private tutoring cohorts, family learning hub, or self-study rooms without school constraints.
                  </p>
                </div>
              </div>

              {/* Personal Persona Selector */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Choose Personal Workspace Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPersonalRole('Teacher')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      personalRole === 'Teacher'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 mx-auto mb-1" />
                    <span>Teaching Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonalRole('Parent')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      personalRole === 'Parent'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4 mx-auto mb-1" />
                    <span>Family Hub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonalRole('Student')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      personalRole === 'Student'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4 mx-auto mb-1" />
                    <span>Learner Hub</span>
                  </button>
                </div>
              </div>

              {/* Personal Form */}
              <form onSubmit={handlePersonalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Personal Email Address or Phone
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={personalIdentifier}
                      onChange={(e) => setPersonalIdentifier(e.target.value)}
                      placeholder="e.g. tosin.fanimo@gmail.com"
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50 font-medium"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => showToast('Password Recovery', 'Check your personal email for reset instructions.')}
                      className="text-[11px] text-purple-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={personalPassword}
                      onChange={(e) => setPersonalPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading Personal Studio...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Personal {personalRole === 'Teacher' ? 'Teaching Studio' : personalRole === 'Parent' ? 'Family Hub' : 'Study Room'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

            </motion.div>
          )}</>}

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-tenant encrypted isolation · Role-based menu scoping</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
        <span>Powered by</span>
        <BrandMark size="sm" showText={true} />
      </div>
    </div>
  );
};
