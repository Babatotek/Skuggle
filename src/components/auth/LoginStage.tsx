import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  RotateCcw,
} from 'lucide-react';
import { UserRole, TenantBrandingConfig } from '../../types';
import { SchoolLogoCrest } from './SchoolLogoCrest';
import { DEFAULT_TENANT_BRANDINGS } from '../../data/tenantBranding';
import { welcomeAudio } from '../../lib/welcomeAudio';
import { authService } from '../../features/auth/authService';
import { DEMO_LOGIN_BY_ROLE, mapBackendRoleToUi } from '../../features/auth/roleMap';
import { getApiError } from '../../shared/api/client';
import type { AuthenticatedUser } from '../../app/types';
import { ActionSpinner } from '../../shared/ui';
import { appConfig } from '../../app/config';

interface LoginStageProps {
  branding: TenantBrandingConfig;
  onAuthenticate: (role: UserRole, user?: AuthenticatedUser) => void;
  onReplayWelcome: () => void;
  onSelectTenant: (tenantKey: string) => void;
}

export const LoginStage: React.FC<LoginStageProps> = ({
  branding,
  onAuthenticate,
  onReplayWelcome,
  onSelectTenant,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('school_admin');
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const DEMO_ACCOUNTS = useMemo(() => {
    if (!appConfig.enableDemo) return [];
    return [
      { role: 'school_admin' as const, title: 'School Admin', email: DEMO_LOGIN_BY_ROLE.school_admin?.email ?? '', name: 'School Admin' },
      { role: 'principal' as const, title: 'Principal', email: DEMO_LOGIN_BY_ROLE.principal?.email ?? '', name: 'Mrs. Adeyemi' },
      { role: 'teacher' as const, title: 'Teacher', email: DEMO_LOGIN_BY_ROLE.teacher?.email ?? '', name: 'Mr. Adewale' },
      { role: 'school_admin' as const, title: 'Bursar', email: 'bursar@royalgateway.edu.ng', name: 'Mrs. Okonkwo' },
      { role: 'parent' as const, title: 'Parent', email: DEMO_LOGIN_BY_ROLE.parent?.email ?? '', name: 'Mrs. Bello' },
      { role: 'student' as const, title: 'Student', email: DEMO_LOGIN_BY_ROLE.student?.email ?? '', name: 'Nathan Bello' },
      { role: 'super_admin' as const, title: 'Platform HQ', email: DEMO_LOGIN_BY_ROLE.super_admin?.email ?? '', name: 'Super Admin' },
    ].filter((acc) => acc.email);
  }, []);

  const handleSelectRolePreset = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setSelectedRole(acc.role);
    setEmailOrId(acc.email);
    setPassword(
      acc.role === 'super_admin'
        ? (DEMO_LOGIN_BY_ROLE.super_admin?.password ?? '')
        : (DEMO_LOGIN_BY_ROLE.school_admin?.password ?? ''),
    );
    setAuthError(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId) {
      setAuthError('Please enter your School Email or Student ID');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const session = await authService.login({
        email: emailOrId.trim(),
        password,
        remember: true,
      });
      const role = mapBackendRoleToUi(session.user.role);
      if (branding.audio_enabled) {
        welcomeAudio.playAuthSuccessSound();
      }
      onAuthenticate(role, session.user);
    } catch (error) {
      setAuthError(getApiError(error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-[#F8FAFC]"
    >
      <div className="w-full max-w-md flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <select
            id="select-tenant-switch"
            value={branding.tenantId}
            onChange={(e) => onSelectTenant(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer shadow-2xs"
          >
            {Object.entries(DEFAULT_TENANT_BRANDINGS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.school_name}
              </option>
            ))}
          </select>
        </div>

        <button
          id="btn-replay-welcome"
          type="button"
          onClick={onReplayWelcome}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-medium shadow-2xs transition-colors"
          title="Replay school entrance animation sequence"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Replay Entrance</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-3">
          <motion.div layoutId="shared-school-logo" className="flex justify-center">
            <SchoolLogoCrest branding={branding} size="md" />
          </motion.div>

          <motion.div layoutId="shared-school-name" className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {branding.school_name}
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Welcome back &bull; Sign in to your workspace
            </p>
          </motion.div>
        </div>

        {appConfig.enableDemo && DEMO_ACCOUNTS.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Select Portal Role</span>
              <span className="text-[10px] text-amber-700 font-medium">Local demo only</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = selectedRole === acc.role && emailOrId === acc.email;
                return (
                  <button
                    key={`${acc.title}-${acc.email}`}
                    type="button"
                    onClick={() => handleSelectRolePreset(acc)}
                    className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center border flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}
                  >
                    <span className="truncate w-full">{acc.title}</span>
                    <span className={`text-[9px] font-medium truncate w-full ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {acc.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4 pt-1">
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {authError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Email / Student / Staff ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-login-email"
                type="text"
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="e.g. name@school.edu.ng"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-sm font-extrabold shadow-md shadow-indigo-200 disabled:opacity-60"
          >
            {isLoading ? <ActionSpinner /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
