import { isInternalPath, normalizePathname } from './normalize';
import { matchCanonicalPath, matchLegacyAlias } from './builders';

const RETURN_KEYS = ['returnTo', 'next', 'redirect'] as const;

export function readReturnTo(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  for (const key of RETURN_KEYS) {
    const value = params.get(key);
    if (value) return value;
  }
  return null;
}

export function sanitizeReturnTo(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  let value = candidate.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (!isInternalPath(value)) return null;
  const [rawPath, rawSearch = ''] = value.split('?');
  const pathname = normalizePathname(rawPath);
  if (pathname === '/login' || pathname === '/school/login') return null;
  if (matchCanonicalPath(pathname) || matchLegacyAlias(pathname)) {
    return rawSearch ? `${pathname}?${rawSearch}` : pathname;
  }
  return null;
}

export function withReturnTo(loginPath: string, intended: string): string {
  const safe = sanitizeReturnTo(intended);
  if (!safe) return loginPath;
  const join = loginPath.includes('?') ? '&' : '?';
  return `${loginPath}${join}returnTo=${encodeURIComponent(safe)}`;
}
