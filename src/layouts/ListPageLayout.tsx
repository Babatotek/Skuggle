import React from 'react';
import { PageLayout, type PageLayoutProps } from './PageLayout';

export interface ListPageLayoutProps extends Omit<PageLayoutProps, 'children'> {
  metrics?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export const ListPageLayout: React.FC<ListPageLayoutProps> = ({ metrics, toolbar, children, ...page }) => (
  <PageLayout {...page}>
    {metrics}
    <section className="overflow-hidden rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)]" aria-label={`${page.title} list`}>
      {toolbar}
      {children}
    </section>
  </PageLayout>
);
