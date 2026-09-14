const APPLICATION_PREFIXES = ['/personal', '/platform', '/relate'] as const;

/** Authenticated workspace paths — keep skeleton loaders here, not the mascot boot. */
export function isApplicationEnvironmentPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/session') return true;
  if (path === '/school/login' || path.startsWith('/school/login/')) return false;
  if (path === '/school' || path.startsWith('/school/')) return true;
  return APPLICATION_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
