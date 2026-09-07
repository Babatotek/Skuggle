export interface QueryScope { workspaceType: string; workspaceId: string; tenantId?: string; sessionId?: string; termId?: string }
export type QueryKey = readonly [string, string, string, string, string, string, Readonly<Record<string, unknown>>];

export function buildQueryKey(scope: QueryScope, resource: string, parameters: Readonly<Record<string, unknown>> = {}): QueryKey {
  if (!scope.workspaceType || !scope.workspaceId) throw new Error('Workspace identity is required for server-state query keys.');
  if (scope.workspaceType === 'school' && !scope.tenantId) throw new Error('Tenant identity is required for school server-state query keys.');
  return [scope.workspaceType, scope.workspaceId, scope.tenantId ?? '-', scope.sessionId ?? '-', scope.termId ?? '-', resource, parameters] as const;
}

/** Commits only while the request still belongs to the active workspace generation. */
export async function commitLatest<T>(request: Promise<T>, requestGeneration: number, currentGeneration: () => number, commit: (value: T) => void): Promise<boolean> {
  const value = await request;
  if (requestGeneration !== currentGeneration()) return false;
  commit(value);
  return true;
}
