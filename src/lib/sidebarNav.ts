import type { ElementType } from 'react';
import { UserRole, WorkspaceItem } from '../types';
import { NAV_CATEGORIES, NavCategoryId, visibleNavGroups, workspaceKind } from './navigation';
import { navIcon } from './navIcons';

export interface SidebarModuleItem {
  id: string;
  label: string;
  icon: ElementType;
}

export interface SidebarModule {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  category: NavCategoryId;
  items: SidebarModuleItem[];
}

export interface SidebarCategory {
  id: NavCategoryId;
  label: string;
  modules: SidebarModule[];
}

export function buildSidebarCategories(
  role: UserRole,
  permissions: string[],
  workspace: Pick<WorkspaceItem, 'type'>,
): SidebarCategory[] {
  const groups = visibleNavGroups({
    role,
    permissions,
    workspace: workspaceKind(workspace.type),
  });

  return NAV_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    modules: groups
      .filter((group) => group.category === category.id)
      .map((group) => ({
        id: group.id,
        title: group.label,
        description: group.description,
        icon: navIcon(group.icon),
        category: group.category,
        items: group.items.map((item) => ({
          id: item.id,
          label: item.label,
          icon: navIcon(item.icon),
        })),
      })),
  })).filter((category) => category.modules.length > 0);
}

export function buildSidebarSections(
  role: UserRole,
  permissions: string[],
  workspace: Pick<WorkspaceItem, 'type'>,
) {
  return buildSidebarCategories(role, permissions, workspace).flatMap((category) =>
    category.modules.map((module) => ({
      id: module.id,
      title: module.title,
      items: module.items,
    })),
  );
}
