import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { visibleNavGroups } from '../lib/navigation';
import { projectLegacyNavigation, projectMobilePrimary, resolveShellFamily } from './LegacyNavigationAdapter';
import { MobileBottomNav } from './MobileBottomNav';
import { PageFrame } from './PageFrame';
import { PrimaryNavigation } from './PrimaryNavigation';
import { SkipLink } from './SkipLink';
import type { ShellNavGroup } from './types';

const staffCtx = { role: 'Super Admin' as const, permissions: [], workspace: 'school' as const };
const teacherCtx = { role: 'Teacher' as const, permissions: ['students.view', 'assessments.view', 'attendance.view'], workspace: 'school' as const };
const parentCtx = { role: 'Parent' as const, permissions: [], workspace: 'school' as const };
const studentCtx = { role: 'Student' as const, permissions: [], workspace: 'school' as const };

const sampleGroups: ShellNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { id: 'home', label: 'Home', href: '/school', icon: 'dashboard', groupId: 'overview', groupLabel: 'Overview' },
      { id: 'students', label: 'Students', href: '/school/people/students', icon: 'students', groupId: 'overview', groupLabel: 'Overview' },
    ],
  },
];

describe('Wave 8 shell family and navigation adapter', () => {
  it('selects shell families from workspace plus parent/student composition, not per-role chrome', () => {
    expect(resolveShellFamily('school', 'Super Admin')).toBe('school-staff');
    expect(resolveShellFamily('school', 'Principal')).toBe('school-staff');
    expect(resolveShellFamily('school', 'Teacher')).toBe('school-staff');
    expect(resolveShellFamily('school', 'Parent')).toBe('parent-student');
    expect(resolveShellFamily('school', 'Student')).toBe('parent-student');
    expect(resolveShellFamily('personal', 'Teacher')).toBe('personal');
    expect(resolveShellFamily('platform', 'Platform Owner')).toBe('platform');
  });

  it('preserves staff menu taxonomy through the legacy adapter', () => {
    const projected = projectLegacyNavigation(staffCtx, 'school-staff');
    const legacy = visibleNavGroups(staffCtx);
    expect(projected.map((group) => group.id)).toEqual(legacy.map((group) => group.id));
    expect(projected.flatMap((group) => group.items.map((item) => item.id))).toEqual(legacy.flatMap((group) => group.items.map((item) => item.id)));
  });

  it('projects a simplified parent/student composition rather than the staff tree', () => {
    const parent = projectLegacyNavigation(parentCtx, 'parent-student');
    const student = projectLegacyNavigation(studentCtx, 'parent-student');
    const staff = projectLegacyNavigation(staffCtx, 'school-staff');
    expect(parent.length).toBe(1);
    expect(student.length).toBe(1);
    expect(parent[0].items.length).toBeLessThan(staff.flatMap((group) => group.items).length);
    expect(parent[0].items.some((item) => item.id === 'home')).toBe(true);
  });

  it('keeps teacher and principal on the School staff adapter, with differences only from current visibility', () => {
    const teacher = projectLegacyNavigation(teacherCtx, 'school-staff');
    const principal = projectLegacyNavigation({ role: 'Principal', permissions: teacherCtx.permissions, workspace: 'school' }, 'school-staff');
    const teacherLegacy = visibleNavGroups(teacherCtx).map((group) => group.id);
    const principalLegacy = visibleNavGroups({ role: 'Principal', permissions: teacherCtx.permissions, workspace: 'school' }).map((group) => group.id);
    expect(teacher.map((group) => group.id)).toEqual(teacherLegacy);
    expect(principal.map((group) => group.id)).toEqual(principalLegacy);
    expect(resolveShellFamily('school', 'Teacher')).toBe('school-staff');
    expect(resolveShellFamily('school', 'Principal')).toBe('school-staff');
  });

  it('limits mobile primary destinations and parks the rest under More', () => {
    const groups = projectLegacyNavigation(staffCtx, 'school-staff');
    const mobile = projectMobilePrimary('school-staff', groups);
    expect(mobile.primary.length).toBeLessThanOrEqual(4);
    expect(mobile.primary.some((item) => item.id === 'home')).toBe(true);
    expect(mobile.more.length).toBeGreaterThan(0);
  });
});

describe('Wave 8 shell chrome primitives', () => {
  it('renders skip link, header/nav/main landmarks contract pieces, and current route', () => {
    render(
      <MemoryRouter initialEntries={['/school/people/students']}>
        <SkipLink />
        <PrimaryNavigation groups={sampleGroups} activeId="students" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Skip to main content' }).getAttribute('href')).toBe('#main-content');
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Students' }).getAttribute('aria-current')).toBe('page');
  });

  it('opens the mobile More surface without inventing destinations', async () => {
    render(
      <MemoryRouter>
        <MobileBottomNav
          primary={sampleGroups[0].items}
          more={[{ id: 'help-support', label: 'Help & Support', href: '/school/help', icon: 'help-support', groupId: 'help', groupLabel: 'Help' }]}
          activeId="home"
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(await screen.findByRole('dialog', { name: 'More' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Help & Support' }).getAttribute('href')).toBe('/school/help');
  });

  it('keeps PageFrame content in a canvas without requiring a page title', () => {
    render(
      <MemoryRouter>
        <PageFrame breadcrumbs={[{ label: 'School', href: '/school' }, { label: 'Students' }]}>
          <p>Legacy students page</p>
        </PageFrame>
      </MemoryRouter>,
    );
    expect(screen.getByText('Legacy students page')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });
});
