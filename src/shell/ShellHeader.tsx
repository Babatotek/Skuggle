import React, { useState } from 'react';
import { Menu, PanelLeft, PanelLeftClose, Search, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWorkspace } from '../state/ApplicationStateProviders';
import { WorkspaceSwitcherModal } from '../components/WorkspaceSwitcherModal';
import { AcademicContextControl } from './AcademicContextControl';
import { ShellActionCluster } from './ShellActionCluster';
import { WorkspaceIdentity } from './WorkspaceIdentity';
import type { NavMode, ShellFamily } from './types';

export interface ShellHeaderProps {
  family: ShellFamily;
  navMode: NavMode;
  onToggleNavMode: () => void;
  onOpenTabletNav: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
  showDesktopNavToggle: boolean;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  family,
  navMode,
  onToggleNavMode,
  onOpenTabletNav,
  onOpenSearch,
  onLogout,
  showDesktopNavToggle,
}) => {
  const { branding, isOnline, offlineQueue, syncOfflineQueue } = useApp();
  const { activeWorkspace: currentWorkspace } = useWorkspace();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const school = family === 'school-staff' || family === 'parent-student';

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border-default)] bg-[var(--color-surface-raised)]">
      {(!isOnline || offlineQueue.length > 0) && (
        <div className="flex items-center justify-between gap-3 bg-[var(--color-status-attention-bg)] px-4 py-1.5 text-xs font-semibold text-[var(--color-status-attention-text)]">
          <span className="flex items-center gap-2">
            <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
            {!isOnline ? 'Offline. Queued changes will sync when you reconnect.' : `${offlineQueue.length} offline changes waiting to sync.`}
          </span>
          <button type="button" className="ds-focus-ring underline" onClick={syncOfflineQueue}>Retry sync</button>
        </div>
      )}
      <div className="flex h-16 items-center gap-3 px-3 sm:px-4">
        <button
          type="button"
          className="ds-focus-ring hidden min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] md:flex lg:hidden"
          aria-label="Open navigation"
          onClick={onOpenTabletNav}
        >
          <Menu className="h-5 w-5" />
        </button>
        {showDesktopNavToggle && (
          <button
            type="button"
            className="ds-focus-ring hidden min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] lg:flex"
            aria-label={navMode === 'rail' ? 'Expand navigation' : 'Collapse navigation to icons'}
            onClick={onToggleNavMode}
          >
            {navMode === 'rail' ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        )}
        <WorkspaceIdentity
          family={family}
          workspace={currentWorkspace}
          schoolName={school ? branding.schoolName || currentWorkspace.name : undefined}
          logoUrl={school ? (currentWorkspace.logoUrl || branding.logoUrl) : undefined}
          accent={school ? branding.primaryColor : undefined}
          onSwitch={() => setSwitcherOpen(true)}
        />
        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <AcademicContextControl family={family} />
        </div>
        <button
          type="button"
          className="ds-focus-ring flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] lg:hidden"
          aria-label="Search"
          onClick={onOpenSearch}
        >
          <Search className="h-5 w-5" />
        </button>
        <div className="ml-auto">
          <ShellActionCluster family={family} onOpenSearch={onOpenSearch} onLogout={onLogout} showSearch />
        </div>
      </div>
      <WorkspaceSwitcherModal isOpen={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </header>
  );
};
