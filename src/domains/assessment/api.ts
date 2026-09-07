import { useCallback, useEffect, useState } from 'react';
import { apiRequest, apiMutation, describeApiError } from '../../lib/apiClient';
import { useAcademicContext, useWorkspace } from '../../state/ApplicationStateProviders';

export const get = <T,>(path: string, signal?: AbortSignal) => apiRequest<{ data: T }>(path, { signal, suppressErrorNotification: true });
export const mutate = <T,>(path: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) => apiMutation<{ data: T }>(path, method, body);
export const queryString = (filters: Record<string, string | number>) => new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '').map(([k, v]) => [k, String(v)])).toString();
export function useAssessmentQuery<T>(path: string | null) {
  const academic = useAcademicContext();
  const workspace = useWorkspace();
  const context = `${workspace.generation}:${academic.workspaceGeneration}:${academic.session?.id}:${academic.term?.id}:${academic.campus?.id}`;
  const [reloadToken, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; data: T | null; error: string; loading: boolean }>({ key: '', data: null, error: '', loading: true });
  const key = `${context}:${path}:${reloadToken}`;
  useEffect(() => {
    const controller = new AbortController();
    setResult({ key, data: null, error: '', loading: Boolean(path) });
    if (path) void get<T>(path, controller.signal).then(r => { if (!controller.signal.aborted) setResult({ key, data: r.data, error: '', loading: false }); }).catch(e => { if (!controller.signal.aborted) setResult({ key, data: null, error: describeApiError(e), loading: false }); });
    return () => controller.abort();
  }, [key]);
  const reload = useCallback(() => setReload(n => n + 1), []);
  return { ...(result.key === key ? result : { data: null, error: '', loading: true }), reload };
}
