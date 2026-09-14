import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { isApplicationEnvironmentPath } from '../lib/bootSurface';
import { RouteLoading } from '../routing/RouteSurfaces';

interface PublicBootLoaderProps {
  message?: string;
}

/**
 * Branded full-screen boot for landing, login, registration, and other public sessions.
 * Intentionally not used inside the authenticated application environment.
 */
export const PublicBootLoader: React.FC<PublicBootLoaderProps> = ({
  message = 'Getting Skuggle ready…',
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="fixed inset-0 z-[var(--z-critical)] flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FFFCF7]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 35%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(ellipse 70% 50% at 70% 80%, rgba(245,158,11,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 20% 70%, rgba(139,92,246,0.1), transparent 50%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl"
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          className="relative mb-6 flex h-44 w-44 items-end justify-center sm:h-52 sm:w-52"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.55, y: 36 }}
          animate={
            reduceMotion
              ? { opacity: 1, scale: 1, y: 0 }
              : {
                  opacity: 1,
                  scale: [0.55, 1.12, 0.96, 1.04, 1],
                  y: [36, -18, 8, -6, 0],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.2 }
              : { duration: 1.05, times: [0, 0.35, 0.55, 0.78, 1], ease: [0.22, 1, 0.36, 1] }
          }
        >
          <motion.div
            className="relative h-full w-full"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -14, 0],
                    scale: [1, 1.06, 1],
                    rotate: [0, -2.5, 2.5, 0],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    delay: 1.05,
                    duration: 1.35,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          >
            <img
              src="/skuggleAiHero.png"
              alt=""
              width={208}
              height={208}
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-contain drop-shadow-[0_18px_40px_rgba(67,56,202,0.28)]"
              draggable={false}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.45, duration: 0.4 }}
        >
          <BrandMark size="lg" showText />
        </motion.div>

        <motion.p
          className="mt-4 max-w-xs font-display text-sm font-semibold tracking-tight text-slate-600"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.65, duration: 0.35 }}
        >
          {message}
        </motion.p>

        <motion.div
          className="mt-5 flex items-center gap-1.5"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.75 }}
          aria-hidden="true"
        >
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="h-2 w-2 rounded-full bg-indigo-500"
              animate={
                reduceMotion
                  ? { opacity: 0.55 }
                  : { opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85], y: [0, -4, 0] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 0.9, repeat: Infinity, delay: index * 0.16, ease: 'easeInOut' }
              }
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

/** Suspense fallback: mascot on public/auth surfaces; skeletons only in the app shell. */
export const BootSuspenseFallback: React.FC = () => {
  const { pathname } = useLocation();
  if (isApplicationEnvironmentPath(pathname)) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] p-6">
        <RouteLoading />
      </div>
    );
  }
  return <PublicBootLoader />;
};

export { isApplicationEnvironmentPath } from '../lib/bootSurface';
