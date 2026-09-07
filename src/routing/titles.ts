import type { CanonicalRouteDefinition } from './types';

export function documentTitleFor(route: CanonicalRouteDefinition, workspaceName?: string): string {
  if (route.classification === 'public' || route.workspace === 'auth') {
    return route.id === 'public.landing' ? 'Skuggle' : `${route.title} | Skuggle`;
  }
  if (route.workspace === 'platform') {
    return `${route.title} | Skuggle`;
  }
  const school = workspaceName && route.workspace === 'school' ? workspaceName : null;
  if (school) return `${route.title} | ${school} | Skuggle`;
  if (route.workspace === 'personal') return `${route.title} | Personal | Skuggle`;
  return `${route.title} | Skuggle`;
}

export function breadcrumbsFor(route: CanonicalRouteDefinition, byId: (id: string) => CanonicalRouteDefinition): Array<{ id: string; label: string }> {
  const chain: Array<{ id: string; label: string }> = [];
  let current: CanonicalRouteDefinition | undefined = route;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift({ id: current.id, label: current.breadcrumb.label });
    current = current.breadcrumb.parentId ? byId(current.breadcrumb.parentId) : undefined;
  }
  return chain;
}
