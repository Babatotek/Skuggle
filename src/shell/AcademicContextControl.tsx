import React from 'react';
import { useAcademicContext } from '../state/ApplicationStateProviders';
import { useApp } from '../context/AppContext';
import type { ShellFamily } from './types';

export const AcademicContextControl: React.FC<{ family: ShellFamily }> = ({ family }) => {
  const academic = useAcademicContext();
  const { sessions, terms } = useApp();

  if (family !== 'school-staff' && family !== 'parent-student') return null;
  if (!academic.session && !academic.term && sessions.length === 0) return null;

  const sessionOptions = sessions.length ? sessions : (academic.session ? [academic.session] : []);
  const termOptions = terms.filter((item) => !academic.session || item.sessionId === academic.session.id);
  const visibleTerms = termOptions.length ? termOptions : (academic.term ? [academic.term] : []);

  const apply = (sessionId: string, termId: string) => {
    const session = sessionOptions.find((item) => item.id === sessionId) ?? academic.session;
    const term = (sessionId === academic.session?.id ? visibleTerms : terms.filter((item) => item.sessionId === sessionId))
      .find((item) => item.id === termId) ?? academic.term;
    academic.replaceAcademicContext(
      { campus: academic.campus, session: session ?? null, term: term ?? null },
      academic.workspaceGeneration,
    );
  };

  return (
    <div className="hidden min-w-0 items-center gap-2 lg:flex" aria-label="Academic context">
      {academic.campus && (
        <span className="max-w-[7rem] truncate text-xs text-[var(--color-text-muted)]" title={academic.campus.name}>
          {academic.campus.name}
        </span>
      )}
      <label className="sr-only" htmlFor="shell-session">Academic session</label>
      <select
        id="shell-session"
        className="ds-focus-ring max-w-[9rem] rounded-[var(--radius-control)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
        value={academic.session?.id ?? ''}
        onChange={(event) => {
          const nextSession = sessionOptions.find((item) => item.id === event.target.value);
          const nextTerm = terms.find((item) => item.sessionId === nextSession?.id && item.isCurrent) ?? terms.find((item) => item.sessionId === nextSession?.id);
          apply(event.target.value, nextTerm?.id ?? '');
        }}
      >
        {sessionOptions.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="shell-term">Term</label>
      <select
        id="shell-term"
        className="ds-focus-ring max-w-[8rem] rounded-[var(--radius-control)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
        value={academic.term?.id ?? ''}
        onChange={(event) => apply(academic.session?.id ?? '', event.target.value)}
      >
        {visibleTerms.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
    </div>
  );
};
