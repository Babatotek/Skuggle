import React from 'react';
import { NavLink } from 'react-router-dom';
import { STUDENT_SERVICE_SECTIONS } from '../../routing/studentServices';

export const StudentServicesContextNav: React.FC = () => (
  <nav aria-label="Student services sections" className="overflow-x-auto border-b border-[var(--color-border-default)]">
    <ul className="flex min-w-max gap-1">
      {STUDENT_SERVICE_SECTIONS.map((item) => (
        <li key={item.id}>
          <NavLink
            end={item.id === 'behaviour'}
            to={item.path}
            className={({ isActive }) => `ds-focus-ring relative block rounded-t-[var(--radius-control)] px-3 py-3 text-sm font-semibold ${
              isActive ? 'text-[var(--color-action-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {({ isActive }) => (
              <>
                {item.label}
                {isActive && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 bg-[var(--color-action-primary)]" />}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);
