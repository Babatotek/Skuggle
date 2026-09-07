import React from 'react';
import { BrandMark } from '../components/BrandMark';
import { resolveTenantTheme } from '../lib/designSystem/tenantTheme';
import type { WorkspaceItem } from '../types';
import type { ShellFamily } from './types';

export interface WorkspaceIdentityProps {
  family: ShellFamily;
  workspace: WorkspaceItem;
  schoolName?: string;
  logoUrl?: string;
  accent?: string;
  onSwitch: () => void;
}

export const WorkspaceIdentity: React.FC<WorkspaceIdentityProps> = ({
  family,
  workspace,
  schoolName,
  logoUrl,
  accent,
  onSwitch,
}) => {
  const name = family === 'school-staff' || family === 'parent-student'
    ? (schoolName || workspace.name)
    : workspace.name;
  const label = family === 'platform' ? 'Platform' : family === 'personal' ? 'Personal' : name;
  const theme = family === 'school-staff' || family === 'parent-student' ? resolveTenantTheme(accent) : undefined;

  return (
    <button
      type="button"
      id="workspace-identity"
      onClick={onSwitch}
      style={theme}
      className="ds-focus-ring flex min-h-11 min-w-0 items-center gap-2.5 rounded-[var(--radius-control)] px-1.5 text-left hover:bg-[var(--color-surface-muted)]"
      aria-haspopup="dialog"
      aria-label={`Current workspace: ${label}. Switch workspace`}
    >
      {family === 'platform' ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primitive-neutral-800)] text-[10px] font-bold text-[var(--color-action-on-primary)]">P</span>
      ) : family === 'personal' ? (
        <BrandMark size="sm" showText={false} />
      ) : logoUrl ? (
        <img src={logoUrl} alt="" className="h-8 w-8 rounded-[var(--radius-control)] border border-[var(--color-border-default)] object-contain bg-[var(--color-surface)]" />
      ) : (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-[10px] font-bold text-[var(--color-action-on-primary)]"
          style={{ background: 'var(--tenant-identity-accent)' }}
        >
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{label}</span>
        {family === 'platform' && <span className="block text-[11px] font-medium text-[var(--color-status-restricted-text)]">Privileged operations</span>}
        {(family === 'school-staff' || family === 'parent-student') && (
          <span className="block truncate text-[11px] text-[var(--color-text-muted)]">Skuggle</span>
        )}
      </span>
    </button>
  );
};
