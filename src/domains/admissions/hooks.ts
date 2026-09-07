import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdmissionsRequestState } from './types';

export interface AdmissionsQuery<T> {
  data: T | null;
  state: AdmissionsRequestState;
  error: string | null;
  reload: () => void;
}

export function useAdmissionsQuery<T>(
  request: (signal: AbortSignal) => Promise<{ data: T }>,
  dependencyKey: string,
): AdmissionsQuery<T> {
  const requestRef = useRef(request);
  requestRef.current = request;
  const generation = useRef(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<AdmissionsRequestState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const currentGeneration = ++generation.current;
    setState('loading');
    setError(null);
    void requestRef.current(controller.signal)
      .then((response) => {
        if (controller.signal.aborted || generation.current !== currentGeneration) return;
        setData(response.data);
        setState('ready');
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || generation.current !== currentGeneration) return;
        setError(requestError instanceof Error ? requestError.message : 'The request could not be completed.');
        setState('error');
      });
    return () => controller.abort();
  }, [dependencyKey, reloadToken]);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);
  return { data, state, error, reload };
}
