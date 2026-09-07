import React from 'react';

export const SkipLink: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[var(--z-critical)] ds-focus-ring rounded-[var(--radius-control)] bg-[var(--color-surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-overlay)]"
  >
    Skip to main content
  </a>
);
