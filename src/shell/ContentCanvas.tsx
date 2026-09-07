import React from 'react';

export type CanvasWidth = 'operational' | 'contained' | 'full';

export const ContentCanvas: React.FC<{ width?: CanvasWidth; children: React.ReactNode; className?: string }> = ({
  width = 'operational',
  children,
  className = '',
}) => {
  const max = width === 'full' ? 'max-w-none' : width === 'contained' ? 'max-w-3xl' : 'max-w-[90rem]';
  return (
    <div className={`w-full ${max} mx-auto px-[var(--space-4)] sm:px-[var(--space-6)] lg:px-[var(--space-8)] py-[var(--space-section)] ${className}`}>
      {children}
    </div>
  );
};
