export type ReleaseSkewStatus = 'ok' | 'skipped' | 'reloading' | 'stuck';

const RELOAD_KEY = 'skuggle-version-reload';

export function frontendReleaseId(): string {
  const value = import.meta.env.VITE_BUILD_ID;
  if (typeof value !== 'string' || value.length === 0 || value.startsWith('%')) {
    return '';
  }
  return value;
}

let pending: Promise<ReleaseSkewStatus> | null = null;

export function reconcileReleaseSkew(): Promise<ReleaseSkewStatus> {
  if (!pending) {
    pending = detectSkew();
  }
  return pending;
}

async function detectSkew(): Promise<ReleaseSkewStatus> {
  const frontend = frontendReleaseId();
  if (!frontend) {
    return 'skipped';
  }

  try {
    const response = await fetch('/version', {
      headers: {Accept: 'application/json'},
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) {
      return 'skipped';
    }
    const body = (await response.json()) as {release?: unknown};
    const backend = typeof body.release === 'string' ? body.release.trim() : '';
    if (!backend) {
      return 'skipped';
    }
    if (backend === frontend) {
      sessionStorage.removeItem(RELOAD_KEY);
      return 'ok';
    }
    if (!sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
      return 'reloading';
    }
    return 'stuck';
  } catch {
    return 'skipped';
  }
}
