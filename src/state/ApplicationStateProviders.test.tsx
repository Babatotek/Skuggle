import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApplicationStateProviders, useAccess, useAcademicContext, useAuth, useWorkspace } from './ApplicationStateProviders';
import { buildQueryKey, commitLatest } from './serverState';

let controls: ReturnType<typeof useAuth> & ReturnType<typeof useWorkspace> & ReturnType<typeof useAccess> & ReturnType<typeof useAcademicContext>;
function Probe() {
  const auth = useAuth();
  const workspace = useWorkspace();
  const access = useAccess();
  const academic = useAcademicContext();
  controls = { ...auth, ...workspace, ...access, ...academic };
  return <output data-testid="state">{JSON.stringify({ authStatus: auth.status, workspaceStatus: workspace.status, workspaceFailure: workspace.failure, workspace: workspace.activeWorkspace.id, capabilities: access.capabilities, campus: academic.campus?.id, session: academic.session?.id, term: academic.term?.id })}</output>;
}
function setup() { render(<ApplicationStateProviders><Probe /></ApplicationStateProviders>); }
const school = (id: string) => ({ id, name: id, type: 'school' as const, role: 'Teacher' as const, schoolCode: id });

describe('Wave 6 application state boundaries', () => {
  it('models unauthenticated, authenticated refresh and logout without downstream identity residue', () => {
    setup();
    expect(controls.identity.id).toBe('');
    act(() => { controls.setIdentity((identity) => ({ ...identity, id: 'user-1', fullName: 'Ada', verified: true })); controls.setAuthStatus('READY'); });
    expect(controls.identity.fullName).toBe('Ada');
    expect(screen.getByTestId('state').textContent).toContain('"authStatus":"READY"');
    act(() => controls.setIdentity((identity) => ({ ...identity, fullName: 'Ada Updated' })));
    expect(controls.identity.fullName).toBe('Ada Updated');
    act(() => controls.clearAuth());
    expect(controls.identity.id).toBe('');
  });

  it('replaces access metadata and never grants a capability from persona', () => {
    setup();
    act(() => controls.replaceAccess({ capabilities: ['students.view'], legacyPermissions: ['students.view'], registryVersion: 5, assignments: [], personaHint: 'teacher' }));
    expect(controls.hasCapability('students.view')).toBe(true);
    expect(controls.hasCapability('assessments.manage')).toBe(false);
    act(() => controls.replaceAccess({ capabilities: [], legacyPermissions: [], registryVersion: 6, assignments: [], personaHint: 'teacher' }));
    expect(controls.hasCapability('students.view')).toBe(false);
  });

  it('evaluates any/all capability checks against only the current payload', () => {
    setup();
    act(() => controls.replaceAccess({ capabilities: ['students.view', 'students.create'], legacyPermissions: [], registryVersion: 5, assignments: [], personaHint: 'student' }));
    expect(controls.hasAnyCapability(['finance.view', 'students.view'])).toBe(true);
    expect(controls.hasAllCapabilities(['students.view', 'students.create'])).toBe(true);
    expect(controls.hasAllCapabilities(['students.view', 'finance.view'])).toBe(false);
  });

  it('clears foreign academic context synchronously when a workspace transition begins', () => {
    setup();
    let generation = 0;
    act(() => {
      generation = controls.completeWorkspaceTransition(school('tenant-a'));
      controls.replaceAcademicContext({ campus: { id: 'campus-a', name: 'A' }, session: { id: 'session-a', name: 'A', isCurrent: true, startDate: '', endDate: '' }, term: { id: 'term-a', sessionId: 'session-a', name: 'A', isCurrent: true, startDate: '', endDate: '' } }, generation);
    });
    act(() => { generation = controls.beginWorkspaceTransition(); controls.clearAcademicContext(generation); });
    expect(screen.getByTestId('state').textContent).not.toContain('campus-a');
    expect(screen.getByTestId('state').textContent).not.toContain('session-a');
    expect(screen.getByTestId('state').textContent).not.toContain('term-a');
  });

  it('prevents a delayed Tenant A response from committing after Tenant B becomes active', async () => {
    let generation = 1;
    let resolveA!: (value: string[]) => void;
    const delayedA = new Promise<string[]>((resolve) => { resolveA = resolve; });
    const committed: string[][] = [];
    const pending = commitLatest(delayedA, generation, () => generation, (value) => committed.push(value));
    generation += 1;
    committed.push(['tenant-b']);
    resolveA(['tenant-a']);
    await expect(pending).resolves.toBe(false);
    expect(committed).toEqual([['tenant-b']]);
  });

  it('moves School to Personal with a new generation and no school academic selection', () => {
    setup();
    let generation = 0;
    act(() => {
      generation = controls.completeWorkspaceTransition(school('tenant-a'));
      controls.replaceAcademicContext({ campus: { id: 'campus-a', name: 'A' }, session: null, term: null }, generation);
    });
    act(() => {
      generation = controls.beginWorkspaceTransition();
      controls.clearAcademicContext(generation);
      controls.completeWorkspaceTransition({ id: 'personal-1', name: 'Personal', type: 'personal', role: 'Teacher' });
    });
    expect(controls.activeWorkspace.type).toBe('personal');
    expect(controls.campus).toBeNull();
  });

  it('exposes a bounded error state for a failed workspace switch', () => {
    setup();
    act(() => { controls.beginWorkspaceTransition(); controls.failWorkspaceTransition(); });
    expect(screen.getByTestId('state').textContent).toContain('"workspaceFailure":"WORKSPACE_FAILURE"');
  });

  it('requires tenant identity in school query keys and isolates academic scope', () => {
    expect(() => buildQueryKey({ workspaceType: 'school', workspaceId: 'ws-a' }, 'students')).toThrow(/Tenant identity/);
    expect(buildQueryKey({ workspaceType: 'school', workspaceId: 'ws-a', tenantId: 'a', sessionId: 's1' }, 'students'))
      .not.toEqual(buildQueryKey({ workspaceType: 'school', workspaceId: 'ws-a', tenantId: 'a', sessionId: 's2' }, 'students'));
  });
});
