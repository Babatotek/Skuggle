import React, { useState } from 'react';
import {
  GraduationCap,
  Bell,
  ChevronDown,
  LogOut,
  Sparkles,
  Search,
  BookOpen,
  Users,
  Building2,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  Home,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  UserRound
} from 'lucide-react';
import { UserProfile, UserRole, NotificationItem } from '../types';
import { USER_PROFILES, SAMPLE_NOTIFICATIONS } from '../data/mockData';
import { NotificationCenter } from './NotificationCenter';
import { InteractiveToolsWidget } from './InteractiveToolsWidget';
import { SmartLibraryWidget } from '../shared/ui/SmartLibraryWidget';
import { WorkspaceSelector } from '../features/workspaces/WorkspaceSelector';

interface HeaderProps {
  currentRole: UserRole;
  profile?: UserProfile;
  currentUser?: UserProfile;
  onSelectRole?: (role: UserRole) => void;
  onRequestLogin?: () => void;
  onLogout?: () => void;
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigate?: (path: string) => void;
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  workspaces?: Array<{
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    tenantType: string;
    roleLabel: string;
    current?: boolean;
  }>;
  onSwitchWorkspace?: (tenantId: string) => void;
  workspaceType?: 'personal' | 'school';
  isSwitchingWorkspace?: boolean;
  hqModules?: Array<{ id: string; label: string }>;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  profile,
  currentUser,
  onSelectRole,
  onRequestLogin,
  onLogout,
  onOpenModal,
  onNavigate,
  activeTab,
  setActiveTab,
  onSelectTab,
  workspaces = [],
  onSwitchWorkspace,
  workspaceType = 'school',
  isSwitchingWorkspace = false,
  hqModules = [],
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHqModules, setShowHqModules] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
  const [selectedSession] = useState('2026/2027');

  const user = profile || currentUser || USER_PROFILES[currentRole] || USER_PROFILES.school_admin;
  
  const handleTabClick = (tabId: string) => {
    if (setActiveTab) setActiveTab(tabId);
    if (onSelectTab) onSelectTab(tabId);
  };
  const handleRoleSelect = (role: UserRole) => {
    // Production mode: Role switching disabled
    return;
  };

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationAction = (actionType?: string, targetId?: string) => {
    if (!actionType) return;
    if (actionType === 'view_students') {
      handleTabClick('students');
    } else if (actionType === 'register_student') {
      onOpenModal('register_student');
    } else if (actionType === 'view_payment' || actionType === 'view_fees') {
      onOpenModal('make_payment');
    } else if (actionType === 'smartmark_scan') {
      onOpenModal('smartmark_scan');
    } else if (actionType === 'view_medical') {
      handleTabClick('students');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Define role-specific navigation tabs exactly matching mockups
  const getNavTabs = () => {
    if (workspaceType === 'personal') {
      return [
        { id: 'home', label: 'My Home', icon: Home },
        { id: 'planner', label: 'Planner', icon: CheckSquare },
        { id: 'resources', label: 'My Resources', icon: BookOpen },
        { id: 'goals', label: 'Goals', icon: TrendingUp },
        { id: 'portfolio', label: 'Portfolio', icon: FileSpreadsheet },
        { id: 'schools', label: 'Schools', icon: Building2 },
      ];
    }
    switch (currentRole) {
      case 'landing':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'classes', label: 'Classes', icon: Building2 },
          { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
          { id: 'gallery', label: 'Gallery', icon: BookOpen },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'school_admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Layers },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'add_student', label: 'Add Student', icon: PlusCircle, isAction: true },
          { id: 'results', label: 'Results', icon: FileSpreadsheet },
          { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'teacher':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'resources', label: 'Resource Library', icon: BookOpen },
          { id: 'my_classes', label: 'My Classes', icon: Building2 },
          { id: 'assessments', label: 'Assessments', icon: CheckSquare },
          { id: 'attendance', label: 'Attendance', icon: Users },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'more', label: 'More', icon: ChevronDown, hasDropdown: true },
        ];
      case 'principal':
        return [
          { id: 'overview', label: 'Overview', icon: Home },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'academics', label: 'Academics', icon: BookOpen },
          { id: 'results', label: 'Results', icon: FileSpreadsheet },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
          { id: 'finance', label: 'Finance', icon: DollarSign },
          { id: 'staff', label: 'Staff', icon: Users },
          { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
          { id: 'communication', label: 'Communication', icon: Bell },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'bursar':
        return [
          { id: 'home', label: 'Bursary Home', icon: DollarSign },
          { id: 'payments', label: 'Fee Ledger', icon: DollarSign },
          { id: 'receipts', label: 'Receipts', icon: FileSpreadsheet },
          { id: 'reminders', label: 'Reminders', icon: Bell },
          { id: 'reports', label: 'Finance Reports', icon: TrendingUp },
          { id: 'settings', label: 'Fee Setup', icon: Settings },
        ];
      case 'examination_officer':
        return [
          { id: 'home', label: 'Exam Home', icon: GraduationCap },
          { id: 'assessments', label: 'Assessments', icon: CheckSquare },
          { id: 'results', label: 'Results', icon: FileSpreadsheet },
          { id: 'reports', label: 'Exam Reports', icon: FileSpreadsheet },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'super_admin':
        return [
          { id: 'overview', label: 'Overview', icon: Home },
          { id: 'schools', label: 'Schools', icon: Building2 },
          { id: 'plans', label: 'Plans', icon: Layers },
          { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
          { id: 'usage', label: 'Usage', icon: TrendingUp },
          { id: 'support', label: 'Support', icon: Bell },
          { id: 'system_health', label: 'System Health', icon: Activity },
          { id: 'more', label: 'More', icon: ChevronDown, hasDropdown: true },
        ];
      case 'parent':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'my_children', label: 'My Children', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
          { id: 'academics', label: 'Academics', icon: BookOpen },
          { id: 'payments', label: 'Payments', icon: DollarSign },
          { id: 'messages', label: 'Messages', icon: Bell, badge: 4 },
          { id: 'more', label: 'More', icon: ChevronDown, hasDropdown: true },
        ];
      case 'student':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'my_progress', label: 'My Progress', icon: TrendingUp },
          { id: 'learning', label: 'Learning', icon: BookOpen },
          { id: 'assessments', label: 'Assessments', icon: CheckSquare },
          { id: 'results', label: 'Results', icon: FileSpreadsheet },
          { id: 'more', label: 'More', icon: ChevronDown, hasDropdown: true },
        ];
      default:
        return [];
    }
  };

  const navTabs = getNavTabs();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-4 lg:px-8 py-2.5 transition-all">
      <div className="w-full max-w-[1440px] mx-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 lg:gap-4">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
          <div
            id="brand-logo"
            onClick={() => handleRoleSelect('landing')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-sans flex items-center">
                skuggle
              </span>
              {currentRole === 'school_admin' && (
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block -mt-1">
                  Student Records. Simplified.
                </span>
              )}
            </div>
          </div>

          {/* Super Admin search bar if in Super Admin mode */}
          {currentRole === 'super_admin' && (
            <div className="hidden xl:flex items-center relative w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}

          {workspaces.length > 0 && (
            <>
              <div
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600"
                title={
                  workspaceType === 'personal'
                    ? 'Private · Only you'
                    : 'Owned by the active school'
                }
                aria-label={
                  workspaceType === 'personal'
                    ? 'Ownership: Private, only you'
                    : `Ownership: Owned by ${workspaces.find((w) => w.current)?.tenantName ?? 'school'}`
                }
              >
                {workspaceType === 'personal' ? (
                  <>
                    <UserRound className="w-3 h-3 text-indigo-600" />
                    <span>Private · Only you</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3 h-3 text-emerald-700" />
                    <span className="truncate max-w-[10rem]">
                      Owned by {workspaces.find((w) => w.current)?.tenantName ?? 'school'}
                    </span>
                  </>
                )}
              </div>
              <div className="hidden lg:block">
                <WorkspaceSelector
                  workspaces={workspaces}
                  workspaceType={workspaceType}
                  isSwitchingWorkspace={isSwitchingWorkspace}
                  onSwitchWorkspace={onSwitchWorkspace}
                />
              </div>
              <div className="lg:hidden">
                <WorkspaceSelector
                  workspaces={workspaces}
                  workspaceType={workspaceType}
                  isSwitchingWorkspace={isSwitchingWorkspace}
                  onSwitchWorkspace={onSwitchWorkspace}
                  compact
                />
              </div>
            </>
          )}

          {currentRole === 'super_admin' && hqModules.length > 0 && (
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setShowHqModules((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700"
              >
                <Layers className="w-3.5 h-3.5" />
                HQ modules
                <ChevronDown className="w-3 h-3" />
              </button>
              {showHqModules && (
                <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-1">
                  {hqModules.map((module) => (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => {
                        setShowHqModules(false);
                        handleTabClick(module.id);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                        activeTab === module.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {module.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Horizontal Navigation Tabs — moderate size; sits in the middle column */}
        <nav className="hidden md:flex items-center justify-center gap-1 min-w-0 overflow-x-auto">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => {
                  if (tab.isAction) {
                    onOpenModal('register_student');
                  } else {
                    handleTabClick(tab.id);
                  }
                }}
                className={`relative px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />}
                <span>{tab.label}</span>

                {tab.badge && (
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}

                {/* Active Indicator Underline */}
                {isActive && (
                  <div className="absolute bottom-[-11px] left-2 right-2 h-[2px] bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section Controls — pinned to the trailing edge */}
        <div className="flex items-center justify-end gap-2.5 shrink-0">
          {/* Landing Mode: Library widget + Login & Get Started buttons */}
          {currentRole === 'landing' ? (
            <div className="flex items-center gap-2.5">
              <InteractiveToolsWidget
                currentRole="landing"
                onOpenModal={onOpenModal}
                onNavigate={onNavigate}
                onOpen={() => setShowProfileMenu(false)}
              />
              <SmartLibraryWidget
                isGuest
                onOpenModal={onOpenModal}
                onNavigateTab={handleTabClick}
              />
              <button
                id="btn-login-nav"
                type="button"
                onClick={() => onRequestLogin?.() ?? handleRoleSelect('school_admin')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Login
              </button>
              <button
                id="btn-get-started-nav"
                type="button"
                onClick={() => onRequestLogin?.() ?? onOpenModal('onboarding_wizard')}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-all hover:shadow"
              >
                Get Started
              </button>
            </div>
          ) : (
            <>
              {/* Academic Session / School Dropdown if applicable */}
              {currentRole === 'school_admin' && (
                <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 gap-2">
                  <span className="text-slate-400 font-medium">Academic Session:</span>
                  <span className="font-semibold text-indigo-600">{selectedSession}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              )}

              {currentRole === 'super_admin' && (
                <button
                  id="btn-add-school-header"
                  onClick={() => onOpenModal('onboarding_wizard')}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add School</span>
                </button>
              )}

              <InteractiveToolsWidget
                currentRole={currentRole}
                onOpenModal={onOpenModal}
                onNavigate={onNavigate}
                onOpen={() => {
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                }}
              />

              {/* Smart Library Widget Icon in Top Bar */}
              <SmartLibraryWidget
                user={user}
                compact
                onOpenModal={onOpenModal}
                onNavigateTab={handleTabClick}
              />

              {/* Notification Bell with Badge and Notification Center */}
              <div className="relative">
                <button
                  id="btn-notifications"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className={`relative p-2 rounded-xl transition-colors ${
                    showNotifications
                      ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Notifications & Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationCenter
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDismiss={handleDismissNotification}
                  onClearAll={handleClearAllNotifications}
                  onActionClick={handleNotificationAction}
                />
              </div>

              {/* User Avatar & Name Profile dropdown */}
              <div className="relative flex-shrink-0">
                <div
                  id="profile-dropdown-trigger"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 ring-2 ring-indigo-50 flex-shrink-0"
                  />
                  <div className="hidden lg:flex flex-col justify-center max-w-[11rem]">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate" title={user?.name || 'User'}>
                      {user?.name || 'User'}
                    </p>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-tight truncate" title={user?.roleTitle || 'User'}>
                      {user?.roleTitle || 'User'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block flex-shrink-0" />
                </div>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 break-words">{user?.name}</p>
                      <p className="text-[11px] text-indigo-600 font-medium break-words">{user?.roleTitle}</p>
                      <p className="text-[11px] text-slate-400 truncate" title={user?.schoolName}>{user?.schoolName}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenModal('result_checker');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Public Result Checker</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenModal('report_card');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Sample Report Card</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenModal('smartmark_scan');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>SmartMark AI Scanner</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (onLogout) onLogout();
                          else handleRoleSelect('landing');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Log Out to Landing Page</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
