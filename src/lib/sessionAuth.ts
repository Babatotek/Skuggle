const SCHOOL_PATH_PREFIXES = ['/s/', '/school/', '/t/'] as const;

/** Product / infra labels that must never be treated as a school tenant slug. */
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'localhost',
  'skuggle',
  'staging',
  'dev',
  'demo',
  'mail',
  'cdn',
  'static',
]);

/**
 * Resolve a tenant/school key from the current URL (query, path, or subdomain).
 * Used on cold load to route visitors to the tenant welcome screen.
 *
 * Important: marketing hosts like `skuggle.royalgatewayadmin.com` must NOT count as a
 * tenant subdomain — that incorrectly forces the legacy TenantWelcome/TenantLogin flow.
 */
export function schoolKeyFromLocation(location: Location = window.location): string | null {
  const params = new URLSearchParams(location.search);
  const fromQuery =
    params.get('school') ??
    params.get('tenant') ??
    params.get('code') ??
    params.get('tenantCode') ??
    params.get('tenantSlug');

  if (fromQuery?.trim()) {
    return fromQuery.trim();
  }

  const path = location.pathname.replace(/\/+$/, '') || '/';
  for (const prefix of SCHOOL_PATH_PREFIXES) {
    if (!path.startsWith(prefix)) continue;
    const segment = path.slice(prefix.length).split('/').filter(Boolean)[0];
    if (segment) return decodeURIComponent(segment);
  }

  const hostParts = location.hostname.split('.').filter(Boolean);
  if (hostParts.length >= 3) {
    const subdomain = hostParts[0]?.toLowerCase();
    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      return hostParts[0];
    }
  }

  return null;
}
