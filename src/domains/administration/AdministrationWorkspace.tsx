import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Building2, BookOpen, Users, Files, Workflow, Bell, Plug, ShieldCheck, Settings } from 'lucide-react';
import { useAccess } from '../../state/ApplicationStateProviders';
import { ADMINISTRATION_CAPABILITIES, ADMINISTRATION_DOMAINS } from '../../routing/administration';
import { buildRoute, routeById } from '../../routing/builders';
import { hasNavigationRouteAccess } from '../../routing/primaryNavigation';
import type { CanonicalRouteDefinition } from '../../routing/types';
import { PageLayout } from '../../layouts/PageLayout';
import { LegacyPageAdapter } from '../../routing/LegacyPageAdapter';
import { RouteLoading } from '../../routing/RouteSurfaces';

const icons = [Building2, BookOpen, Users, Files, Workflow, Bell, Plug, ShieldCheck, Settings];
export default function AdministrationWorkspace({ route, onNavigateTab }: { route: CanonicalRouteDefinition; onNavigateTab: (id: string) => void }) {
  const { capabilities } = useAccess();
  const [search, setSearch] = useState('');
  const domain = ADMINISTRATION_DOMAINS.find(d => d.key === route.pageContext?.adminDomain);
  const capability = ADMINISTRATION_CAPABILITIES.find(c => `school.administration.${c.id}` === route.id);
  const isLanding = route.pageKey === 'administration';
  const allowed = ADMINISTRATION_CAPABILITIES.filter(c => hasNavigationRouteAccess(routeById(`school.administration.${c.id}`), capabilities));
  const breadcrumb = [
    { label: 'Administration', href: route.id === 'school.administration' ? undefined : buildRoute('school.administration') },
    ...(domain ? [{ label: domain.label, href: capability ? buildRoute(`school.administration.${domain.key}`) : undefined }] : []),
    ...(capability ? [{ label: capability.label }] : []),
  ];
  const results = allowed.filter(c => (!domain || c.domain === domain.key) && `${c.label} ${c.description}`.toLowerCase().includes(search.toLowerCase()));
  return <div data-administration-workspace>
    <div className="mb-4 md:hidden">
      {domain && <Link className="inline-flex items-center gap-2 text-sm text-[var(--color-action-primary)]" to={buildRoute(capability ? `school.administration.${domain.key}` : 'school.administration')}><ArrowLeft className="h-4 w-4" />{capability ? domain.label : 'Administration'}</Link>}
    </div>
    <PageLayout breadcrumb={breadcrumb} title={route.title} description={capability?.description ?? domain?.description ?? 'School configuration and administrative controls'}>
      {isLanding ? <>
        <label className="block max-w-xl text-sm font-medium text-[var(--color-text-secondary)]">Search Administration
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={domain ? `Search ${domain.label}` : 'Find a setting or capability'} className="mt-2 block h-11 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 focus-visible:outline-2 focus-visible:outline-indigo-600" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {!domain && !search ? ADMINISTRATION_DOMAINS.filter(d => allowed.some(c => c.domain === d.key)).map(d => {
            const Icon = icons[ADMINISTRATION_DOMAINS.indexOf(d)];
            return <Link key={d.key} to={buildRoute(`school.administration.${d.key}`)} className="group rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-5 transition-colors hover:border-indigo-400 focus-visible:outline-2 focus-visible:outline-indigo-600">
              <div className="mb-4 flex items-center justify-between"><Icon className="h-6 w-6 text-[var(--color-action-primary)]" /><ArrowUpRight className="h-4 w-4 text-[var(--color-text-secondary)]" /></div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{d.label}</h2><p className="mt-2 text-sm text-[var(--color-text-secondary)]">{d.description}</p>
            </Link>;
          }) : results.map(c => <Link key={c.id} to={buildRoute(`school.administration.${c.id}`)} className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-5 hover:border-indigo-400 focus-visible:outline-2 focus-visible:outline-indigo-600">
            {!domain && <p className="mb-2 text-xs text-[var(--color-text-secondary)]">{ADMINISTRATION_DOMAINS.find(d => d.key === c.domain)?.label}</p>}
            <h2 className="font-semibold text-[var(--color-text-primary)]">{c.label}</h2><p className="mt-2 text-sm text-[var(--color-text-secondary)]">{c.description}</p>
          </Link>)}
        </div>
        {(domain || search) && results.length === 0 && <p role="status" className="py-8 text-[var(--color-text-secondary)]">No accessible settings match this search.</p>}
      </> : <Suspense fallback={<RouteLoading />}><LegacyPageAdapter key={route.id} route={route} params={{}} onNavigateTab={onNavigateTab} /></Suspense>}
    </PageLayout>
  </div>;
}
