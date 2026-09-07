import React, { useEffect, useId, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { navIcon } from '../lib/navIcons';
import type { NavMode } from './types';
import type { ShellNavGroup, ShellNavItem } from './types';

export interface PrimaryNavigationProps {
  groups: ShellNavGroup[];
  activeId: string;
  mode?: NavMode;
  onNavigate?: () => void;
}

export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({
  groups,
  activeId,
  mode = 'expanded',
  onNavigate,
}) => {
  const labelId = useId();
  const rail = mode === 'rail';
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.id, Boolean(group.collapsedByDefault)])),
  );

  useEffect(() => {
    setCollapsed((current) => {
      const next = { ...current };
      for (const group of groups) {
        if (next[group.id] === undefined) next[group.id] = Boolean(group.collapsedByDefault);
      }
      return next;
    });
  }, [groups]);

  return (
    <nav aria-labelledby={labelId} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3">
      <h2 id={labelId} className="sr-only">Primary</h2>
      {groups.map((group) => {
        const isCollapsed = !rail && collapsed[group.id] && group.items.every((item) => item.id !== activeId);
        return (
          <div key={group.id} className="mb-3">
            {!rail && (
              <button
                type="button"
                className="ds-focus-ring mb-1 flex min-h-11 w-full items-center justify-between rounded-[var(--radius-control)] px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
                aria-expanded={!isCollapsed}
                onClick={() => setCollapsed((current) => ({ ...current, [group.id]: !current[group.id] }))}
              >
                <span>{group.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-[var(--motion-micro)] ${isCollapsed ? '-rotate-90' : ''}`} aria-hidden="true" />
              </button>
            )}
            {!isCollapsed && (
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NavItemLink item={item} active={item.id === activeId} rail={rail} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const NavItemLink: React.FC<{ item: ShellNavItem; active: boolean; rail: boolean; onNavigate?: () => void }> = ({
  item,
  active,
  rail,
  onNavigate,
}) => {
  const Icon = navIcon(item.icon);
  return (
    <NavLink
      to={item.href}
      end
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={rail ? item.label : undefined}
      className={`ds-focus-ring group flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-2.5 text-sm font-medium transition-colors duration-[var(--motion-micro)] ${
        active
          ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] shadow-[inset_3px_0_0_var(--tenant-identity-accent)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]'
      } ${rail ? 'justify-center px-0' : ''}`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {rail ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
    </NavLink>
  );
};
