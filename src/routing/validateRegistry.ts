import { CANONICAL_ROUTES, ROUTES_BY_ID, WORKSPACE_DEFAULT_ROUTE_ID } from './registry';
import { LEGACY_ALIASES } from './aliases';

const ROLE_PATH = /(?:teacher|principal|admin|parent|student|persona|role)-dashboard/i;
const WILDCARD_ALIAS = /\*/;

export function collectRegistryViolations(): string[] {
  const failures: string[] = [];
  const ids = new Set<string>();
  const paths = new Set<string>();

  for (const route of CANONICAL_ROUTES) {
    if (ids.has(route.id)) failures.push(`DUPLICATE_ROUTE_ID ${route.id}`);
    ids.add(route.id);
    if (paths.has(route.path)) failures.push(`DUPLICATE_CANONICAL_PATH ${route.path}`);
    paths.add(route.path);
    if (ROLE_PATH.test(route.id) || ROLE_PATH.test(route.path)) failures.push(`ROLE_SPECIFIC_ROUTE ${route.id}`);
    if (route.classification === 'public' && route.access.authenticated) failures.push(`PUBLIC_AND_PRIVILEGED ${route.id}`);
    if (route.workspace === 'school' && !route.path.startsWith('/school')) failures.push(`SCHOOL_WITHOUT_WORKSPACE ${route.id}`);
    if (route.workspace === 'platform' && !route.path.startsWith('/platform')) failures.push(`PLATFORM_AS_TENANT ${route.id}`);
    if (route.workspace === 'personal' && !route.path.startsWith('/personal')) failures.push(`PERSONAL_AS_SCHOOL ${route.id}`);
    if (route.breadcrumb.parentId && !ROUTES_BY_ID.has(route.breadcrumb.parentId)) failures.push(`BREADCRUMB_PARENT ${route.id}`);
  }

  for (const [workspace, id] of Object.entries(WORKSPACE_DEFAULT_ROUTE_ID)) {
    const route = ROUTES_BY_ID.get(id);
    if (!route?.isWorkspaceDefault) failures.push(`DEFAULT_ROUTE ${workspace}`);
  }

  for (const alias of LEGACY_ALIASES) {
    if (!ROUTES_BY_ID.has(alias.canonicalId)) failures.push(`ALIAS_WITHOUT_TARGET ${alias.id}`);
    if (WILDCARD_ALIAS.test(alias.oldPath)) failures.push(`WILDCARD_ALIAS ${alias.id}`);
  }

  return failures;
}
