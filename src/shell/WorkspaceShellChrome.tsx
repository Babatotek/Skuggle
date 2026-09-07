import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CommandPalette } from '../components/CommandPalette';
import { ModuleWorkspace } from '../components/ModuleWorkspace';
import { SkuggleAIBuddy } from '../components/SkuggleAIBuddy';
import { Drawer } from '../components/ui/Drawer';
import { useApp } from '../context/AppContext';
import { resolveTenantTheme } from '../lib/designSystem/tenantTheme';
import { breadcrumbsFor } from '../routing/titles';
import { buildRoute, matchCanonicalPath, routeById } from '../routing/builders';
import { useWorkspace } from '../state/ApplicationStateProviders';
import { projectMobilePrimary } from '../routing/primaryNavigation';
import { MobileBottomNav } from './MobileBottomNav';
import { PageFrame } from './PageFrame';
import { readNavMode, readShellDensity, writeNavMode } from './preferences';
import { PrimaryNavigation } from './PrimaryNavigation';
import { ShellHeader } from './ShellHeader';
import { SkipLink } from './SkipLink';
import { useShellLayout } from './useMediaQuery';
import type { NavMode, ShellFamily, ShellNavGroup } from './types';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface WorkspaceShellChromeProps {
  family: ShellFamily;
  groups: ShellNavGroup[];
  activeNavId: string;
  contextNavId: string;
  onNavigateTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const WorkspaceShellChrome: React.FC<WorkspaceShellChromeProps> = ({
  family,
  groups,
  activeNavId,
  contextNavId,
  onNavigateTab,
  onLogout,
  children,
}) => {
  const { branding } = useApp();
  const { activeWorkspace: currentWorkspace } = useWorkspace();
  const { isDesktop, isMobile } = useShellLayout();
  const location = useLocation();
  const [navMode, setNavMode] = useState<NavMode>(readNavMode);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const mobile = projectMobilePrimary(family, groups);
  const matched = matchCanonicalPath(location.pathname);
  const crumbs = matched
    ? breadcrumbsFor(matched.route, routeById).map((item) => ({
        label: item.label,
        href: buildRoute(item.id, matched.params),
      }))
    : [];
  const canvasWidth = matched?.route.pageKey === 'school-home' || matched?.route.pageKey === 'personal-home' || matched?.route.pageKey === 'platform-overview'
    ? 'full' as const
    : 'operational' as const;
  const showRailToggle = family === 'school-staff';
  const effectiveMode = isDesktop && showRailToggle ? navMode : 'expanded';
  const sidebarWidth = effectiveMode === 'rail' ? '4.5rem' : '15.5rem';
  const tenantStyle = (family === 'school-staff' || family === 'parent-student') && currentWorkspace.type === 'school'
    ? resolveTenantTheme(branding.primaryColor)
    : undefined;
  const platformClass = family === 'platform' ? 'bg-[var(--primitive-neutral-50)]' : 'bg-[var(--color-bg-canvas)]';
  const reduced = prefersReducedMotion();
  const usesV2Composition = matched?.route.id.startsWith('school.people.students')
    || matched?.route.id === 'school.people.guardians'
    || matched?.route.id.startsWith('school.people.workforce')
      || matched?.route.id.startsWith('school.admissions')
      || matched?.route.domain === 'assessment';

  useEffect(() => {
    document.documentElement.dataset.density = readShellDensity();
  }, []);

  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop, location.pathname]);

  const toggleNavMode = () => {
    const next = navMode === 'rail' ? 'expanded' : 'rail';
    setNavMode(next);
    writeNavMode(next);
  };

  const nav = (
    <PrimaryNavigation
      groups={groups}
      activeId={activeNavId}
      mode={effectiveMode}
      onNavigate={() => setDrawerOpen(false)}
    />
  );

  return (
    <div
      className={`flex min-h-screen ${platformClass}`}
      data-shell-family={family}
      data-nav-mode={effectiveMode}
      style={tenantStyle}
    >
      <SkipLink />
      {isDesktop && (
        <aside
          className={`fixed inset-y-0 left-0 z-[var(--z-nav)] hidden border-r border-[var(--color-border-default)] bg-[var(--color-surface-raised)] lg:flex lg:flex-col ${reduced ? '' : 'transition-[width] duration-[var(--motion-standard)]'}`}
          style={{ width: sidebarWidth }}
          aria-label="Workspace"
        >
          {family === 'platform' && (
            <p className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-status-restricted-text)]">Platform</p>
          )}
          {nav}
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col" style={isDesktop ? { paddingLeft: sidebarWidth } : undefined}>
        <ShellHeader
          family={family}
          navMode={navMode}
          onToggleNavMode={toggleNavMode}
          onOpenTabletNav={() => setDrawerOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onLogout={onLogout}
          showDesktopNavToggle={showRailToggle && isDesktop}
        />
        {family === 'platform' && <div data-shell-slot="support-session" hidden />}
        <main id="main-content" tabIndex={-1} className={`flex min-w-0 flex-1 flex-col outline-none ${isMobile ? 'pb-[calc(2.75rem+env(safe-area-inset-bottom))]' : ''}`}>
          {usesV2Composition ? (
            <PageFrame width={canvasWidth}>{children}</PageFrame>
          ) : (
            <ModuleWorkspace activeTab={contextNavId} onSelectTab={onNavigateTab}>
              <PageFrame breadcrumbs={crumbs} width={canvasWidth}>
                {children}
              </PageFrame>
            </ModuleWorkspace>
          )}
        </main>
      </div>
      <Drawer
        isOpen={!isDesktop && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Navigation"
        placement="left"
        size="sm"
        closeOnBackdrop
        ariaLabel="Navigation"
      >
        {nav}
      </Drawer>
      {isMobile && <MobileBottomNav primary={mobile.primary} more={mobile.more} activeId={activeNavId} />}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={onNavigateTab} />
      <SkuggleAIBuddy variant="floating" />
    </div>
  );
};
