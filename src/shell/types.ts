import type { NavIconKey } from '../lib/navIcons';

export type ShellFamily = 'school-staff' | 'parent-student' | 'personal' | 'platform';
export type ShellDensity = 'comfortable' | 'compact' | 'focused';
export type NavMode = 'expanded' | 'rail';

export interface ShellNavItem {
  id: string;
  label: string;
  href: string;
  icon: NavIconKey;
  groupId: string;
  groupLabel: string;
}

export interface ShellNavGroup {
  id: string;
  label: string;
  items: ShellNavItem[];
  collapsedByDefault?: boolean;
}
