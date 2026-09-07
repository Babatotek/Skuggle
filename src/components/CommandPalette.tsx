import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { visibleNavItems, workspaceKind } from '../lib/navigation';
import { navIcon } from '../lib/navIcons';
import { routeFromLegacyNavId } from '../routing/builders';
import { hasNavigationRouteAccess, primaryNavigationIdForRoute } from '../routing/primaryNavigation';
import { useAccess } from '../state/ApplicationStateProviders';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (tabId: string) => void;
}

function rank(query: string, ...fields: string[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  let best = 0;
  for (const field of fields) {
    const value = field.toLowerCase();
    if (value === q) best = Math.max(best, 100);
    else if (value.startsWith(q)) best = Math.max(best, 90);
    else if (value.includes(q)) best = Math.max(best, 70);
    else {
      let i = 0;
      for (const char of value) {
        if (char === q[i]) i += 1;
        if (i === q.length) {
          best = Math.max(best, 40);
          break;
        }
      }
    }
  }
  return best;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, onSelect }) => {
  const { currentRole, currentUser, currentWorkspace } = useApp();
  const access = useAccess();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () =>
      visibleNavItems({
        role: currentRole,
        permissions: currentUser.permissions ?? [],
        workspace: workspaceKind(currentWorkspace.type),
      }).flatMap((item) => {
        const route = routeFromLegacyNavId(item.id);
        if (!route || !hasNavigationRouteAccess(route, access.capabilities)) return [];
        return [{ ...item, destinationType: primaryNavigationIdForRoute(route) === route.id ? 'Primary destination' : 'Contextual destination' }];
      }),
    [currentRole, currentUser.permissions, currentWorkspace.type, access.capabilities],
  );

  const results = useMemo(() => {
    const scored = items
      .map((item) => ({
        item,
        score: rank(query, item.label, item.module, item.category),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
    return scored.slice(0, 12).map((entry) => entry.item);
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => Math.min(results.length - 1, index + 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
      }
      if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault();
        onSelect(results[activeIndex].id);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, activeIndex, onClose, onSelect]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" aria-label="Close command palette" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Jump to a module" className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jump to a module or section…"
            className="flex-1 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
          {results.length === 0 && (
            <p className="px-4 py-8 text-sm text-slate-500 text-center">No matching sections.</p>
          )}
          {results.map((item, index) => {
            const Icon = navIcon(item.icon);
            const active = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${active ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-indigo-950 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 truncate">{item.label}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{item.destinationType} · {item.category} · {item.module}</span>
                </span>
                {active && <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400 font-medium">
          <span className="inline-flex items-center gap-1"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> navigate</span>
          <span className="inline-flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> open</span>
        </div>
      </div>
    </div>
  );
};
