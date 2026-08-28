import React from 'react';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  variant?: 'skuggle' | 'tenant';
  tenantName?: string;
  tenantLogoUrl?: string;
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  variant = 'skuggle',
  tenantName,
  tenantLogoUrl,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', tenantLogo: 'w-6 h-6' },
    md: { icon: 'w-9 h-9', text: 'text-xl', tenantLogo: 'w-8 h-8' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', tenantLogo: 'w-11 h-11' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl', tenantLogo: 'w-14 h-14' },
  };

  if (variant === 'tenant' && tenantName) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {tenantLogoUrl ? (
          <img
            src={tenantLogoUrl}
            alt={`${tenantName} crest`}
            referrerPolicy="no-referrer"
            className={`${sizeMap[size].tenantLogo} rounded-lg object-cover border border-slate-200 shadow-sm`}
          />
        ) : (
          <div className={`${sizeMap[size].tenantLogo} rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm`}>
            {tenantName.slice(0, 2).toUpperCase()}
          </div>
        )}
        {showText && (
          <div className="flex flex-col">
            <span className={`font-display font-bold leading-tight ${textColor} ${sizeMap[size].text}`}>
              {tenantName}
            </span>
            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
              <span>Powered by</span>
              <span className="font-bold text-indigo-600">Skuggle</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  // Official Skuggle Vector Ribbon Logo
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`${sizeMap[size].icon} relative flex-shrink-0 flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Main S-shaped educational ribbon mark with purple/indigo gradients */}
          <path
            d="M75 22C68 12 52 10 38 16C24 22 14 34 16 48C18 60 28 66 40 70C54 74 68 78 66 88C64 96 52 98 40 96C28 94 18 86 14 78"
            stroke="url(#skuggleGrad)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Top folded educational book ribbon loop */}
          <path
            d="M32 18C44 12 66 12 76 25C84 35 78 48 64 54C50 60 36 64 26 74"
            stroke="url(#skuggleGrad2)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Vibrant Golden Smile Curve */}
          <path
            d="M30 46C38 56 60 56 68 46"
            stroke="#F59E0B"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="skuggleGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4338CA" />
              <stop offset="0.5" stopColor="#6366F1" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="skuggleGrad2" x1="20" y1="15" x2="85" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#312E81" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline tracking-tight">
          <span className={`font-display font-extrabold ${textColor} ${sizeMap[size].text}`}>
            Sk
          </span>
          <span className={`font-display font-extrabold text-amber-500 ${sizeMap[size].text}`}>
            u
          </span>
          <span className={`font-display font-extrabold ${textColor} ${sizeMap[size].text}`}>
            ggle
          </span>
        </div>
      )}
    </div>
  );
};
