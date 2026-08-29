import React, { useEffect, useState } from 'react';
import {
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  Wifi,
  WifiOff,
  User,
  Shield,
  Layers,
  LogOut,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Menu,
  X,
  CreditCard,
  Key,
  Rocket,
  PanelLeftClose,
  PanelLeft,
  Award,
  Volume2,
  VolumeX,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandMark } from './BrandMark';
import { WorkspaceSwitcherModal } from './WorkspaceSwitcherModal';
import { SubscriptionPlanModal } from '../features/subscription/SubscriptionPlanModal';
import { InvitationsAndCredentialsModal } from '../features/invitations/InvitationsAndCredentialsModal';
import { getAccountModuleAccess } from '../lib/moduleAccess';
import { SchoolGuidedSetupModal } from '../features/onboarding/SchoolGuidedSetupModal';
import { notificationSoundEnabled, setNotificationSoundEnabled } from '../lib/notificationAudio';
import { SecuritySettingsModal } from '../features/security/SecuritySettingsModal';
import { apiRequest } from '../lib/apiClient';

interface HeaderNotification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'warning' | 'error' | 'failed' | 'info';
  createdAt: string;
  read?: boolean;
  persisted?: boolean;
}

interface NotificationInboxResponse { success: true; data: { unreadCount: number; data: HeaderNotification[] } }

interface AppHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenResultChecker?: () => void;
  onOpenPublicLanding?: () => void;
  onOpenBrandingStudio?: () => void;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onLogout?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenResultChecker,
  onOpenPublicLanding,
  onOpenBrandingStudio,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onLogout,
}) => {
  const {
    currentUser,
    currentRole,
    branding,
    currentWorkspace,
    isOnline,
    offlineQueue,
    syncOfflineQueue,
  } = useApp();

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState(false);
  const [isGuidedSetupModalOpen, setIsGuidedSetupModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(notificationSoundEnabled);
  const moduleAccess = getAccountModuleAccess(currentWorkspace, currentRole);

  useEffect(() => {
    const receive = (event: Event) => {
      const item = (event as CustomEvent<HeaderNotification>).detail;
      setNotifications((current) => [{ ...item, read: false, persisted: false }, ...current].slice(0, 50));
    };
    window.addEventListener('skuggle:notification', receive);
    return () => window.removeEventListener('skuggle:notification', receive);
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<NotificationInboxResponse>('/notifications', { suppressErrorNotification: true })
      .then((response) => { if (active) setNotifications((local) => [...local, ...response.data.data.map((item) => ({ ...item, persisted: true }))].slice(0, 50)); })
      .catch(() => { /* Inbox failure must not prevent the workspace from loading. */ });
    return () => { active = false; };
  }, []);

  const markAllNotificationsRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    try { await apiRequest('/notifications/read-all', { method: 'PATCH', headers: { 'Idempotency-Key': crypto.randomUUID() } }); } catch { /* Global error feedback handles retry guidance. */ }
  };

  const markNotificationRead = async (item: HeaderNotification) => {
    setNotifications((items) => items.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
    if (!item.persisted) return;
    try { await apiRequest(`/notifications/${encodeURIComponent(item.id)}/read`, { method: 'PATCH', headers: { 'Idempotency-Key': crypto.randomUUID() } }); } catch { /* Global error feedback handles retry guidance. */ }
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  // Tab Title & Breadcrumbs Helper
  const getTabInfo = (tabId: string) => {
    switch (tabId) {
      case 'home':
        return { title: 'Dashboard Overview', category: 'Overview' };
      case 'students':
        return { title: 'Students Registry', category: 'Academics' };
      case 'academics':
        return { title: 'Curriculum & Classes', category: 'Academics' };
      case 'report-cards':
        return { title: 'Report Card Generator', category: 'Reports' };
      case 'attendance':
        return { title: 'Attendance Register', category: 'Daily Operations' };
      case 'timetable':
        return { title: 'Timetable & Schedules', category: 'Academics' };
      case 'cbt':
        return { title: 'CBT Quiz Engine', category: 'Evaluation' };
      case 'broadcasts':
        return { title: 'Broadcast Center', category: 'Communications' };
      case 'finance':
        return { title: 'Fee Structure & Billing', category: 'Finance' };
      case 'people':
      case 'staff':
        return { title: 'Staff & Invitations', category: 'Administration' };
      case 'assessments':
        return { title: 'Assessment Studio', category: 'Continuous Assessment' };
      case 'results':
        return { title: 'Results & PIN Management', category: 'Examination' };
      case 'branding':
        return { title: 'School Branding Studio', category: 'Customization' };
      case 'smartmark':
        return { title: 'SmartMark OCR Scanner', category: 'Teacher AI' };
      case 'teacher-ai':
      case 'lessons':
        return { title: 'AI Lesson Planner', category: 'Teacher AI' };
      case 'schools':
        return { title: 'Tenant Schools Portfolio', category: 'Platform' };
      case 'health':
        return { title: 'System Diagnostics & Health', category: 'Platform' };
      case 'governance':
        return { title: 'Audit Logs & Governance', category: 'Security' };
      default:
        return { title: 'Workspace', category: 'School' };
    }
  };

  const tabInfo = getTabInfo(activeTab);

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        {/* Offline Simulation / Sync Alert Banner */}
        {(!isOnline || offlineQueue.length > 0) && (
          <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5" />
              <span>
                {!isOnline
                  ? 'Offline Mode Active — Attendance drafts and offline scores will sync automatically once reconnected.'
                  : `${offlineQueue.length} offline changes queued for synchronization.`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={syncOfflineQueue}
                className="underline hover:text-white text-[11px] cursor-pointer"
              >
                Retry sync
              </button>
              {isOnline && offlineQueue.length > 0 && (
                <button
                  onClick={syncOfflineQueue}
                  className="px-2.5 py-0.5 bg-slate-900 text-white rounded-lg text-[11px] hover:bg-black font-semibold cursor-pointer"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>
        )}

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Mobile Toggle / Desktop Collapse Toggle & Page Breadcrumbs */}
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Hamburger Trigger */}
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Open Sidebar Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Sidebar Collapse / Expand Toggle */}
              {onToggleSidebarCollapse && (
                <button
                  type="button"
                  onClick={onToggleSidebarCollapse}
                  className="hidden lg:flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                  {isSidebarCollapsed ? (
                    <PanelLeft className="w-5 h-5" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Breadcrumbs & Active Title */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                  <span className="hidden sm:inline">
                    {currentWorkspace.type === 'school'
                      ? branding.schoolName
                      : currentRole === 'Teacher'
                        ? 'Personal Teaching Space'
                        : currentRole === 'Parent'
                          ? 'Family Learning Space'
                          : 'Personal Learning Space'}
                  </span>
                  <span className="hidden sm:inline">/</span>
                  <span className="text-slate-600 font-semibold">{tabInfo.category}</span>
                </div>
                <h1 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                  {tabInfo.title}
                </h1>
              </div>
            </div>

            {/* Middle: Quick Search Input Placeholder */}
            <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students, subjects, reports..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right: Actions, PIN Checker, Offline Indicator & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Public Result PIN Checker Button */}
              {onOpenResultChecker && (
                <button
                  type="button"
                  onClick={onOpenResultChecker}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>PIN Result Checker</span>
                </button>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((open) => !open)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200/60 transition-colors"
                  title="Notifications"
                  aria-label={`${unreadCount} unread notifications`}
                  aria-expanded={isNotificationsOpen}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[min(92vw,380px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-3 bg-indigo-950 text-white flex items-center justify-between">
                      <div><p className="text-sm font-bold">Notifications</p><p className="text-[11px] text-indigo-200">{unreadCount} unread</p></div>
                      <div className="flex gap-1">
                        <button type="button" className="p-2 rounded-lg hover:bg-white/10" aria-label={soundEnabled ? 'Mute notification sounds' : 'Enable notification sounds'} onClick={() => { const next = !soundEnabled; setSoundEnabled(next); setNotificationSoundEnabled(next); }}>{soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}</button>
                        <button type="button" className="p-2 rounded-lg hover:bg-white/10" aria-label="Mark all as read" onClick={() => void markAllNotificationsRead()}><CheckCheck className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">You are all caught up.</p> : notifications.map((item) => (
                        <button key={item.id} type="button" onClick={() => void markNotificationRead(item)} className={`w-full p-3 text-left border-b border-slate-100 hover:bg-slate-50 ${item.read ? 'opacity-70' : 'bg-indigo-50/40'}`}>
                          <div className="flex gap-2"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-emerald-500' : item.type === 'warning' ? 'bg-amber-500' : item.type === 'info' ? 'bg-indigo-500' : 'bg-rose-500'}`} /><div><p className="text-xs font-bold text-slate-900">{item.title}</p>{item.description && <p className="mt-0.5 text-[11px] leading-4 text-slate-600">{item.description}</p>}<time className="mt-1 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div></div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile & Role Quick Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {currentUser.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-bold text-slate-900 block leading-none">
                      {currentUser.fullName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold leading-none">
                      {currentRole}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-slate-900">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                      <p className="font-display font-bold text-sm text-slate-900">{currentUser.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/60 text-[11px] font-semibold text-indigo-700">
                        <span>Current Role:</span>
                        <strong className="font-bold">{currentRole}</strong>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      {currentRole === 'School Admin' && <button type="button" onClick={() => { setIsProfileMenuOpen(false); setIsSecurityModalOpen(true); }} className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-600" /><span>Security & MFA policy</span></button>}
                      {moduleAccess.launchBlueprint && <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsGuidedSetupModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Rocket className="w-4 h-4 text-indigo-600" />
                        <span>10-Step Launch Blueprint</span>
                      </button>}
                      {moduleAccess.invitationsAndQr && <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsInvitationsModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Key className="w-4 h-4 text-purple-600" />
                        <span>Invitations & QR Credentials</span>
                      </button>}
                      {moduleAccess.subscriptionAndPricing && <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsSubscriptionModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <span>Subscription & Pricing</span>
                      </button>}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsWorkspaceModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-4 h-4 text-slate-500" />
                        <span>Manage Workspaces</span>
                      </button>
                      {onOpenPublicLanding && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenPublicLanding();
                          }}
                          className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                          <span>View Public Landing Page</span>
                        </button>
                      )}
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full px-3 py-2 text-xs text-left text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Switcher Modal */}
      <WorkspaceSwitcherModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onNavigateToNewSchool={onOpenPublicLanding}
      />

      {/* Subscriptions & Entitlements Modal */}
      {moduleAccess.subscriptionAndPricing && <SubscriptionPlanModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        phase={moduleAccess.subscriptionPhase!}
      />}

      {/* Invitations & QR Credentials Modal */}
      {moduleAccess.invitationsAndQr && <InvitationsAndCredentialsModal
        isOpen={isInvitationsModalOpen}
        onClose={() => setIsInvitationsModalOpen(false)}
      />}

      {/* 10-Step Launch Blueprint Modal */}
      {moduleAccess.launchBlueprint && <SchoolGuidedSetupModal
        isOpen={isGuidedSetupModalOpen}
        onClose={() => setIsGuidedSetupModalOpen(false)}
        onNavigateToTab={setActiveTab}
      />}
      <SecuritySettingsModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />
    </>
  );
};
