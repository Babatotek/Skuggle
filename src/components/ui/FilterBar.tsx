import React from 'react';
export interface FilterBarProps { children: React.ReactNode; search?: React.ReactNode; actions?: React.ReactNode; resultsLabel?: React.ReactNode; className?: string; }
export const FilterBar: React.FC<FilterBarProps> = ({ children, search, actions, resultsLabel, className = '' }) => (
  <section aria-label="Filters" className={`flex flex-col gap-3 border-b border-[var(--color-border-default)] bg-[var(--color-surface-muted)] p-4 lg:flex-row lg:items-center lg:justify-between ${className}`}>
    <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
    <div className="flex flex-wrap items-center gap-2">{search}{actions}</div>
    {resultsLabel && <div aria-live="polite" className="sr-only">{resultsLabel}</div>}
  </section>
);

