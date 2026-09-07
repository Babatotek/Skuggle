import type { NavigateFunction } from 'react-router-dom';
import { buildRoute, routeFromLegacyNavId } from './builders';
import { reportRoutingSignal } from './telemetry';

let navigateRef: NavigateFunction | null = null;

export function bindRouterNavigate(navigate: NavigateFunction | null) {
  navigateRef = navigate;
}

export function routerNavigate(to: string, options?: { replace?: boolean }): void {
  if (navigateRef) {
    navigateRef(to, { replace: options?.replace, preventScrollReset: to.includes('?') && !options?.replace });
    return;
  }
  reportRoutingSignal('canonical_resolution_failure', { reason: 'navigator_unbound' });
}

export function navigateLegacyTab(tabId: string, mode: 'push' | 'replace' = 'push'): void {
  const route = routeFromLegacyNavId(tabId);
  if (!route) {
    reportRoutingSignal('unknown_route', { source: 'legacy_tab', tab: tabId.slice(0, 40) });
    routerNavigate('/not-found', { replace: true });
    return;
  }
  routerNavigate(buildRoute(route.id), { replace: mode === 'replace' });
}

export function hasBoundNavigator(): boolean {
  return navigateRef !== null;
}
