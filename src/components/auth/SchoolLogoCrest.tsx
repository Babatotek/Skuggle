import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Award,
  Sparkles,
  Shield,
  Compass,
  Atom,
  Flame,
  Crown,
  Bookmark
} from 'lucide-react';
import { TenantBrandingConfig } from '../../types';

interface SchoolLogoCrestProps {
  branding: TenantBrandingConfig;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  isAnimated?: boolean;
}

export const SchoolLogoCrest: React.FC<SchoolLogoCrestProps> = ({
  branding,
  size = 'hero',
  className = '',
  isAnimated = true,
}) => {
  // Sizing definitions adhering strictly to user guidelines:
  // Desktop: 100-130px, Tablet: 90-110px, Mobile: 72-96px
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-20 h-20 text-base',
    hero: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-lg',
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    hero: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16',
  }[size];

  const primaryColor = branding.primary_color || '#155EEF';
  const secondaryColor = branding.secondary_color || '#7F56D9';

  // Dynamic Heraldic Crest representation based on school identifier
  const renderCrestIcon = () => {
    switch (branding.crestIcon) {
      case 'shield-book':
        return <BookOpen className={`${iconSizes} text-white drop-shadow-md`} />;
      case 'crown-torch':
        return <Crown className={`${iconSizes} text-white drop-shadow-md`} />;
      case 'cross-book':
        return <GraduationCap className={`${iconSizes} text-white drop-shadow-md`} />;
      case 'atom-spark':
        return <Atom className={`${iconSizes} text-white drop-shadow-md`} />;
      case 'mountain-star':
        return <Award className={`${iconSizes} text-white drop-shadow-md`} />;
      default:
        return <GraduationCap className={`${iconSizes} text-white drop-shadow-md`} />;
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      {/* Outer subtle halo ring */}
      <div
        className="absolute inset-0 rounded-3xl opacity-20 blur-md pointer-events-none transform scale-110"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Main Crest Shield Container */}
      <div
        className={`relative ${sizeClasses} rounded-2xl sm:rounded-3xl shadow-xl flex flex-col items-center justify-center p-3 text-white transition-transform overflow-hidden border border-white/30`}
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        {/* Subtle geometric heraldic pattern in background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

        {/* Diagonal light sheen reflection */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/15 rounded-full blur-lg pointer-events-none" />

        {/* Center Emblem Icon */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {renderCrestIcon()}

          {/* School Monogram Badge */}
          {size === 'hero' && branding.logo_badge_text && (
            <span className="mt-1 text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white/95 border border-white/20">
              {branding.logo_badge_text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
