import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Sparkles, ArrowRight } from 'lucide-react';
import { TenantBrandingConfig } from '../../types';
import { SchoolLogoCrest } from './SchoolLogoCrest';
import { welcomeAudio } from '../../lib/welcomeAudio';

interface WelcomeStageProps {
  branding: TenantBrandingConfig;
  onComplete: () => void;
  onSkip?: () => void;
}

export const WelcomeStage: React.FC<WelcomeStageProps> = ({
  branding,
  onComplete,
  onSkip,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const durationSec = branding.animation_duration || 2.4;
  const primaryColor = branding.primary_color || '#155EEF';

  // Helper to convert hex to RGB components for CSS radial gradient
  const hexToRgb = (hex: string) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  };

  const primaryRgb = hexToRgb(primaryColor);

  useEffect(() => {
    // 1. Phase 1 Audio (0.0s): Logo reveal chord
    if (branding.audio_enabled && !isMuted) {
      welcomeAudio.playLogoRevealChord(primaryColor);
    }

    // 2. Phase 2 Audio (0.6s): Name reveal shimmer
    const timerNameAudio = setTimeout(() => {
      if (branding.audio_enabled && !isMuted) {
        welcomeAudio.playSchoolNameShimmer();
      }
    }, 600);

    // 3. Phase 3 Audio (1.8s): Transition sound
    const timerTransitionAudio = setTimeout(() => {
      if (branding.audio_enabled && !isMuted) {
        welcomeAudio.playLoginTransitionWhoosh();
      }
    }, Math.max(1600, durationSec * 1000 - 600));

    // Progress animation ticker
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 100 / (durationSec * 30);
      });
    }, 33);

    // 4. Complete sequence and trigger transition into login/dashboard
    const timerComplete = setTimeout(() => {
      onComplete();
    }, durationSec * 1000);

    return () => {
      clearTimeout(timerNameAudio);
      clearTimeout(timerTransitionAudio);
      clearTimeout(timerComplete);
      clearInterval(interval);
    };
  }, [durationSec, branding, isMuted, onComplete]);

  // Keyboard shortcut listener to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    welcomeAudio.setMuted(nextMuted);
  };

  // Background styling computation
  const getBackgroundStyle = () => {
    switch (branding.background_style) {
      case 'subtle_glow':
        return {
          background: `radial-gradient(circle at 50% 45%, rgba(${primaryRgb}, 0.12) 0%, rgba(${primaryRgb}, 0.04) 30%, transparent 65%), #F8FAFC`,
        };
      case 'gradient':
        return {
          background: `linear-gradient(180deg, rgba(${primaryRgb}, 0.06) 0%, rgba(248, 250, 252, 0.95) 60%, #F8FAFC 100%)`,
        };
      case 'solid':
      default:
        return {
          background: '#F8FAFC',
        };
    }
  };

  return (
    <motion.div
      id="skuggle-welcome-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.08,
        filter: 'blur(8px)',
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      }}
      onClick={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden transition-all"
      style={getBackgroundStyle()}
    >
      {/* Top Controls: Sound toggle & Skip indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
        <button
          id="btn-welcome-mute"
          type="button"
          onClick={toggleSound}
          className="p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 shadow-xs border border-slate-200/80 backdrop-blur-md transition-all"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          id="btn-welcome-skip"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 text-xs font-semibold shadow-xs border border-slate-200/80 backdrop-blur-md transition-all flex items-center gap-1"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Branded Center Group */}
      <div className="flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto space-y-6">
        
        {/* 1. School Logo: 0.0 - 0.9s Soft Zoom Sequence */}
        <motion.div
          id="welcome-school-logo"
          layoutId="shared-school-logo"
          initial={{
            opacity: 0,
            scale: 0.82,
            filter: 'blur(6px)',
          }}
          animate={{
            opacity: 1,
            scale: [0.82, 1.03, 1.0],
            filter: 'blur(0px)',
          }}
          transition={{
            duration: 0.9,
            times: [0, 0.65, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative"
        >
          {/* Subtle pulsating back glow */}
          <div
            className="absolute -inset-4 rounded-full opacity-25 blur-xl pointer-events-none animate-pulse"
            style={{ backgroundColor: primaryColor }}
          />

          <SchoolLogoCrest branding={branding} size="hero" />
        </motion.div>

        {/* 2. School Name: 0.6 - 1.2s Rise & Fade In */}
        <motion.div
          id="welcome-school-name"
          layoutId="shared-school-name"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="space-y-2"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight uppercase">
            {branding.school_name}
          </h1>

          {/* 3. Optional Tagline Motto: 1.2 - 1.8s Fade */}
          {branding.welcome_tagline && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 1.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-sm sm:text-base font-medium text-slate-600 tracking-wide"
            >
              {branding.welcome_tagline}
            </motion.p>
          )}
        </motion.div>

        {/* 4. Small Optional Text "Powered by Skuggle": 1.3 - 1.8s Fade */}
        {branding.show_skuggle_branding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 1.3,
            }}
            className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium"
          >
            <span>Powered by</span>
            <span className="font-bold text-slate-600 tracking-tight flex items-center gap-1">
              Skuggle
              <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-400" />
            </span>
          </motion.div>
        )}

        {/* 5. Subtle Loading / Transition Track Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="pt-4 w-36 sm:w-44 mx-auto"
        >
          <div className="h-1 w-full bg-slate-200/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: primaryColor,
                width: `${progress}%`,
              }}
            />
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
