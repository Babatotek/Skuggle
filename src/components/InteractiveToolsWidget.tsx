import React, { useEffect, useId, useRef, useState } from 'react';
import { Wrench, X, ChevronUp } from 'lucide-react';
import type { UserRole } from '../types';
import { getToolsForRole } from '../data/interactiveTools';

interface InteractiveToolsWidgetProps {
  currentRole: UserRole;
  onOpenModal: (modalName: string, data?: unknown) => void;
  onNavigate?: (path: string) => void;
  /** Navbar dropdown (default) or legacy floating pill */
  variant?: 'navbar' | 'floating';
  className?: string;
  /** Called when the panel opens so parent nav menus can close */
  onOpen?: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  landing: 'Visitor',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  principal: 'Principal',
  super_admin: 'Super Admin',
  parent: 'Parent',
  student: 'Student',
  bursar: 'Bursar',
  examination_officer: 'Examination Officer',
};

/**
 * Quick-access menu for role-applicable interactive tools.
 * Renders in the navigation bar by default.
 */
export const InteractiveToolsWidget: React.FC<InteractiveToolsWidgetProps> = ({
  currentRole,
  onOpenModal,
  onNavigate,
  variant = 'navbar',
  className = '',
  onOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const tools = getToolsForRole(currentRole);

  useEffect(() => {
    setIsOpen(false);
  }, [currentRole]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (tools.length === 0) return null;

  const toggle = () => {
    setIsOpen((open) => {
      const next = !open;
      if (next) onOpen?.();
      return next;
    });
  };

  const panel = isOpen ? (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={
        variant === 'navbar'
          ? 'absolute right-0 top-full z-50 mt-2 w-[min(92vw,20.5rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200'
          : 'w-[min(92vw,20.5rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-md animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200'
      }
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-3.5 py-3">
        <div className="min-w-0">
          <p id={titleId} className="text-sm font-bold tracking-tight text-slate-900">
            Tools pack
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
            Quick actions for {ROLE_LABELS[currentRole]}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close tools"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="max-h-[min(60vh,22rem)] space-y-1 overflow-y-auto p-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={tool.id}>
              <button
                type="button"
                id={`widget-tool-${tool.id}`}
                onClick={() => {
                  if (tool.route && onNavigate) {
                    onNavigate(tool.route);
                  } else {
                    onOpenModal(tool.modal);
                  }
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-colors ${tool.accent.bg} ${tool.accent.hover} ${tool.accent.border}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm ${tool.accent.icon}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-xs font-bold ${tool.accent.text}`}>
                    {tool.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] leading-snug text-slate-500">
                    {tool.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  if (variant === 'floating') {
    return (
      <div
        ref={panelRef}
        className={`fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6 ${className}`}
      >
        {panel}
        <button
          type="button"
          id="btn-toggle-tools-widget"
          aria-expanded={isOpen}
          aria-controls={isOpen ? titleId : undefined}
          onClick={toggle}
          className="group flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-600 px-3.5 py-2.5 text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
          <span className="text-xs font-bold tracking-wide">
            {isOpen ? 'Hide tools' : 'Tools'}
          </span>
          {!isOpen && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold tabular-nums">
              {tools.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      <button
        type="button"
        id="btn-toggle-tools-widget"
        aria-expanded={isOpen}
        aria-controls={isOpen ? titleId : undefined}
        onClick={toggle}
        title="Tools pack"
        className={`relative flex items-center gap-1.5 rounded-xl px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
          isOpen
            ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
      >
        <Wrench className="h-5 w-5" />
        <span className="hidden text-xs font-semibold sm:inline">Tools</span>
        {!isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
            {tools.length}
          </span>
        )}
      </button>
      {panel}
    </div>
  );
};
