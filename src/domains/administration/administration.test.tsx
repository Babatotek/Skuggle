import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach } from 'vitest';
import { ADMINISTRATION_CAPABILITIES, ADMINISTRATION_DOMAINS, ADMINISTRATION_REDIRECTS, ADMINISTRATION_ROUTES } from '../../routing/administration';
import { buildRoute, matchCanonicalPath, matchLegacyAlias, routeById, routeFromLegacyNavId } from '../../routing/builders';
import { evaluateGuard } from '../../routing/guards';
import AdministrationWorkspace from './AdministrationWorkspace';

const state = vi.hoisted(() => ({ capabilities: [] as string[], renderCapability: vi.fn() }));
vi.mock('../../state/ApplicationStateProviders', () => ({ useAccess: () => state }));
vi.mock('../../routing/LegacyPageAdapter', () => ({ LegacyPageAdapter: () => { state.renderCapability(); return <div>Capability content</div>; } }));
afterEach(() => { cleanup(); state.renderCapability.mockClear(); });
const all = [...new Set(ADMINISTRATION_CAPABILITIES.map(c => c.permission).filter(Boolean))];
function open(id = 'school.administration', capabilities = all) {
  state.capabilities = capabilities;
  return render(<MemoryRouter><AdministrationWorkspace route={routeById(id)} onNavigateTab={vi.fn()} /></MemoryRouter>);
}
describe('Administration control centre', () => {
  it('progressively discloses nine domains without mounting capability datasets', () => {
    open();
    for (const domain of ADMINISTRATION_DOMAINS) expect(screen.getByRole('link', { name: new RegExp(domain.label) })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^Campuses/ })).toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(state.renderCapability).not.toHaveBeenCalled();
  });
  it('searches only canonical permitted capabilities', () => {
    open('school.administration', ['school.settings.update']);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'campus' } });
    expect(screen.getByRole('link', { name: /Campuses/ }).getAttribute('href')).toBe('/school/administration/school-setup/campuses');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'security' } });
    expect(screen.getByRole('status').textContent).toContain('No accessible settings');
  });
  it('does not reveal governance to an unauthorized user', () => {
    open('school.administration', []);
    expect(screen.queryByRole('link', { name: /Governance/ })).toBeNull();
    expect(screen.getByRole('link', { name: /System/ })).toBeTruthy();
  });
  it.each(ADMINISTRATION_ROUTES)('round trips direct route $id and checks access', route => {
    expect(matchCanonicalPath(buildRoute(route.id))?.route.id).toBe(route.id);
    const permitted = evaluateGuard({ route, authenticated: true, workspaceType: 'school', workspaceStatus: 'READY', capabilities: all });
    expect(permitted.reason).not.toBe('capability_denied');
    if (route.access.capabilities?.length) expect(evaluateGuard({ route, authenticated: true, workspaceType: 'school', workspaceStatus: 'READY', capabilities: [] }).reason).toBe('capability_denied');
    expect(evaluateGuard({ route, authenticated: true, workspaceType: 'personal', workspaceStatus: 'READY', capabilities: all }).reason).toBe('workspace_mismatch');
  });
  it.each(ADMINISTRATION_REDIRECTS)('redirects $oldPath once to the canonical destination', item => {
    const target = matchLegacyAlias(item.oldPath);
    expect(target?.canonical.id).toBe(item.canonicalId);
    expect(matchCanonicalPath(target!.href)?.route.id).toBe(item.canonicalId);
    expect(matchLegacyAlias(target!.href)).toBeNull();
  });
  it('preserves distinct automation, policy and system data destinations', () => {
    expect(routeFromLegacyNavId('automation')?.moduleKey).toBe('automation');
    expect(routeFromLegacyNavId('auth-policies')?.id).toBe('school.administration.access-policies');
    expect(routeFromLegacyNavId('system-configuration')?.moduleKey).toBe('system-config');
    expect(routeFromLegacyNavId('roles-permissions')?.id).toBe('school.administration.roles');
    expect(routeFromLegacyNavId('accounts')?.id).toBe('school.administration.users-access');
    expect(routeFromLegacyNavId('school-facilities')?.domain).toBe('operations');
  });
  it('separates Users, Roles, Permissions and Access Policies under People & Access', () => {
    const peopleAccess = ADMINISTRATION_CAPABILITIES.filter((c) => c.domain === 'people-access').map((c) => c.id);
    expect(peopleAccess).toEqual(['users-access', 'roles', 'permissions', 'invitations', 'access-policies']);
    expect(ADMINISTRATION_CAPABILITIES.find((c) => c.id === 'users-access')?.label).toBe('Users');
    expect(ADMINISTRATION_CAPABILITIES.find((c) => c.id === 'roles')?.label).toBe('Roles');
    expect(buildRoute('school.administration.roles')).toBe('/school/administration/people-access/roles');
    expect(buildRoute('school.administration.users-access')).toBe('/school/administration/people-access/users');
  });
});
