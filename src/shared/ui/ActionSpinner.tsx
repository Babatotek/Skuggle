import React from 'react';

type ActionSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
};

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * Spiked ring spinner for in-button / active action feedback.
 */
export function ActionSpinner({
  size = 'md',
  className = '',
  label = 'Working',
}: ActionSpinnerProps) {
  return (
    <span
      className={`skuggle-spike-spinner inline-flex shrink-0 ${sizeMap[size]} ${className}`}
      role="status"
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
        <circle
          className="spike-track"
          cx="12"
          cy="12"
          r="9"
          fill="none"
          strokeWidth="2.5"
        />
        <circle
          className="spike-arc"
          cx="12"
          cy="12"
          r="9"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            className="spike-ray"
            x1="12"
            y1="2.2"
            x2="12"
            y2="4.4"
            transform={`rotate(${deg} 12 12)`}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </span>
  );
}
