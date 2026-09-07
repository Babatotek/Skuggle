import { matchPath } from 'react-router-dom';
import { LEGACY_ALIASES } from './aliases';
import { buildSearchString, encodePathParam } from './params';
import { normalizePathname, splitPath } from './normalize';
import {
  CANONICAL_ROUTES,
  LEGACY_NAV_TO_ROUTE_ID,
  RESERVED_SCHOOL_SEGMENTS,
  ROUTES_BY_ID,
  WORKSPACE_DEFAULT_ROUTE_ID,
} from './registry';
import type { CanonicalRouteDefinition, LegacyAliasDefinition, WorkspaceKind } from './types';

export class UnknownRouteIdError extends Error {
  constructor(id: string) {
    super(`Unknown canonical route id: ${id}`);
    this.name = 'UnknownRouteIdError';
  }
}

export function routeById(id: string): CanonicalRouteDefinition {
  const route = ROUTES_BY_ID.get(id);
  if (!route) throw new UnknownRouteIdError(id);
  return route;
}

export function workspaceDefaultRoute(workspace: Extract<WorkspaceKind, 'school' | 'personal' | 'platform'>): CanonicalRouteDefinition {
  return routeById(WORKSPACE_DEFAULT_ROUTE_ID[workspace]);
}

export function buildRoute(
  id: string,
  params: Readonly<Record<string, string>> = {},
  query: Readonly<Record<string, string | undefined>> = {},
): string {
  const route = routeById(id);
  let path = route.path;
  for (const definition of route.params ?? []) {
    const value = params[definition.name];
    if (!value) {
      if (definition.optional) {
        path = path.replace(`/:${definition.name}?`, '').replace(`/:${definition.name}`, '');
        continue;
      }
      throw new Error(`Missing route param ${definition.name} for ${id}`);
    }
    path = path.replace(`:${definition.name}`, encodePathParam(value));
  }
  return `${path}${buildSearchString(route, query)}`;
}

export interface MatchedRoute {
  route: CanonicalRouteDefinition;
  params: Record<string, string>;
}

export function matchCanonicalPath(pathname: string): MatchedRoute | null {
  const normalized = normalizePathname(pathname);
  for (const route of CANONICAL_ROUTES) {
    const matched = matchPath({ path: route.path, end: true }, normalized);
    if (matched) return { route, params: matched.params as Record<string, string> };
  }
  return null;
}

export interface MatchedAlias {
  alias: LegacyAliasDefinition;
  canonical: CanonicalRouteDefinition;
  params: Record<string, string>;
  href: string;
}

function resolveTabTarget(tab: string | undefined): CanonicalRouteDefinition | null {
  if (!tab) return routeById('school.home');
  const id = LEGACY_NAV_TO_ROUTE_ID.get(tab);
  return id ? routeById(id) : null;
}

export function matchLegacyAlias(pathname: string): MatchedAlias | null {
  const normalized = normalizePathname(pathname);
  const parts = splitPath(normalized);

  if (parts[0] === 'school' && parts[1] && !RESERVED_SCHOOL_SEGMENTS.has(parts[1]) && parts[2] !== 'app') {
    const alias = LEGACY_ALIASES.find((item) => item.id === 'legacy.tenant.school');
    if (alias) {
      return {
        alias,
        canonical: routeById(alias.canonicalId),
        params: { schoolKey: parts[1] },
        href: `${buildRoute(alias.canonicalId)}?school=${encodeURIComponent(parts[1])}`,
      };
    }
  }

  for (const alias of LEGACY_ALIASES) {
    if (alias.id === 'legacy.tenant.school') continue;
    const matched = matchPath({ path: alias.oldPath, end: true }, normalized);
    if (!matched) continue;
    const params = { ...(matched.params as Record<string, string>) };
    let canonical = routeById(alias.canonicalId);
    if (params.tab) {
      const fromTab = resolveTabTarget(params.tab);
      if (!fromTab) return null;
      canonical = fromTab;
    }
    const query: Record<string, string> = {};
    if (params.schoolKey) query.school = params.schoolKey;
    const href = Object.keys(query).length
      ? `${buildRoute(canonical.id)}${buildRoute(canonical.id).includes('?') ? '&' : '?'}${new URLSearchParams(query).toString()}`
      : buildRoute(canonical.id);
    return { alias, canonical, params, href };
  }
  return null;
}

export function matchRoute(pathname: string): MatchedRoute | MatchedAlias | { unknown: true } {
  const canonical = matchCanonicalPath(pathname);
  if (canonical) return canonical;
  const alias = matchLegacyAlias(pathname);
  if (alias) return alias;
  return { unknown: true };
}

export function routeFromLegacyNavId(navId: string): CanonicalRouteDefinition | null {
  const id = LEGACY_NAV_TO_ROUTE_ID.get(navId);
  return id ? routeById(id) : null;
}

export function legacyNavIdForRoute(route: CanonicalRouteDefinition): string {
  return route.legacyNavIds?.[0] ?? (route.workspace === 'personal' ? 'home' : route.workspace === 'platform' ? 'platform' : 'home');
}

export function assertKnownRouteId(id: string): void {
  routeById(id);
}
