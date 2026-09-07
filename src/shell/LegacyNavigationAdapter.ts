import { buildRoute, routeFromLegacyNavId } from '../routing/builders';
import { visibleNavGroups, type NavContext } from '../lib/navigation';
import type { UserRole, WorkspaceItem } from '../types';
import type { ShellFamily, ShellNavGroup, ShellNavItem } from './types';

const PARENT_IDS = new Set(['home', 'students', 'parent-messages', 'student-billing', 'help-support', 'attendance']);
const STUDENT_IDS = new Set(['home', 'assessments', 'cbt', 'library', 'online-materials', 'student-messages', 'help-support']);
const PERSONAL_IDS = new Set(['home', 'library', 'online-materials', 'assessments', 'cbt', 'current-plan', 'help-support']);
const PLATFORM_IDS = new Set(['home', 'platform', 'schools', 'health', 'governance', 'help-support']);
const STAFF_MOBILE_PRIMARY = ['home', 'students', 'assessments', 'attendance'];
const PARENT_MOBILE_PRIMARY = ['home', 'students', 'parent-messages'];
const STUDENT_MOBILE_PRIMARY = ['home', 'assessments', 'library'];
const PERSONAL_MOBILE_PRIMARY = ['home', 'library', 'current-plan'];
const PLATFORM_MOBILE_PRIMARY = ['home', 'schools', 'health'];

export function resolveShellFamily(workspaceType: WorkspaceItem['type'], role: UserRole): ShellFamily {
  if (workspaceType === 'platform') return 'platform';
  if (workspaceType === 'personal') return 'personal';
  if (role === 'Parent' || role === 'Student') return 'parent-student';
  return 'school-staff';
}

function hrefForNavId(id: string): string {
  const route = routeFromLegacyNavId(id);
  return route ? buildRoute(route.id) : '/not-found';
}

/**
 * Wave 8 compatibility projection. Owner: Frontend Platform.
 * Removal: Wave 9 capability navigation. Does not change menu taxonomy for staff.
 */
export function projectLegacyNavigation(ctx: NavContext, family: ShellFamily): ShellNavGroup[] {
  const groups = visibleNavGroups(ctx).map((group) => ({
    id: group.id,
    label: group.label,
    collapsedByDefault: group.id === 'administration' || group.id === 'subscription',
    items: group.items.map((item): ShellNavItem => ({
      id: item.id,
      label: item.label,
      href: hrefForNavId(item.id),
      icon: item.icon,
      groupId: group.id,
      groupLabel: group.label,
    })),
  })).filter((group) => group.items.length > 0);

  if (family === 'school-staff') return groups;

  const allowed = family === 'parent-student'
    ? (ctx.role === 'Student' ? STUDENT_IDS : PARENT_IDS)
    : family === 'personal' ? PERSONAL_IDS : PLATFORM_IDS;

  const items = groups.flatMap((group) => group.items).filter((item) => allowed.has(item.id) || item.id === 'home');
  const unique = [...new Map(items.map((item) => [item.id, item])).values()];
  const label = family === 'personal' ? 'Personal' : family === 'platform' ? 'Platform' : 'School';
  return unique.length ? [{ id: family, label, items: unique }] : groups.slice(0, 1);
}

export function projectMobilePrimary(family: ShellFamily, groups: ShellNavGroup[]): { primary: ShellNavItem[]; more: ShellNavItem[] } {
  const all = groups.flatMap((group) => group.items);
  const preferred = family === 'parent-student'
    ? (all.some((item) => item.id === 'parent-messages') ? PARENT_MOBILE_PRIMARY : STUDENT_MOBILE_PRIMARY)
    : family === 'personal' ? PERSONAL_MOBILE_PRIMARY
      : family === 'platform' ? PLATFORM_MOBILE_PRIMARY
        : STAFF_MOBILE_PRIMARY;
  const primary: ShellNavItem[] = [];
  for (const id of preferred) {
    const match = all.find((item) => item.id === id);
    if (match) primary.push(match);
  }
  if (!primary.find((item) => item.id === 'home')) {
    const home = all.find((item) => item.id === 'home');
    if (home) primary.unshift(home);
  }
  const primaryIds = new Set(primary.map((item) => item.id));
  const more = all.filter((item) => !primaryIds.has(item.id));
  return { primary: primary.slice(0, 4), more };
}
