import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Building2,
  User,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Users,
  BookOpen,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface WorkspaceChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersonal: () => void;
  onSelectSchool: () => void;
}

export const WorkspaceChooserModal: React.FC<WorkspaceChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectPersonal,
  onSelectSchool,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="chooser-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.28 } }}
            exit={{ opacity: 0, transition: { duration: 0.22 } }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
            <motion.div
              key="chooser-modal"
              initial={{ opacity: 0, y: 48, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: 'easeOut' } }}
              exit={{ opacity: 0, y: 32, scale: 0.96, transition: { duration: 0.24 } }}
              role="dialog"
              aria-modal="true"
              aria-label="Choose your workspace type"
              className="pointer-events-auto w-full max-w-2xl"
            >
              {/* Deep dark glass panel */}
              <div
                className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                style={{ background: 'linear-gradient(145deg, #0f0c1a 0%, #13102a 40%, #0d1525 100%)' }}
              >
                {/* Ambient glows */}
                <div
                  className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-20 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
                />
                <div
                  className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-15 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }}
                />

                {/* Top shimmer line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(99,102,241,0.8), rgba(139,92,246,0.6), transparent)' }}
                />

                {/* Close button */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close workspace chooser"
                  className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="px-8 pt-8 pb-6 text-center relative z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.08, duration: 0.4 } }}
                    className="flex items-center justify-center gap-2 mb-5"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-display font-extrabold text-white text-xl tracking-tight">Skuggle</span>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.14, duration: 0.4 } }}
                    className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight mb-2"
                  >
                    Where do you want to learn?
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.38 } }}
                    className="text-sm text-white/55 max-w-sm mx-auto leading-relaxed"
                  >
                    Choose your space to sign in or create a free account.
                  </motion.p>
                </div>

                {/* Cards */}
                <div className="px-6 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">

                  {/* ── Personal Space Card ── */}
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.3, duration: 0.44, ease: 'easeOut' } }}
                    onClick={onSelectPersonal}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                    className="group relative rounded-2xl p-6 text-left overflow-hidden border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    style={{
                      background: 'linear-gradient(145deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.08) 100%)',
                      borderColor: 'rgba(139,92,246,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)';
                      e.currentTarget.style.background = 'linear-gradient(145deg, rgba(139,92,246,0.22) 0%, rgba(109,40,217,0.14) 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)';
                      e.currentTarget.style.background = 'linear-gradient(145deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.08) 100%)';
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ boxShadow: 'inset 0 0 32px rgba(139,92,246,0.12)' }}
                    />

                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))' }}
                    >
                      <User className="w-6 h-6 text-violet-300" />
                    </div>

                    <h3 className="font-display font-bold text-lg text-white mb-1 leading-tight">
                      Personal Space
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed mb-5">
                      Your independent workspace for personal study, home teaching, and family learning — free forever.
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {[
                        { icon: GraduationCap, label: 'Teaching Studio' },
                        { icon: Users, label: 'Family Hub' },
                        { icon: BookOpen, label: 'Study Room' },
                      ].map(({ icon: Icon, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background: 'rgba(139,92,246,0.18)', color: 'rgba(196,181,253,0.9)' }}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {label}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-bold text-violet-300 group-hover:text-violet-200 transition-colors">
                      <span>Get started</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </motion.button>

                  {/* ── School Space Card ── */}
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.42, duration: 0.44, ease: 'easeOut' } }}
                    onClick={onSelectSchool}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                    className="group relative rounded-2xl p-6 text-left overflow-hidden border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    style={{
                      background: 'linear-gradient(145deg, rgba(79,70,229,0.15) 0%, rgba(55,48,163,0.08) 100%)',
                      borderColor: 'rgba(99,102,241,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
                      e.currentTarget.style.background = 'linear-gradient(145deg, rgba(79,70,229,0.22) 0%, rgba(55,48,163,0.14) 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
                      e.currentTarget.style.background = 'linear-gradient(145deg, rgba(79,70,229,0.15) 0%, rgba(55,48,163,0.08) 100%)';
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ boxShadow: 'inset 0 0 32px rgba(79,70,229,0.12)' }}
                    />

                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(55,48,163,0.2))' }}
                    >
                      <Building2 className="w-6 h-6 text-indigo-300" />
                    </div>

                    <h3 className="font-display font-bold text-lg text-white mb-1 leading-tight">
                      School Space
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed mb-5">
                      Access or register your institution's portal — students, staff, parents, attendance, CBT and more.
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {[
                        { icon: ShieldCheck, label: 'Verified Portal' },
                        { icon: Zap, label: 'CBT Exams' },
                        { icon: Users, label: 'All Roles' },
                      ].map(({ icon: Icon, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background: 'rgba(79,70,229,0.18)', color: 'rgba(165,180,252,0.9)' }}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {label}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-300 group-hover:text-indigo-200 transition-colors">
                      <span>Enter school portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </motion.button>
                </div>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.55, duration: 0.4 } }}
                  className="px-8 pb-6 text-center relative z-10"
                >
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    One Skuggle identity works across all spaces. Already have an account?{' '}
                    <button
                      type="button"
                      onClick={onSelectPersonal}
                      className="text-violet-400 hover:text-violet-300 font-semibold transition-colors underline-offset-2 hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
