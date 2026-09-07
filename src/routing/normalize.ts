const MULTI_SLASH = /\/{2,}/g;

export interface NormalizedLocation {
  pathname: string;
  search: string;
  changed: boolean;
}

/**
 * Deterministic URL normalization. Opaque public IDs are not case-folded.
 * Trailing slashes are stripped except for the root path.
 */
export function normalizePathname(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURI(pathname);
  } catch {
    decoded = pathname;
  }
  const collapsed = decoded.replace(MULTI_SLASH, '/') || '/';
  if (collapsed === '/') return '/';
  return collapsed.replace(/\/+$/, '') || '/';
}

export function normalizeSearch(search: string): string {
  if (!search || search === '?') return '';
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const keys = [...new Set([...params.keys()])].sort();
  const next = new URLSearchParams();
  for (const key of keys) {
    for (const value of params.getAll(key)) {
      if (value !== '') next.append(key, value);
    }
  }
  const encoded = next.toString();
  return encoded ? `?${encoded}` : '';
}

export function normalizeLocation(pathname: string, search = ''): NormalizedLocation {
  const nextPath = normalizePathname(pathname);
  const nextSearch = normalizeSearch(search);
  return {
    pathname: nextPath,
    search: nextSearch,
    changed: nextPath !== pathname || nextSearch !== (search || ''),
  };
}

export function splitPath(pathname: string): string[] {
  return normalizePathname(pathname).split('/').filter(Boolean);
}

export function isInternalPath(candidate: string): boolean {
  if (!candidate.startsWith('/')) return false;
  if (candidate.startsWith('//')) return false;
  if (candidate.includes('://')) return false;
  if (candidate.includes('\\')) return false;
  if (/[\u0000-\u001F]/.test(candidate)) return false;
  return true;
}
