import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Key,
  CreditCard,
  Award,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandMark } from './BrandMark';
import { WorkspaceSwitcherModal } from './WorkspaceSwitcherModal';
import { SubscriptionPlanModal } from '../features/subscription/SubscriptionPlanModal';
import { InvitationsAndCredentialsModal } from '../features/invitations/InvitationsAndCredentialsModal';
import { getAccountModuleAccess } from '../lib/moduleAccess';
import { SchoolGuidedSetupModal } from '../features/onboarding/SchoolGuidedSetupModal';
import { buildSidebarCategories, SidebarModule } from '../lib/sidebarNav';
import { findNavGroupForTab, findNavItem } from '../lib/navigation';
import { lastModuleTab } from '../lib/moduleTabs';

export interface NavSection {
  id?: string;
  title?: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenResultChecker?: () => void;
  onOpenPublicLanding?: () => void;
  onOpenBrandingStudio?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenResultChecker,
  onOpenPublicLanding,
}) => {
  const {
    currentUser,
    currentRole,
    branding,
    currentWorkspace,
    switchSpaceCategory,
  } = useApp();

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState(false);
  const [isGuidedSetupModalOpen, setIsGuidedSetupModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const moduleAccess = getAccountModuleAccess(currentWorkspace, currentRole);
  const categories = buildSidebarCategories(currentRole, currentUser.permissions ?? [], currentWorkspace);
  const activeGroupId = findNavGroupForTab(activeTab)?.id;
  const activeItemId = findNavItem(activeTab)?.id || activeTab;

  const filteredCategories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories
      .map((category) => ({
        ...category,
        modules: category.modules.filter((module) =>
          module.title.toLowerCase().includes(needle)
          || module.description.toLowerCase().includes(needle)
          || module.items.some((item) => item.label.toLowerCase().includes(needle)),
        ),
      }))
      .filter((category) => category.modules.length > 0);
  }, [categories, query]);

  const openModule = (module: SidebarModule) => {
    const remembered = lastModuleTab(module.id);
    const matchFromSearch = query.trim()
      ? module.items.find((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
      : undefined;
    const alreadyOpen = module.items.some((item) => item.id === activeItemId);
    const target = alreadyOpen
      ? activeItemId
      : matchFromSearch?.id || module.items.find((item) => item.id === remembered)?.id || module.items[0]?.id;
    if (target) setActiveTab(target);
    if (isMobileOpen) setIsMobileOpen(false);
    setQuery('');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 select-none overflow-hidden">
      <div className="p-3.5 border-b border-white/8 shrink-0">
        {currentWorkspace.type === 'school' ? (
          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            className={`w-full group flex items-center gap-3 p-2 rounded-xl hover:bg-white/6 transition-colors text-left ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={`${branding.schoolName} (${currentRole})`}
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={`${branding.schoolName} crest`}
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white object-contain shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                {branding.schoolName.slice(0, 2).toUpperCase()}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h2 className="font-display font-bold text-white text-sm tracking-tight truncate">
                    {branding.schoolName}
                  </h2>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  <span className="text-indigo-300 font-semibold">{currentRole}</span>
                  <span className="text-slate-600">·</span>
                  <span className="truncate">{branding.currentTerm}</span>
                </div>
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            className={`w-full group flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/6 transition-colors text-left ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Personal Workspace"
          >
            <BrandMark size="sm" showText={!isCollapsed} textColor="text-white" />
            {!isCollapsed && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-500/20 text-violet-200 rounded-full">
                  {currentWorkspace.role}
                </span>
                <ChevronDown className="w-3 h-3 text-violet-300" />
              </div>
            )}
          </button>
        )}

        {!isCollapsed && (
          <div className="mt-2 pt-2 border-t border-white/8 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {currentWorkspace.type === 'school'
                ? 'School workspace'
                : currentRole === 'Teacher'
                  ? 'Personal teaching'
                  : currentRole === 'Parent'
                    ? 'Family learning'
                    : 'Personal learning'}
            </span>
            <button
              onClick={() => switchSpaceCategory(currentWorkspace.type === 'school' ? 'personal' : 'school')}
              className="text-[10px] font-bold text-indigo-300 hover:text-white bg-white/6 hover:bg-white/10 px-2 py-0.5 rounded-md transition-colors"
            >
              {currentWorkspace.type === 'school' ? 'Personal' : 'School'}
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-3 pt-3 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a module…"
              className="w-full pl-8 pr-8 py-2 text-xs bg-white/6 border border-white/8 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400/60 focus:bg-white/8"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
        {filteredCategories.map((category) => (
          <div key={category.id}>
            {!isCollapsed && (
              <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {category.label}
              </div>
            )}
            {isCollapsed && <div className="mx-2 mb-1 border-t border-white/8" />}
            <div className="space-y-0.5">
              {category.modules.map((module) => {
                const Icon = module.icon;
                const isActive = activeGroupId === module.id;
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => openModule(module)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-colors relative group ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/6'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? module.title : module.description}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-400" />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-200'}`} strokeWidth={1.8} />
                    {!isCollapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{module.title}</span>
                        {module.items.length > 1 && (
                          <span className={`text-[10px] font-bold tabular-nums ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                            {module.items.length}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-white/10">
                        <div className="font-semibold">{module.title}</div>
                        <div className="text-slate-400 text-[10px]">{category.label}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <p className="px-3 py-6 text-xs text-slate-500 text-center">No modules match that search.</p>
        )}

        <div className="pt-2 border-t border-white/8 space-y-0.5">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Shortcuts
            </div>
          )}

          {moduleAccess.launchBlueprint && (
            <button
              onClick={() => setIsGuidedSetupModalOpen(true)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/6 ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="10-Step Launch Blueprint"
            >
              <Rocket className="w-4 h-4 text-indigo-300 shrink-0" />
              {!isCollapsed && <span className="truncate flex-1 text-left">Launch Blueprint</span>}
            </button>
          )}

          {moduleAccess.invitationsAndQr && (
            <button
              onClick={() => setIsInvitationsModalOpen(true)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/6 ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Invitations & QR Credentials"
            >
              <Key className="w-4 h-4 text-violet-300 shrink-0" />
              {!isCollapsed && <span className="truncate flex-1 text-left">Invitations & QR</span>}
            </button>
          )}

          {moduleAccess.subscriptionAndPricing && (
            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/6 ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Subscription & Plans"
            >
              <CreditCard className="w-4 h-4 text-amber-300 shrink-0" />
              {!isCollapsed && <span className="truncate flex-1 text-left">Subscription Plans</span>}
            </button>
          )}

          {onOpenResultChecker && (
            <button
              onClick={onOpenResultChecker}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-indigo-200 hover:bg-white/6 ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Public PIN Result Checker"
            >
              <Award className="w-4 h-4 text-indigo-300 shrink-0" />
              {!isCollapsed && <span className="truncate flex-1 text-left font-semibold">PIN Result Portal</span>}
            </button>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-white/8 bg-black/20 shrink-0 space-y-2">
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/6 border border-white/8 transition-colors text-left ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={`${currentUser.fullName} (${currentRole})`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-white truncate">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentRole}</div>
              </div>
            )}
            {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
          </button>

          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-slate-900">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-bold text-xs text-slate-900">{currentUser.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
              <div className="p-1 space-y-0.5">
                {onOpenPublicLanding && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenPublicLanding();
                    }}
                    className="w-full px-2.5 py-1.5 text-xs text-left text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Public Landing Page</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center justify-end pt-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/6 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-30 bg-slate-950 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-[272px]'
        }`}
      >
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
              className="relative z-10 w-72 max-w-[85vw] h-full bg-slate-950 shadow-2xl flex flex-col"
            >
              <div className="absolute top-3.5 right-3.5 z-20">
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WorkspaceSwitcherModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onNavigateToNewSchool={onOpenPublicLanding}
      />

      {moduleAccess.subscriptionAndPricing && (
        <SubscriptionPlanModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          phase={moduleAccess.subscriptionPhase!}
        />
      )}

      {moduleAccess.invitationsAndQr && (
        <InvitationsAndCredentialsModal
          isOpen={isInvitationsModalOpen}
          onClose={() => setIsInvitationsModalOpen(false)}
        />
      )}

      {moduleAccess.launchBlueprint && (
        <SchoolGuidedSetupModal
          isOpen={isGuidedSetupModalOpen}
          onClose={() => setIsGuidedSetupModalOpen(false)}
          onNavigateToTab={setActiveTab}
        />
      )}
    </>
  );
};
