import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/ui/Navigation';
import { PageHeader } from '../components/ui/PageHeader';
import { ContentCanvas, type CanvasWidth } from './ContentCanvas';

export interface PageFrameCrumb {
  label: string;
  href?: string;
}

export interface PageFrameProps {
  title?: string;
  description?: React.ReactNode;
  breadcrumbs?: PageFrameCrumb[];
  actions?: React.ReactNode;
  contextNav?: React.ReactNode;
  width?: CanvasWidth;
  showHeader?: boolean;
  children: React.ReactNode;
}

export const PageFrame: React.FC<PageFrameProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  contextNav,
  width = 'operational',
  showHeader = false,
  children,
}) => {
  const crumbItems = breadcrumbs?.map((item) => ({
    label: item.label,
    href: item.href,
  }));
  const showCrumbs = Boolean(breadcrumbs && breadcrumbs.length > 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {contextNav}
      <ContentCanvas width={width}>
        {showCrumbs && crumbItems ? (
          <div className="mb-3 hidden md:block">
            <Breadcrumb
              items={crumbItems.map((item) => ({
                label: item.href ? <Link to={item.href}>{item.label}</Link> : item.label,
              }))}
            />
          </div>
        ) : null}
        {showHeader && title ? <PageHeader title={title} description={description} actions={actions} /> : null}
        {children}
      </ContentCanvas>
    </div>
  );
};
