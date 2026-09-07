import type { NavIconKey } from '../lib/navIcons';
import type { NavWorkspace } from '../lib/navigation';
import type { UserRole, WorkspaceItem } from '../types';
import type { ShellFamily, ShellNavGroup, ShellNavItem } from '../shell/types';
import { buildRoute, routeById } from './builders';
import type { CanonicalRouteDefinition } from './types';

export interface PrimaryNavigationItem {
  routeId: string;
  label: string;
  icon: NavIconKey;
}

export interface PrimaryNavigationGroup {
  id: string;
  label: string;
  items: readonly PrimaryNavigationItem[];
}

// This is deliberately curated. The canonical route registry contains every
// navigable URL; this registry contains only persistent GROUP -> ITEM entries.
export const SCHOOL_STAFF_PRIMARY_NAVIGATION: readonly PrimaryNavigationGroup[] = [
  { id: 'home', label: 'Home', items: [
    { routeId: 'school.home', label: 'Dashboard', icon: 'dashboard' },
  ] },
  { id: 'people', label: 'People', items: [
    { routeId: 'school.people.students', label: 'Students', icon: 'students' },
    { routeId: 'school.people.guardians', label: 'Guardians', icon: 'parents' },
    { routeId: 'school.people.workforce', label: 'Workforce', icon: 'staff' },
  ] },
  { id: 'admissions', label: 'Admissions', items: [
    { routeId: 'school.admissions', label: 'Admissions', icon: 'admissions' },
  ] },
  { id: 'teaching-learning', label: 'Teaching & Learning', items: [
    { routeId: 'school.academics', label: 'Academics', icon: 'academics' },
    { routeId: 'school.assessment', label: 'Assessment', icon: 'assessment' },
    { routeId: 'school.performance', label: 'Performance', icon: 'performance' },
    { routeId: 'school.learning-resources', label: 'Learning Resources', icon: 'learning-resources' },
  ] },
  { id: 'school-operations', label: 'School Operations', items: [
    { routeId: 'school.attendance', label: 'Attendance', icon: 'attendance' },
    { routeId: 'school.finance', label: 'Finance', icon: 'finance' },
    { routeId: 'school.student-services', label: 'Student Services', icon: 'student-services' },
    { routeId: 'school.operations', label: 'Operations', icon: 'operations' },
  ] },
  { id: 'engagement', label: 'Engagement', items: [
    { routeId: 'school.communication', label: 'Communication', icon: 'communication' },
    { routeId: 'school.calendar', label: 'Calendar', icon: 'academic-calendar' },
  ] },
  { id: 'insights', label: 'Insights', items: [
    { routeId: 'school.insights.analytics', label: 'Analytics', icon: 'performance' },
    { routeId: 'school.insights.reports', label: 'Reports', icon: 'reports' },
  ] },
  { id: 'administration', label: 'Administration', items: [
    { routeId: 'school.administration.school-setup', label: 'School Setup', icon: 'school-settings' },
    { routeId: 'school.administration.users-access', label: 'Users & Access', icon: 'user-access' },
    { routeId: 'school.administration.roles-permissions', label: 'Roles & Permissions', icon: 'administrators' },
    { routeId: 'school.administration.forms', label: 'Forms & Custom Fields', icon: 'workflow-rules' },
    { routeId: 'school.administration.workflows', label: 'Workflows', icon: 'automation' },
    { routeId: 'school.administration.integrations', label: 'Integrations', icon: 'integrations' },
    { routeId: 'school.administration.subscription', label: 'Subscription & Plan', icon: 'subscription' },
    { routeId: 'school.administration.security', label: 'Security', icon: 'security' },
    { routeId: 'school.administration.audit', label: 'Audit', icon: 'audit-logs' },
  ] },
];

const PERSONAL_PRIMARY_NAVIGATION: readonly PrimaryNavigationGroup[] = [
  { id: 'personal', label: 'Personal', items: [
    { routeId: 'personal.home', label: 'Home', icon: 'dashboard' },
    { routeId: 'personal.learning-resources', label: 'Learning Resources', icon: 'learning-resources' },
    { routeId: 'personal.assessment', label: 'Assessment', icon: 'assessment' },
    { routeId: 'personal.subscription', label: 'Subscription', icon: 'subscription' },
    { routeId: 'personal.help', label: 'Help & Support', icon: 'help-support' },
  ] },
];

const PLATFORM_PRIMARY_NAVIGATION: readonly PrimaryNavigationGroup[] = [
  { id: 'platform', label: 'Platform', items: [
    { routeId: 'platform.overview', label: 'Overview', icon: 'dashboard' },
    { routeId: 'platform.tenants', label: 'Tenants', icon: 'schools' },
    { routeId: 'platform.health', label: 'Health', icon: 'health' },
    { routeId: 'platform.governance', label: 'Security & Audit', icon: 'governance' },
    { routeId: 'platform.help', label: 'Help & Support', icon: 'help-support' },
  ] },
];

export function hasNavigationRouteAccess(route: CanonicalRouteDefinition, capabilities: readonly string[]): boolean {
  const required = route.access.capabilities;
  if (!required?.length) return true;
  return route.access.capabilitiesMode === 'all'
    ? required.every((capability) => capabilities.includes(capability))
    : required.some((capability) => capabilities.includes(capability));
}

function registryFor(family: ShellFamily): readonly PrimaryNavigationGroup[] {
  if (family === 'platform') return PLATFORM_PRIMARY_NAVIGATION;
  if (family === 'personal') return PERSONAL_PRIMARY_NAVIGATION;
  return SCHOOL_STAFF_PRIMARY_NAVIGATION;
}

export function projectPrimaryNavigation(input: {
  family: ShellFamily;
  workspace: NavWorkspace;
  capabilities: readonly string[];
}): ShellNavGroup[] {
  return registryFor(input.family).map((group) => ({
    id: group.id,
    label: group.label,
    collapsedByDefault: group.id === 'administration',
    items: group.items.flatMap((item) => {
      const route = routeById(item.routeId);
      if (route.workspace !== input.workspace || !hasNavigationRouteAccess(route, input.capabilities)) return [];
      return [{
        id: item.routeId,
        label: item.label,
        href: buildRoute(item.routeId),
        icon: item.icon,
        groupId: group.id,
        groupLabel: group.label,
      }];
    }),
  })).filter((group) => group.items.length > 0);
}

const PRIMARY_ROUTE_IDS = new Set(
  [...SCHOOL_STAFF_PRIMARY_NAVIGATION, ...PERSONAL_PRIMARY_NAVIGATION, ...PLATFORM_PRIMARY_NAVIGATION]
    .flatMap((group) => group.items.map((item) => item.routeId)),
);

export function primaryNavigationIdForRoute(route: CanonicalRouteDefinition): string {
  let current: CanonicalRouteDefinition | undefined = route;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    if (PRIMARY_ROUTE_IDS.has(current.id)) return current.id;
    visited.add(current.id);
    current = current.breadcrumb.parentId ? routeById(current.breadcrumb.parentId) : undefined;
  }
  return route.id;
}

export function resolveShellFamily(workspaceType: WorkspaceItem['type'], role: UserRole): ShellFamily {
  if (workspaceType === 'platform') return 'platform';
  if (workspaceType === 'personal') return 'personal';
  if (role === 'Parent' || role === 'Student') return 'parent-student';
  return 'school-staff';
}

const MOBILE_PRIMARY: Record<ShellFamily, readonly string[]> = {
  'school-staff': ['school.home', 'school.people.students', 'school.assessment', 'school.attendance'],
  'parent-student': ['school.home', 'school.people.students', 'school.communication'],
  personal: ['personal.home', 'personal.learning-resources', 'personal.subscription'],
  platform: ['platform.overview', 'platform.tenants', 'platform.health'],
};

export function projectMobilePrimary(family: ShellFamily, groups: ShellNavGroup[]): { primary: ShellNavItem[]; more: ShellNavItem[] } {
  const all = groups.flatMap((group) => group.items);
  const primary = MOBILE_PRIMARY[family]
    .map((id) => all.find((item) => item.id === id))
    .filter((item): item is ShellNavItem => Boolean(item))
    .slice(0, 4);
  const primaryIds = new Set(primary.map((item) => item.id));
  return { primary, more: all.filter((item) => !primaryIds.has(item.id)) };
}
