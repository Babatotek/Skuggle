import { isPublicPath as isCanonicalPublicPath } from '../routing/publicPath';
import { navigateLegacyTab, routerNavigate } from '../routing/historyCompatibility';
import { buildRoute } from '../routing/builders';

const PUBLIC_SEGMENTS = new Set(['reset-password', 'verify-email', 'join', 'login', 'welcome', 'register', 'results', 'not-found']);

function tenantBase(pathname: string): string {
  for (const prefix of ['/s/', '/school/', '/t/'] as const) {
    if (!pathname.startsWith(prefix)) continue;
    const slug = pathname.slice(prefix.length).split('/').filter(Boolean)[0];
    if (slug) return `${prefix}${slug}`;
  }
  return '';
}

export function isPublicPath(pathname: string = typeof window === 'undefined' ? '/' : window.location.pathname): boolean {
  try {
    return isCanonicalPublicPath(pathname);
  } catch {
    const first = (pathname.replace(/\/+$/, '') || '/').split('/').filter(Boolean)[0];
    return Boolean(first && PUBLIC_SEGMENTS.has(first));
  }
}

/** @deprecated Wave 7 — use matchRoute. Removal: Wave 24. */
export function readWorkspaceTab(pathname: string = typeof window === 'undefined' ? '/' : window.location.pathname): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'app') return parts[1] || 'home';
  if (parts.includes('app')) return parts[parts.indexOf('app') + 1] || 'home';
  return 'home';
}

/** @deprecated Wave 7 — use buildRoute(). Removal: Wave 24. */
export function workspaceUrl(tabId: string, location: Location = window.location): string {
  const base = tenantBase(location.pathname);
  const path = tabId === 'home' ? `${base}/app` : `${base}/app/${tabId}`;
  return `${path || '/app'}${location.search}`;
}

/** Compatibility adapter: leftover tab writes go through the canonical router. */
export function writeWorkspaceTab(tabId: string, mode: 'push' | 'replace' = 'push') {
  if (isPublicPath()) return;
  navigateLegacyTab(tabId, mode);
}

export function clearWorkspacePath() {
  routerNavigate(buildRoute('public.landing'), { replace: true });
}
