import { matchCanonicalPath } from './builders';

export function isPublicPath(pathname: string): boolean {
  const matched = matchCanonicalPath(pathname);
  if (!matched) {
    const first = pathname.split('/').filter(Boolean)[0];
    return ['reset-password', 'verify-email', 'join', 'login', 'welcome', 'register', 'results', 'not-found'].includes(first || '');
  }
  return matched.route.classification === 'public' || (matched.route.workspace === 'auth' && !matched.route.access.authenticated);
}
