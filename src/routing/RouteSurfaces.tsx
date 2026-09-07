import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button, EmptyState, PageHeader } from '../components/ui';
import { buildRoute } from './builders';
import { routerNavigate } from './historyCompatibility';

export const RouteNotFound: React.FC<{ homeHref?: string }> = ({ homeHref }) => (
  <div className="max-w-2xl mx-auto py-10">
    <PageHeader title="Page not found" description="This address is not a Skuggle page. Your workspace was not changed." />
    <EmptyState
      icon={<FileQuestion className="w-6 h-6" />}
      title="We could not find that page"
      description="Check the link or return to a workspace home. Unknown addresses never open Dashboard automatically."
      action={{
        label: 'Go to Home',
        onClick: () => routerNavigate(homeHref || buildRoute('public.landing')),
      }}
    />
  </div>
);

export const RouteAccessDenied: React.FC<{ onHome?: () => void }> = ({ onHome }) => (
  <div className="max-w-2xl mx-auto py-10">
    <PageHeader title="Access unavailable" description="This page is not exposed for the current workspace or capabilities." />
    <EmptyState
      icon={<FileQuestion className="w-6 h-6" />}
      title="You cannot open this page here"
      description="Capability and workspace checks are for display only. The API remains the authorization authority."
      action={onHome ? { label: 'Back to Home', onClick: onHome } : undefined}
    />
  </div>
);

export const RoutePlaceholder: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="max-w-2xl mx-auto py-10">
    <PageHeader title={title} description={description} />
    <EmptyState title="Not available in this wave" description={description} />
    <p className="sr-only">Placeholder route. Owner: Frontend Platform. Removal wave: when the owning domain ships.</p>
  </div>
);

export const RouteLoading: React.FC = () => (
  <div className="space-y-4 animate-pulse p-1" role="status" aria-label="Loading page">
    <div className="h-10 w-48 rounded-xl bg-slate-200" />
    <div className="h-28 rounded-2xl bg-slate-100 border border-slate-200" />
    <div className="h-48 rounded-2xl bg-slate-100 border border-slate-200" />
  </div>
);
