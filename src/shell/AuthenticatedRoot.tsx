import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { useApp } from '../context/AppContext';
import { findNavItem, workspaceKind } from '../lib/navigation';
import { RouteLoading } from '../routing/RouteSurfaces';
import { buildRoute, legacyNavIdForRoute, matchCanonicalPath, routeFromLegacyNavId, workspaceDefaultRoute } from '../routing/builders';
import { primaryNavigationIdForRoute, projectPrimaryNavigation, resolveShellFamily } from '../routing/primaryNavigation';
import { reportRoutingSignal } from '../routing/telemetry';
import { useAccess, useWorkspace } from '../state/ApplicationStateProviders';
import { ParentStudentShell, PersonalShell, PlatformShell, SchoolStaffShell } from './family';

export const AuthenticatedRoot: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { currentRole } = useApp();
  const workspace = useWorkspace();
  const access = useAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const previousId = useRef(workspace.activeWorkspace.id);
  const matched = matchCanonicalPath(location.pathname);
  const contextNavId = matched ? legacyNavIdForRoute(matched.route) : 'home';
  const activeNavId = matched ? primaryNavigationIdForRoute(matched.route) : 'school.home';

  const onNavigateTab = useCallback((tab: string) => {
    const resolved = findNavItem(tab)?.id || tab;
    const route = routeFromLegacyNavId(resolved);
    if (!route) {
      reportRoutingSignal('unknown_route', { source: 'nav', tab: resolved.slice(0, 40) });
      navigate('/not-found');
      return;
    }
    navigate(buildRoute(route.id));
  }, [navigate]);

  const family = resolveShellFamily(workspace.activeWorkspace.type, currentRole);
  const navCapabilities = Array.from(new Set([
    ...access.capabilities,
    // Keep primary nav visible when session still carries only legacy permission names.
    ...access.legacyPermissions.flatMap((permission) => {
      if (permission === 'admissions.manage') return ['admissions.application.manage', 'admissions.application.view'];
      return [permission];
    }),
  ]));
  const groups = projectPrimaryNavigation({
    family,
    capabilities: navCapabilities,
    workspace: workspaceKind(workspace.activeWorkspace.type),
  });

  const sessionBoundaryPending = workspace.status === 'IDLE'
    || workspace.status === 'LOADING'
    || workspace.status === 'SWITCHING'
    || access.status === 'IDLE'
    || access.status === 'LOADING';

  useEffect(() => {
    if (workspace.status !== 'READY') return;
    const previous = previousId.current;
    previousId.current = workspace.activeWorkspace.id;
    if (!previous || previous === workspace.activeWorkspace.id) return;
    const type = workspace.activeWorkspace.type;
    const path = location.pathname;
    const matchesType = (type === 'school' && path.startsWith('/school'))
      || (type === 'personal' && path.startsWith('/personal'))
      || (type === 'platform' && path.startsWith('/platform'));
    if (!matchesType && (type === 'school' || type === 'personal' || type === 'platform')) {
      navigate(buildRoute(workspaceDefaultRoute(type).id));
    }
    requestAnimationFrame(() => document.getElementById('workspace-identity')?.focus());
  }, [workspace.status, workspace.activeWorkspace.id, workspace.activeWorkspace.type, location.pathname, navigate]);

  const Shell = family === 'platform'
    ? PlatformShell
    : family === 'personal'
      ? PersonalShell
      : family === 'parent-student'
        ? ParentStudentShell
      : SchoolStaffShell;

  if (sessionBoundaryPending) return <RouteLoading />;

  return (
    <Shell key={workspace.activeWorkspace.id} groups={groups} activeNavId={activeNavId} contextNavId={contextNavId} onNavigateTab={onNavigateTab} onLogout={onLogout}>
      <AppErrorBoundary preserveShell resetKey={location.pathname}>
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </AppErrorBoundary>
    </Shell>
  );
};
