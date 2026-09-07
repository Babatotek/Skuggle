import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface PageLayoutCrumb { label: string; href?: string }

export interface PageLayoutProps {
  breadcrumb?: PageLayoutCrumb[];
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  nav?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ breadcrumb = [], title, description, action, nav, children, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    <header>
      {breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 hidden md:block">
          <ol className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            {breadcrumb.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-4 w-4 text-[var(--color-text-disabled)]" aria-hidden="true" />}
                {item.href ? <Link className="text-[var(--color-action-primary)] hover:underline" to={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h1>
          {description && <p className="mt-1 text-base text-[var(--color-text-secondary)]">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {nav && <div className="mt-4">{nav}</div>}
    </header>
    {children}
  </div>
);
