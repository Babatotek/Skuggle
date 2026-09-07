import React, { useId, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { navIcon } from '../lib/navIcons';
import { Drawer } from '../components/ui/Drawer';
import type { ShellNavItem } from './types';

export interface MobileBottomNavProps {
  primary: ShellNavItem[];
  more: ShellNavItem[];
  activeId: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ primary, more, activeId }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const labelId = useId();

  return (
    <>
      <nav
        aria-labelledby={labelId}
        className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-[var(--color-border-default)] bg-[var(--color-surface-raised)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <h2 id={labelId} className="sr-only">Primary</h2>
        <ul className="grid grid-cols-5">
          {primary.slice(0, 4).map((item) => {
            const Icon = navIcon(item.icon);
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.href}
                  end
                  aria-current={active ? 'page' : undefined}
                  className={`ds-focus-ring flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${
                    active ? 'text-[var(--color-action-primary)]' : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              className="ds-focus-ring flex min-h-11 w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium text-[var(--color-text-muted)]"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>
      <Drawer isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="More" placement="left" size="sm" closeOnBackdrop>
        <ul className="space-y-1">
          {more.map((item) => {
            const Icon = navIcon(item.icon);
            return (
              <li key={item.id}>
                <NavLink
                  to={item.href}
                  end
                  onClick={() => setMoreOpen(false)}
                  aria-current={item.id === activeId ? 'page' : undefined}
                  className="ds-focus-ring flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
          {more.length === 0 && <li className="px-3 py-6 text-sm text-[var(--color-text-muted)]">No additional destinations.</li>}
        </ul>
      </Drawer>
    </>
  );
};
