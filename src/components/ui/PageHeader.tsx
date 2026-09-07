import React from 'react';
import { Breadcrumb, type BreadcrumbItem } from './Navigation';

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  metadata?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  badge,
  breadcrumbs,
  actions,
  primaryAction,
  secondaryActions,
  metadata,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-3 pb-5 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-display">{title}</h1>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {(description ?? subtitle) && (
            <div className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{description ?? subtitle}</div>
          )}
          {metadata && <div className="mt-2 text-xs text-[var(--color-text-muted)]">{metadata}</div>}
        </div>

        {(actions || secondaryActions || primaryAction) && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{secondaryActions}{actions}{primaryAction}</div>}
      </div>
    </div>
  );
};
