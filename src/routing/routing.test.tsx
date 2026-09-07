import React from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { collectRegistryViolations } from './validateRegistry';
import { CANONICAL_ROUTES, LEGACY_NAV_TO_ROUTE_ID, WORKSPACE_DEFAULT_ROUTE_ID } from './registry';
import { LEGACY_ALIASES } from './aliases';
import { buildRoute, matchCanonicalPath, matchLegacyAlias, routeById, UnknownRouteIdError, workspaceDefaultRoute } from './builders';
import { evaluateGuard } from './guards';
import { parseRouteParams } from './params';
import { sanitizeReturnTo } from './returnTo';
import { normalizeLocation } from './normalize';
import { resetRedirectLoop, recordRedirect } from './redirectLoop';
import { documentTitleFor } from './titles';

function HistoryProbe() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div>
      <button type="button" onClick={() => navigate('/school')}>home</button>
      <button type="button" onClick={() => navigate('/school/people/students')}>students</button>
      <button type="button" onClick={() => navigate('/school/people/students/stu_abc')}>profile</button>
      <button type="button" onClick={() => navigate(-1)}>back</button>
      <button type="button" onClick={() => navigate(1)}>forward</button>
      <output data-testid="path">{location.pathname}</output>
    </div>
  );
}

describe('Wave 7 canonical routing', () => {
  it('has unique IDs, unique paths, valid workspaces, and explicit defaults', () => {
    expect(collectRegistryViolations()).toEqual([]);
    expect(new Set(CANONICAL_ROUTES.map((item) => item.id)).size).toBe(CANONICAL_ROUTES.length);
    expect(new Set(CANONICAL_ROUTES.map((item) => item.path)).size).toBe(CANONICAL_ROUTES.length);
    expect(CANONICAL_ROUTES.every((item) => ['school', 'personal', 'platform', 'public', 'auth', 'relate'].includes(item.workspace))).toBe(true);
    expect(routeById(WORKSPACE_DEFAULT_ROUTE_ID.school).isWorkspaceDefault).toBe(true);
    expect(workspaceDefaultRoute('personal').id).toBe('personal.home');
    expect(workspaceDefaultRoute('platform').id).toBe('platform.overview');
  });

  it('rejects unknown route IDs and role-specific canonical routes', () => {
    expect(() => routeById('school.missing')).toThrow(UnknownRouteIdError);
    expect(CANONICAL_ROUTES.some((item) => /teacher-dashboard|principal-dashboard|admin-assessment/.test(item.id + item.path))).toBe(false);
  });

  it('keeps alias targets closed and non-wildcard', () => {
    for (const alias of LEGACY_ALIASES) {
      expect(alias.oldPath.includes('*')).toBe(false);
      expect(CANONICAL_ROUTES.some((item) => item.id === alias.canonicalId)).toBe(true);
    }
    expect(LEGACY_NAV_TO_ROUTE_ID.get('students')).toBe('school.people.students');
  });

  it('encodes resource params safely in builders', () => {
    expect(buildRoute('school.people.students.profile', { studentPublicId: 'stu_1' })).toBe('/school/people/students/stu_1');
    expect(buildRoute('school.people.students.profile', { studentPublicId: 'a/b' })).toBe('/school/people/students/a%2Fb');
  });

  it('matches school, personal, platform, and public deep links', () => {
    expect(matchCanonicalPath('/school/people/students')?.route.id).toBe('school.people.students');
    expect(matchCanonicalPath('/personal')?.route.id).toBe('personal.home');
    expect(matchCanonicalPath('/platform/tenants')?.route.id).toBe('platform.tenants');
    expect(matchCanonicalPath('/welcome')?.route.id).toBe('public.tenant-welcome');
    expect(matchCanonicalPath('/school/people/students')?.route.path).toBe('/school/people/students');
  });

  it('maps legacy app tabs without guessing unknown tabs', () => {
    expect(matchLegacyAlias('/app/students')?.canonical.id).toBe('school.people.students');
    expect(matchLegacyAlias('/app/assessments')?.canonical.id).toBe('school.assessment');
    expect(matchLegacyAlias('/app/not-a-real-tab')).toBeNull();
    expect(matchLegacyAlias('/s/demo/app/students')?.canonical.id).toBe('school.people.students');
  });

  it('sends unauthenticated protected routes to login and sanitizes return URLs', () => {
    const decision = evaluateGuard({ route: routeById('school.people.students'), authenticated: false, workspaceType: '', workspaceStatus: 'IDLE', capabilities: [] });
    expect(decision.reason).toBe('unauthenticated');
    expect(sanitizeReturnTo('/school/people/students')).toBe('/school/people/students');
    expect(sanitizeReturnTo('https://evil.example/phish')).toBeNull();
    expect(sanitizeReturnTo('//evil.example')).toBeNull();
    expect(sanitizeReturnTo('/\\evil.example')).toBeNull();
  });

  it('requires workspace identity and does not grant access from persona', () => {
    const students = routeById('school.people.students');
    expect(evaluateGuard({ route: students, authenticated: true, workspaceType: 'personal', workspaceStatus: 'READY', capabilities: ['students.profile.view'] }).reason).toBe('workspace_mismatch');
    expect(evaluateGuard({ route: students, authenticated: true, workspaceType: 'school', workspaceStatus: 'READY', capabilities: ['students.profile.view'] }).reason).toBe('ok');
    expect(evaluateGuard({ route: students, authenticated: true, workspaceType: 'school', workspaceStatus: 'READY', capabilities: [] }).reason).toBe('capability_denied');
    expect(evaluateGuard({ route: routeById('platform.tenants'), authenticated: true, workspaceType: 'school', workspaceStatus: 'READY', capabilities: ['platform.tenant.view'] }).reason).toBe('workspace_mismatch');
  });

  it('treats unknown routes as 404 rather than Home', () => {
    expect(matchCanonicalPath('/definitely-not-a-page')).toBeNull();
    expect(matchCanonicalPath('/school/missing-capability-page')).toBeNull();
    expect(matchCanonicalPath('/unknown')?.route.id).not.toBe('school.home');
  });

  it('rejects malformed resource params without throwing', () => {
    const route = routeById('school.people.students.profile');
    expect(parseRouteParams(route, { studentPublicId: 'ok_id-1' }, '').ok).toBe(true);
    const bad = parseRouteParams(route, { studentPublicId: '../etc/passwd' }, '');
    expect(bad).toMatchObject({ ok: false, reason: '404' });
  });

  it('normalizes slashes and preserves public IDs', () => {
    expect(normalizeLocation('/school//people/students/').pathname).toBe('/school/people/students');
    expect(normalizeLocation('/school/people/students/Stu_01').pathname).toBe('/school/people/students/Stu_01');
  });

  it('supports back and forward between representative routes', () => {
    render(
      <MemoryRouter initialEntries={['/school']}>
        <HistoryProbe />
      </MemoryRouter>,
    );
    act(() => { screen.getByText('students').click(); });
    expect(screen.getByTestId('path').textContent).toBe('/school/people/students');
    act(() => { screen.getByText('profile').click(); });
    expect(screen.getByTestId('path').textContent).toBe('/school/people/students/stu_abc');
    act(() => { screen.getByText('back').click(); });
    expect(screen.getByTestId('path').textContent).toBe('/school/people/students');
    act(() => { screen.getByText('forward').click(); });
    expect(screen.getByTestId('path').textContent).toBe('/school/people/students/stu_abc');
  });

  it('prevents redirect loops after repeated redirects', () => {
    resetRedirectLoop();
    for (let i = 0; i < 8; i += 1) expect(recordRedirect()).toBe(false);
    expect(recordRedirect()).toBe(true);
  });

  it('does not leak resource names into document titles', () => {
    expect(documentTitleFor(routeById('school.people.students'), 'Royal Gateway')).toBe('Students | Royal Gateway | Skuggle');
    expect(documentTitleFor(routeById('school.people.students.profile'), 'Royal Gateway')).toBe('Student profile | Royal Gateway | Skuggle');
    expect(documentTitleFor(routeById('platform.tenants'))).toBe('Platform tenants | Skuggle');
  });
});
