import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  RotateCcw,
  FastForward,
  Sparkles,
  Building2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Eye,
  EyeOff,
  Sliders,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandMark } from '../../components/BrandMark';

interface TenantWelcomeProps {
  previewOnly?: boolean;
  onContinue: () => void;
  onSkip?: () => void;
  onOpenResultChecker?: () => void;
  onBackToLanding?: () => void;
}

export const TenantWelcome: React.FC<TenantWelcomeProps> = ({
  onContinue,
  onSkip,
  onOpenResultChecker,
  onBackToLanding,
}) => {
  const { branding, showToast, currentRole } = useApp();
  
  // OS prefers-reduced-motion
  const systemReducedMotion = useReducedMotion();
  
  // Manual override toggle for reduced motion accessibility
  const [manualReducedMotion, setManualReducedMotion] = useState<boolean | null>(null);
  const isReducedMotion = manualReducedMotion !== null ? manualReducedMotion : !!systemReducedMotion;

  // Animation cycle sequence state: 'welcome' -> 'login'
  const [phase, setPhase] = useState<'welcome' | 'login'>('welcome');
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [hasSkipped, setHasSkipped] = useState<boolean>(false);

  // Form states inside the login panel
  const [authMethod, setAuthMethod] = useState<'password' | 'otp' | 'qr'>('password');
  const [identifier, setIdentifier] = useState('principal@crownheights.edu.ng');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Auto-advance timer from welcome to login panel (unless reduced motion or skipped)
  useEffect(() => {
    if (isReducedMotion || hasSkipped) {
      // In reduced motion, we can either stay on welcome or move smoothly to login
      return;
    }

    if (phase === 'welcome') {
      const timer = setTimeout(() => {
        setPhase('login');
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [phase, animationKey, isReducedMotion, hasSkipped]);

  const handleSkipAnimation = () => {
    setHasSkipped(true);
    if (phase === 'welcome') {
      setPhase('login');
      showToast('Animation Skipped', 'Directly navigated to secure school portal login.');
    } else {
      if (onSkip) {
        onSkip();
      } else {
        onContinue();
      }
    }
  };

  const handleReplay = () => {
    setHasSkipped(false);
    setPhase('welcome');
    setAnimationKey((k) => k + 1);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      showToast('Authentication Successful', `Welcome to ${branding.schoolName}!`);
      onContinue();
    }, isReducedMotion ? 200 : 700);
  };

  const handleSendOtp = () => {
    if (!identifier) return;
    setOtpSent(true);
    showToast('SMS OTP Dispatched', `Verification code sent to registered number.`);
  };

  // Primary brand theme styling
  const brandBg = branding.primaryColor || '#4F46E5';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* 1. Background Fade & Ambient Tint */}
      <motion.div
        key={`bg-${animationKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: isReducedMotion ? 0.2 : 0.8, ease: 'easeOut' }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Dynamic primary color radial glow */}
        <motion.div
          animate={
            isReducedMotion
              ? { opacity: 0.25 }
              : {
                  scale: phase === 'welcome' ? [1, 1.15, 1] : 0.9,
                  opacity: phase === 'welcome' ? [0.2, 0.32, 0.2] : 0.15,
                }
          }
          transition={{
            duration: 4,
            repeat: isReducedMotion ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-3xl"
          style={{ backgroundColor: brandBg }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </motion.div>

      {/* Top Header / Bar */}
      <div className="flex items-center justify-between z-20 max-w-5xl mx-auto w-full">
        <BrandMark size="sm" showText={true} textColor="text-white" />

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reduced Motion Toggle Button */}
          <button
            type="button"
            onClick={() => setManualReducedMotion(!isReducedMotion)}
            title={isReducedMotion ? 'Enable smooth animations' : 'Enable reduced motion for accessibility'}
            className={`text-xs px-2.5 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              isReducedMotion
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                : 'text-slate-400 hover:text-white border-white/10 hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Motion:</span>
            <span className="font-bold">{isReducedMotion ? 'Reduced' : 'Smooth'}</span>
          </button>

          {/* Replay Sequence Button */}
          <button
            type="button"
            onClick={handleReplay}
            title="Replay sequence"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Skip Sequence Button */}
          <button
            type="button"
            onClick={handleSkipAnimation}
            className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>{phase === 'welcome' ? 'Skip to Login' : 'Skip'}</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Animated Composition */}
      <div className="my-auto z-10 max-w-xl mx-auto w-full px-2">
        <AnimatePresence mode="wait">
          {phase === 'welcome' ? (
            /* ========================================================== */
            /* PHASE 1: BRANDED WELCOME & LOGO SCALE SEQUENCE             */
            /* ========================================================== */
            <motion.div
              key={`welcome-${animationKey}`}
              initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 15 }}
              animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -20 }}
              transition={{
                duration: isReducedMotion ? 0.15 : 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-center py-6"
            >
              {/* 2. Logo Scale Animation */}
              <motion.div
                initial={isReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0, rotate: -6 }}
                animate={isReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: 0 }}
                transition={
                  isReducedMotion
                    ? { duration: 0.1 }
                    : {
                        type: 'spring',
                        stiffness: 170,
                        damping: 14,
                        delay: 0.15,
                      }
                }
                className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-3xl p-1.5 mb-6 shadow-2xl flex items-center justify-center border-2 border-white/30 relative"
                style={{ backgroundColor: brandBg }}
              >
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt={`${branding.schoolName} crest`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Building2 className="w-14 h-14 text-white" />
                )}

                {/* Sparkling Verification Badge */}
                <motion.span
                  initial={isReducedMotion ? { opacity: 0 } : { scale: 0 }}
                  animate={isReducedMotion ? { opacity: 1 } : { scale: 1 }}
                  transition={{ delay: isReducedMotion ? 0 : 0.45, type: 'spring', stiffness: 220 }}
                  className="absolute -bottom-2.5 -right-2.5 p-2 bg-amber-400 text-slate-950 rounded-full shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.span>
              </motion.div>

              {/* School Name & Motto Entrance */}
              <motion.div
                initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ delay: isReducedMotion ? 0 : 0.3, duration: 0.4 }}
                className="space-y-2"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Isolated Tenant</span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {branding.schoolName}
                </h1>

                {branding.motto && (
                  <p className="text-sm sm:text-base text-indigo-200 italic font-medium max-w-sm mx-auto">
                    "{branding.motto}"
                  </p>
                )}
              </motion.div>

              {/* Action Buttons & Session Badge */}
              <motion.div
                initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
                animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ delay: isReducedMotion ? 0 : 0.5, duration: 0.4 }}
                className="mt-8 space-y-3 max-w-xs mx-auto"
              >
                <button
                  type="button"
                  onClick={() => setPhase('login')}
                  className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                  style={{ backgroundColor: brandBg }}
                >
                  <span>Sign In to School Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-xs text-slate-400 font-mono">
                  {branding.academicSession} Session · {branding.currentTerm}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            /* ========================================================== */
            /* PHASE 2: SMOOTH LOGIN PANEL TRANSITION                    */
            /* ========================================================== */
            <motion.div
              key={`login-${animationKey}`}
              initial={
                isReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 24, scale: 0.96 }
              }
              animate={
                isReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                isReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -20, scale: 0.96 }
              }
              transition={{
                duration: isReducedMotion ? 0.15 : 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 relative"
            >
              {/* Header with Compact Scaled Logo */}
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={isReducedMotion ? { opacity: 0 } : { scale: 0.8 }}
                    animate={isReducedMotion ? { opacity: 1 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 rounded-2xl p-1 shadow-xs flex items-center justify-center border border-slate-200 shrink-0"
                    style={{ backgroundColor: brandBg }}
                  >
                    {branding.logoUrl ? (
                      <img
                        src={branding.logoUrl}
                        alt={branding.schoolName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-white" />
                    )}
                  </motion.div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
                      {branding.schoolName}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>Tenant ID:</span>
                      <span className="font-mono font-bold text-indigo-700">{branding.schoolCode}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPhase('welcome')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Back to welcome overview"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Overview</span>
                </button>
              </div>

              {/* Auth Method Navigation Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMethod('password')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMethod === 'password'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email / ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('otp')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMethod === 'otp'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>SMS OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('qr')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMethod === 'qr'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Card</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {authMethod === 'password' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email, Staff ID, or Student Admission No.
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g. principal@crownheights.edu.ng"
                          className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Password / PIN
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            showToast(
                              'Recovery Dispatched',
                              'Password reset link has been dispatched to your email.'
                            )
                          }
                          className="text-[11px] font-semibold text-indigo-700 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                        />
                        <span>Remember credentials on this browser</span>
                      </label>
                    </div>
                  </>
                )}

                {authMethod === 'otp' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Verified Nigerian Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="+234 803 123 4567"
                          className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="w-full py-2.5 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 cursor-pointer"
                      >
                        Send 6-Digit SMS Security Code
                      </button>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Enter 6-Digit SMS Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="123456"
                          className="w-full text-center tracking-widest text-lg font-mono px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                        />
                      </div>
                    )}
                  </div>
                )}

                {authMethod === 'qr' && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white mx-auto flex flex-col items-center justify-center p-2 shadow-inner">
                      <QrCode className="w-8 h-8" />
                      <span className="text-[8px] font-mono mt-0.5">SCAN QR</span>
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-bold text-slate-900">Hold your physical Student or Staff Card</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Place QR credential before camera for 1-tap isolated sign-in.
                      </p>
                    </div>
                  </div>
                )}

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  style={{ backgroundColor: brandBg }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter {branding.schoolName} Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer Helper Links */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={onOpenResultChecker || onContinue}
                  className="text-indigo-700 font-semibold hover:underline"
                >
                  Student Result Checker PIN
                </button>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit SSL</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Powered by Skuggle Footer */}
      <div className="text-center z-10 text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <span>Powered by</span>
        <span className="font-extrabold text-amber-400 tracking-tight">Skuggle</span>
        <span>· Safe & Isolated School Tenant Infrastructure</span>
      </div>
    </div>
  );
};
