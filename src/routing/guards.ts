import type { ProviderStatus } from '../state/ApplicationStateProviders';
import type { CanonicalRouteDefinition, GuardDecision } from './types';

export function evaluateGuard(input: {
  route: CanonicalRouteDefinition | null;
  authenticated: boolean;
  workspaceType: 'school' | 'personal' | 'platform' | '';
  workspaceStatus: ProviderStatus;
  capabilities: readonly string[];
}): GuardDecision {
  if (!input.route) return { reason: 'unknown_route' };
  if (input.route.access.authenticated && !input.authenticated) {
    return { reason: 'unauthenticated', redirectTo: '/login', replace: true };
  }
  const requiredWorkspace = input.route.workspace;
  if (requiredWorkspace === 'school' || requiredWorkspace === 'personal' || requiredWorkspace === 'platform') {
    if (input.workspaceStatus === 'SWITCHING') return { reason: 'ok' };
    if (input.workspaceType !== requiredWorkspace) return { reason: 'workspace_mismatch' };
  }
  const needed = input.route.access.capabilities;
  if (needed?.length) {
    const mode = input.route.access.capabilitiesMode ?? 'any';
    const ok = mode === 'all' ? needed.every((key) => input.capabilities.includes(key)) : needed.some((key) => input.capabilities.includes(key));
    if (!ok) return { reason: 'capability_denied' };
  }
  return { reason: 'ok' };
}
