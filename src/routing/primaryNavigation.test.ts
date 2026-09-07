import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { routeById } from './builders';
import {
  primaryNavigationIdForRoute,
  projectPrimaryNavigation,
  SCHOOL_STAFF_PRIMARY_NAVIGATION,
} from './primaryNavigation';

const allCapabilities = [...new Set(SCHOOL_STAFF_PRIMARY_NAVIGATION.flatMap((group) =>
  group.items.flatMap((item) => routeById(item.routeId).access.capabilities ?? []),
))];

const project = (capabilities: readonly string[] = allCapabilities) => projectPrimaryNavigation({
  family: 'school-staff',
  workspace: 'school',
  capabilities,
});

const items = () => project().flatMap((group) => group.items);

describe('Wave 9 canonical primary navigation', () => {
  it('contains only the approved groups and no exhaustive Online Learning group', () => {
    expect(project().map((group) => group.label)).toEqual([
      'Home', 'People', 'Admissions', 'Teaching & Learning', 'School Operations',
      'Engagement', 'Insights', 'Administration',
    ]);
    expect(project().some((group) => group.label === 'Online Learning')).toBe(false);
  });

  it('does not exceed the frozen 26 primary destinations', () => {
    expect(items()).toHaveLength(26);
  });

  it.each(['Finance', 'Attendance', 'Assessment', 'Performance', 'Communication', 'Student Services', 'Operations', 'Reports'])
  ('contains one primary %s destination', (label) => {
    expect(items().filter((item) => item.label === label)).toHaveLength(1);
  });

  it('places Learning Resources under Teaching & Learning', () => {
    expect(project().find((group) => group.label === 'Teaching & Learning')?.items.map((item) => item.label))
      .toContain('Learning Resources');
  });

  it('uses Guardians and one Workforce destination without Teachers or Staff duplicates', () => {
    const people = project().find((group) => group.label === 'People')?.items.map((item) => item.label);
    expect(people).toEqual(['Students', 'Guardians', 'Workforce']);
  });

  it('owns Forms and Subscription only under Administration and keeps SaaS subscription out of Finance', () => {
    const administration = project().find((group) => group.label === 'Administration')?.items.map((item) => item.label);
    const operations = project().find((group) => group.label === 'School Operations')?.items.map((item) => item.label);
    expect(administration?.filter((label) => label === 'Forms & Custom Fields')).toHaveLength(1);
    expect(administration).toContain('Subscription & Plan');
    expect(operations).toContain('Finance');
    expect(operations?.some((label) => label.includes('Subscription'))).toBe(false);
  });

  it('activates canonical parents for deep routes', () => {
    expect(primaryNavigationIdForRoute(routeById('school.assessment.marking'))).toBe('school.assessment');
    expect(primaryNavigationIdForRoute(routeById('school.people.students.profile'))).toBe('school.people.students');
    expect(primaryNavigationIdForRoute(routeById('school.communication.messages'))).toBe('school.communication');
  });

  it('uses the same route capability contract for exposure and revocation', () => {
    expect(project([]).flatMap((group) => group.items).some((item) => item.id === 'school.administration.forms')).toBe(false);
    expect(project(['school.settings.update']).flatMap((group) => group.items).some((item) => item.id === 'school.administration.forms')).toBe(true);
    expect(project(['school.settings.update']).flatMap((group) => group.items).some((item) => item.id === 'school.finance')).toBe(false);
  });

  it('exposes Admissions for fine-grained view or the legacy manage aggregate', () => {
    expect(project(['admissions.application.view']).some((group) => group.id === 'admissions')).toBe(true);
    expect(project(['admissions.application.manage']).some((group) => group.id === 'admissions')).toBe(true);
    expect(project(['students.profile.view']).some((group) => group.id === 'admissions')).toBe(false);
  });

  it('unions capability grants without consulting persona or raw role names', () => {
    const union = project(['students.profile.view', 'finance.account.view']).flatMap((group) => group.items).map((item) => item.id);
    expect(union).toContain('school.people.students');
    expect(union).toContain('school.finance');
    expect(SCHOOL_STAFF_PRIMARY_NAVIGATION.flatMap((group) => group.items).some((item) =>
      Object.keys(item).some((key) => key === 'role' || key === 'roles' || key === 'persona'),
    )).toBe(false);
  });

  it('keeps the live shell independent of the legacy exhaustive projection', () => {
    const source = readFileSync(`${process.cwd()}/src/shell/AuthenticatedRoot.tsx`, 'utf8');
    expect(source).not.toContain('LegacyNavigationAdapter');
    expect(source).not.toContain('projectLegacyNavigation');
    expect(source).toContain('projectPrimaryNavigation');
  });
});
