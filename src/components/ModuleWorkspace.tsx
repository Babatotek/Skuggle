import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Settings2, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  categoryLabel,
  findNavGroupForTab,
  findNavItem,
  visibleNavGroups,
  workspaceKind,
} from '../lib/navigation';
import { navIcon } from '../lib/navIcons';
import { rememberModuleTab } from '../lib/moduleTabs';

interface ModuleWorkspaceProps {
  activeTab: string;
  onSelectTab: (id: string) => void;
  children: React.ReactNode;
}

export const ModuleWorkspace: React.FC<ModuleWorkspaceProps> = ({ activeTab, onSelectTab, children }) => {
  const { currentRole, currentUser, currentWorkspace } = useApp();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const groups = visibleNavGroups({
    role: currentRole,
    permissions: currentUser.permissions ?? [],
    workspace: workspaceKind(currentWorkspace.type),
  });

  const resolved = findNavItem(activeTab);
  const group = findNavGroupForTab(activeTab);
  const visibleGroup = group ? groups.find((entry) => entry.id === group.id) : undefined;
  const tabs = visibleGroup?.items ?? [];
  const isDashboard = !visibleGroup || visibleGroup.id === 'dashboard';
  const showTabs = tabs.length > 1;

  useEffect(() => {
    if (visibleGroup && resolved) rememberModuleTab(visibleGroup.id, resolved.id);
  }, [visibleGroup, resolved]);

  const updateOverflow = () => {
    const node = scrollerRef.current;
    if (!node) return;
    setCanScrollLeft(node.scrollLeft > 8);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 8);
  };

  useEffect(() => {
    updateOverflow();
    const node = scrollerRef.current;
    if (!node) return;
    node.addEventListener('scroll', updateOverflow);
    window.addEventListener('resize', updateOverflow);
    return () => {
      node.removeEventListener('scroll', updateOverflow);
      window.removeEventListener('resize', updateOverflow);
    };
  }, [tabs.length, activeTab]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTab]);

  // Assessment owns its complete six-tab lifecycle shell. Rendering the generic
  // module header here would reintroduce the retired 14-tab navigation above it.
  if (isDashboard || visibleGroup?.id === 'assessment') {
    return <>{children}</>;
  }

  const ModuleIcon = navIcon(visibleGroup.icon);
  const ActiveIcon = navIcon(resolved?.icon);
  const category = categoryLabel(visibleGroup.category);
  const isSchool = visibleGroup.id === 'school';
  const isPeople = visibleGroup.id === 'people';

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0">
          <div className="flex items-start gap-3.5 mb-4">
            {!isSchool && !isPeople && <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-100 flex items-center justify-center shadow-sm shrink-0">
              <ModuleIcon className="w-5 h-5" strokeWidth={1.75} />
            </div>}
            <div className="min-w-0 flex-1">
              {!isSchool && !isPeople && <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                <span className="uppercase tracking-[0.14em]">{category}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500">{visibleGroup.label}</span>
                {showTabs && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold tabular-nums">
                    {tabs.length}
                  </span>
                )}
              </div>}
              <div className="flex items-baseline gap-2 min-w-0">
                <h2 className="font-display font-bold text-slate-900 text-lg leading-tight tracking-tight truncate">
                  {isSchool ? `School ${resolved?.label || 'Overview'}` : isPeople ? 'People' : resolved?.label || visibleGroup.label}
                </h2>
                {!isSchool && !isPeople && ActiveIcon && resolved && (
                  <ActiveIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0 hidden sm:block" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{isSchool ? "Manage your school's information, structure and academic operations." : isPeople ? 'Manage students, teachers, staff and guardians with focused workflows.' : visibleGroup.description}</p>
            </div>
            {isSchool && <div className="hidden sm:flex items-center gap-2 self-center">
              <button type="button" className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"><Zap className="h-3.5 w-3.5" />Quick Actions<ChevronDown className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => onSelectTab('school-settings-hub')} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"><Settings2 className="h-3.5 w-3.5" />School Settings</button>
            </div>}
          </div>

          {showTabs && (
            <div className="relative -mx-1">
              {canScrollLeft && (
                <button
                  type="button"
                  aria-label="Scroll tabs left"
                  onClick={() => scrollerRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {canScrollRight && (
                <button
                  type="button"
                  aria-label="Scroll tabs right"
                  onClick={() => scrollerRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <div
                ref={scrollerRef}
                role="tablist"
                aria-label={`${visibleGroup.label} sections`}
                className={`module-tabs-scroller flex items-stretch gap-0.5 overflow-x-auto px-1 ${
                  canScrollLeft || canScrollRight ? 'px-9' : ''
                }`}
              >
                {tabs.map((item) => {
                  const Icon = navIcon(item.icon);
                  const isActive = (resolved?.id || activeTab) === item.id;
                  return (
                    <button
                      key={item.id}
                      ref={isActive ? activeRef : undefined}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onSelectTab(item.id)}
                      className={`relative shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-indigo-950'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} strokeWidth={1.85} />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};
