import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  CalendarDays,
  Brain,
  Megaphone,
  CreditCard,
  Users,
  ClipboardCheck,
  Award,
  Palette,
  ScanLine,
  Sparkles,
  Building2,
  Activity,
  Shield,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Key,
  Layers,
  ExternalLink,
  Wifi,
  WifiOff,
  Search,
  X,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandMark } from './BrandMark';
import { WorkspaceSwitcherModal } from './WorkspaceSwitcherModal';
import { SubscriptionPlanModal } from '../features/subscription/SubscriptionPlanModal';
import { InvitationsAndCredentialsModal } from '../features/invitations/InvitationsAndCredentialsModal';
import { getAccountModuleAccess } from '../lib/moduleAccess';
import { SchoolGuidedSetupModal } from '../features/onboarding/SchoolGuidedSetupModal';

export interface NavSection {
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
  onOpenBrandingStudio,
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
  const moduleAccess = getAccountModuleAccess(currentWorkspace, currentRole);

  // Grouped Navigation Structure by Persona / Role
  const getNavSections = (): NavSection[] => {
    switch (currentRole) {
      case 'School Admin':
        return [
          {
            title: 'Overview',
            items: [{ id: 'home', label: 'Dashboard', icon: LayoutDashboard }],
          },
          {
            title: 'Academics & Classroom',
            items: [
              { id: 'students', label: 'Students', icon: GraduationCap, badge: '145', badgeColor: 'bg-indigo-100 text-indigo-700' },
              { id: 'academics', label: 'Academics', icon: BookOpen },
              { id: 'timetable', label: 'Timetable', icon: CalendarDays },
              { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
              { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
              { id: 'cbt', label: 'CBT Quizzes', icon: Brain, badge: 'AI', badgeColor: 'bg-purple-100 text-purple-700' },
            ],
          },
          {
            title: 'Reports & Grading',
            items: [
              { id: 'report-cards', label: 'Report Cards', icon: FileSpreadsheet },
              { id: 'results', label: 'Results & PINs', icon: Award },
            ],
          },
          {
            title: 'Operations & Management',
            items: [
              { id: 'finance', label: 'Finance & Fees', icon: CreditCard },
              { id: 'people', label: 'Staff & Invites', icon: Users },
              { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
              { id: 'branding', label: 'Branding Studio', icon: Palette },
            ],
          },
          {
            title: 'Teacher AI Tools',
            items: [
              { id: 'smartmark', label: 'SmartMark OCR', icon: ScanLine, badge: 'New', badgeColor: 'bg-emerald-100 text-emerald-700' },
              { id: 'teacher-ai', label: 'AI Lesson Planner', icon: Sparkles, badge: 'AI', badgeColor: 'bg-amber-100 text-amber-800' },
            ],
          },
        ];

      case 'Principal':
        return [
          {
            title: 'Leadership',
            items: [
              { id: 'home', label: 'Executive Dashboard', icon: LayoutDashboard },
              { id: 'results', label: 'Result Approvals', icon: Award, badge: 'Review', badgeColor: 'bg-rose-100 text-rose-700' },
              { id: 'report-cards', label: 'Report Card Audit', icon: FileSpreadsheet },
            ],
          },
          {
            title: 'Academic Oversight',
            items: [
              { id: 'academics', label: 'Curriculum & Classes', icon: BookOpen },
              { id: 'timetable', label: 'Master Schedule', icon: CalendarDays },
              { id: 'attendance', label: 'Attendance Audit', icon: CheckCircle2 },
              { id: 'students', label: 'Student Register', icon: GraduationCap },
              { id: 'cbt', label: 'CBT Engine', icon: Brain },
            ],
          },
          {
            title: 'School Communications',
            items: [{ id: 'broadcasts', label: 'Broadcasts', icon: Megaphone }],
          },
        ];

      case 'Teacher':
        if (currentWorkspace.type === 'personal') {
          return [
            {
              title: 'Personal Teaching Studio',
              items: [
                { id: 'home', label: 'Studio Home', icon: LayoutDashboard },
                { id: 'assessments', label: 'Assessment Studio', icon: ClipboardCheck, badge: 'AI', badgeColor: 'bg-purple-100 text-purple-700' },
                { id: 'teacher-ai', label: 'AI Lesson Planner', icon: Sparkles, badge: 'AI', badgeColor: 'bg-amber-100 text-amber-800' },
                { id: 'cbt', label: 'Question Bank & CBT', icon: Brain },
                { id: 'smartmark', label: 'SmartMark Scans', icon: ScanLine },
                { id: 'timetable', label: 'Teaching Schedule', icon: CalendarDays },
              ],
            },
          ];
        }
        return [
          {
            title: 'School Classroom Duties',
            items: [
              { id: 'home', label: 'Classroom Dashboard', icon: LayoutDashboard },
              { id: 'attendance', label: 'Take Roll Call', icon: CheckCircle2 },
              { id: 'assessments', label: 'Assessment Studio', icon: ClipboardCheck, badge: 'Exam/CA', badgeColor: 'bg-indigo-100 text-indigo-700' },
              { id: 'report-cards', label: 'Class Report Cards', icon: FileSpreadsheet },
              { id: 'timetable', label: 'Class Timetable', icon: CalendarDays },
            ],
          },
          {
            title: 'School Testing & Tools',
            items: [
              { id: 'cbt', label: 'School CBT Tests', icon: Brain },
              { id: 'smartmark', label: 'SmartMark Optical Scan', icon: ScanLine, badge: 'OCR', badgeColor: 'bg-emerald-100 text-emerald-700' },
              { id: 'teacher-ai', label: 'AI Lesson Plans', icon: Sparkles, badge: 'AI', badgeColor: 'bg-amber-100 text-amber-800' },
              { id: 'students', label: 'Class Roster', icon: GraduationCap },
            ],
          },
        ];

      case 'Parent':
        if (currentWorkspace.type === 'personal') {
          return [
            {
              title: 'Family Learning Hub',
              items: [
                { id: 'home', label: 'Family Home', icon: LayoutDashboard },
                { id: 'timetable', label: 'Home Study Routine', icon: CalendarDays },
                { id: 'cbt', label: 'AI Practice Drills', icon: Brain, badge: 'AI', badgeColor: 'bg-amber-100 text-amber-800' },
              ],
            },
          ];
        }
        return [
          {
            title: 'School Ward Portal',
            items: [
              { id: 'home', label: 'Ward Overview', icon: LayoutDashboard },
              { id: 'report-cards', label: 'Official Term Dossier', icon: FileSpreadsheet },
              { id: 'finance', label: 'School Fee Payments', icon: CreditCard },
              { id: 'timetable', label: 'School Timetable', icon: CalendarDays },
              { id: 'attendance', label: 'Attendance Record', icon: CheckCircle2 },
              { id: 'broadcasts', label: 'School Notices', icon: Megaphone },
            ],
          },
        ];

      case 'Student':
        if (currentWorkspace.type === 'personal') {
          return [
            {
              title: 'Personal Study Room',
              items: [
                { id: 'home', label: 'My Study Room', icon: LayoutDashboard },
                { id: 'cbt', label: 'WAEC / JAMB Practice', icon: Brain, badge: 'Drills', badgeColor: 'bg-blue-100 text-blue-800' },
                { id: 'timetable', label: 'Home Study Schedule', icon: CalendarDays },
              ],
            },
          ];
        }
        return [
          {
            title: 'Enrolled School Portal',
            items: [
              { id: 'home', label: 'Class Progress', icon: LayoutDashboard },
              { id: 'cbt', label: 'School CBT Exams', icon: Brain, badge: 'Exam', badgeColor: 'bg-emerald-100 text-emerald-800' },
              { id: 'assessments', label: 'Continuous Tests', icon: ClipboardCheck },
              { id: 'report-cards', label: 'Term Report Card', icon: FileSpreadsheet },
              { id: 'timetable', label: 'Class Schedule', icon: CalendarDays },
              { id: 'results', label: 'PIN Result Checker', icon: Award },
            ],
          },
        ];

      case 'Platform Owner':
        return [
          {
            title: 'Platform Management',
            items: [
              { id: 'home', label: 'Platform Overview', icon: LayoutDashboard },
              { id: 'schools', label: 'Tenant Schools', icon: Building2 },
              { id: 'health', label: 'System Health', icon: Activity },
              { id: 'governance', label: 'Security & Audit', icon: Shield },
            ],
          },
        ];

      default:
        return [
          {
            title: 'General',
            items: [{ id: 'home', label: 'Home', icon: LayoutDashboard }],
          },
        ];
    }
  };

  const navSections = getNavSections();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // Sidebar Inner Content Component (used for both desktop & mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none overflow-hidden">
      {/* 1. Header: School / Tenant Branding & Workspace Switcher */}
      <div className="p-4 border-b border-slate-100 shrink-0">
        {currentWorkspace.type === 'school' ? (
          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            className={`w-full group flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100/80 transition-colors text-left ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={`${branding.schoolName} (${currentRole})`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-indigo-600 shrink-0">
              {branding.schoolName.slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h2 className="font-display font-bold text-slate-900 text-sm tracking-tight truncate">
                    {branding.schoolName}
                  </h2>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  <span className="text-indigo-600 font-bold">{currentRole}</span>
                  <span>·</span>
                  <span className="truncate">{branding.currentTerm}</span>
                </div>
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            className={`w-full group flex items-center gap-2.5 p-2 rounded-2xl hover:bg-slate-100/80 transition-colors text-left ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Personal Workspace"
          >
            <BrandMark size="sm" showText={!isCollapsed} />
            {!isCollapsed && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-800 rounded-full">
                  {currentWorkspace.role}
                </span>
                <ChevronDown className="w-3 h-3 text-violet-500" />
              </div>
            )}
          </button>
        )}

        {/* 1-Click Quick Space Toggle Button */}
        {!isCollapsed && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {currentWorkspace.type === 'school' ? '🏫 School Space' : '👤 Personal Space'}
            </span>
            <button
              onClick={() => switchSpaceCategory(currentWorkspace.type === 'school' ? 'personal' : 'school')}
              className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
              title="Toggle between School and Personal Workspace"
            >
              <span>{currentWorkspace.type === 'school' ? '⚡ Go to Personal' : '🏫 Go to School'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Scrollable Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && section.title && (
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group cursor-pointer ${
                      isActive
                        ? 'bg-indigo-950 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <IconComponent
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-indigo-200'
                          : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                        {item.badge && ` (${item.badge})`}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick Tools & Shortcuts Section */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Quick Shortcuts
            </div>
          )}

          {/* 10-Step Launch Blueprint */}
          {moduleAccess.launchBlueprint && <button
            onClick={() => setIsGuidedSetupModalOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="10-Step Launch Blueprint"
          >
            <Rocket className="w-4 h-4 text-indigo-600 shrink-0" />
            {!isCollapsed && <span className="truncate flex-1 text-left">Launch Blueprint</span>}
          </button>}

          {/* Invitations & QR Credentials */}
          {moduleAccess.invitationsAndQr && <button
            onClick={() => setIsInvitationsModalOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Invitations & QR Credentials"
          >
            <Key className="w-4 h-4 text-purple-600 shrink-0" />
            {!isCollapsed && <span className="truncate flex-1 text-left">Invitations & QR</span>}
          </button>}

          {/* Subscription & Plans */}
          {moduleAccess.subscriptionAndPricing && <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Subscription & Plans"
          >
            <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
            {!isCollapsed && <span className="truncate flex-1 text-left">Subscription Plans</span>}
          </button>}

          {/* Public PIN Result Checker link */}
          {onOpenResultChecker && (
            <button
              onClick={onOpenResultChecker}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/80 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Public PIN Result Checker"
            >
              <Award className="w-4 h-4 text-indigo-600 shrink-0" />
              {!isCollapsed && <span className="truncate flex-1 text-left font-semibold">PIN Result Portal</span>}
            </button>
          )}
        </div>
      </div>

      {/* 3. Bottom Footer: User Profile & Role Switcher & Collapse Toggle */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0 space-y-2">
        {/* User Card with Role Popover */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white border border-slate-200/80 transition-colors text-left bg-white/60 shadow-2xs ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={`${currentUser.fullName} (${currentRole})`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <span>Role:</span>
                  <span className="font-semibold text-indigo-700">{currentRole}</span>
                </div>
              </div>
            )}
            {!isCollapsed && (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {/* Role Popover */}
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

        {/* Collapse / Expand Toggle Button for Desktop */}
        <div className="hidden lg:flex items-center justify-end pt-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-30 bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
              className="relative z-10 w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col"
            >
              {/* Close Button Header */}
              <div className="absolute top-3.5 right-3.5 z-20">
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <WorkspaceSwitcherModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onNavigateToNewSchool={onOpenPublicLanding}
      />

      {moduleAccess.subscriptionAndPricing && <SubscriptionPlanModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        phase={moduleAccess.subscriptionPhase!}
      />}

      {moduleAccess.invitationsAndQr && <InvitationsAndCredentialsModal
        isOpen={isInvitationsModalOpen}
        onClose={() => setIsInvitationsModalOpen(false)}
      />}

      {moduleAccess.launchBlueprint && <SchoolGuidedSetupModal
        isOpen={isGuidedSetupModalOpen}
        onClose={() => setIsGuidedSetupModalOpen(false)}
        onNavigateToTab={setActiveTab}
      />}
    </>
  );
};
