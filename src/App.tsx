/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { SkuggleAIBuddy } from './components/SkuggleAIBuddy';
import { PublicLanding } from './features/public/PublicLanding';
import { Persona, UserRole } from './types';
import { DashboardLoading } from './components/dashboard/DashboardPrimitives';
import { apiRequest, ApiError, describeApiError, hasLikelyBrowserSession, initializeCsrf } from './lib/apiClient';
import { schoolKeyFromLocation } from './lib/sessionAuth';
import { playNotificationTone } from './lib/notificationAudio';
import { EmailVerificationModal } from './components/EmailVerificationModal';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface SessionResponse {
  success: true;
  data: { user: { role: string; email?: string; emailVerified?: boolean } };
}

function sessionRole(role: string): UserRole {
  const roles: Record<string, UserRole> = {
    school_admin: 'School Admin',
    principal: 'Principal',
    teacher: 'Teacher',
    parent: 'Parent',
    student: 'Student',
    platform_super_admin: 'Platform Owner',
    platform_owner: 'Platform Owner',
  };
  return roles[role.trim().toLowerCase().replace(/[ -]+/g, '_')] || 'Student';
}

let restoreSessionPromise: Promise<SessionResponse | null> | null = null;

function restoreSession(): Promise<SessionResponse | null> {
  if (!hasLikelyBrowserSession()) {
    return Promise.resolve(null);
  }
  if (!restoreSessionPromise) {
    restoreSessionPromise = apiRequest<SessionResponse>('/auth/me', {
      suppressErrorNotification: true,
      signal: AbortSignal.timeout(30000),
    })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem('skuggle_authenticated');
        }
        if (error instanceof ApiError && error.status !== 401) {
          console.error('Session restoration failed', error.code, error.requestId);
        }
        return null;
      });
  }
  return restoreSessionPromise;
}

const SchoolAdminDashboard = lazy(() => import(/* webpackChunkName: "dashboard-admin" */ './features/dashboard/SchoolAdminDashboard').then((m) => ({ default: m.SchoolAdminDashboard })));
const PrincipalDashboard = lazy(() => import(/* webpackChunkName: "dashboard-principal" */ './features/dashboard/PrincipalDashboard').then((m) => ({ default: m.PrincipalDashboard })));
const TeacherDashboard = lazy(() => import(/* webpackChunkName: "dashboard-teacher" */ './features/dashboard/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard })));
const ParentDashboard = lazy(() => import(/* webpackChunkName: "dashboard-parent" */ './features/dashboard/ParentDashboard').then((m) => ({ default: m.ParentDashboard })));
const StudentDashboard = lazy(() => import(/* webpackChunkName: "dashboard-student" */ './features/dashboard/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));
const PlatformOwnerDashboard = lazy(() => import(/* webpackChunkName: "dashboard-owner" */ './features/dashboard/PlatformOwnerDashboard').then((m) => ({ default: m.PlatformOwnerDashboard })));
const SchoolRegistrationStepper = lazy(() => import(/* webpackChunkName: "public-register" */ './features/public/SchoolRegistrationStepper').then((m) => ({ default: m.SchoolRegistrationStepper })));
const TenantWelcome = lazy(() => import(/* webpackChunkName: "public-welcome" */ './features/public/TenantWelcome').then((m) => ({ default: m.TenantWelcome })));
const TenantLogin = lazy(() => import(/* webpackChunkName: "public-login" */ './features/public/TenantLogin').then((m) => ({ default: m.TenantLogin })));
const PersonalAuthPage = lazy(() => import(/* webpackChunkName: "public-auth-personal" */ './features/public/PersonalAuthPage').then((m) => ({ default: m.PersonalAuthPage })));
const SchoolAuthPage = lazy(() => import(/* webpackChunkName: "public-auth-school" */ './features/public/SchoolAuthPage').then((m) => ({ default: m.SchoolAuthPage })));
const PublicResultChecker = lazy(() => import(/* webpackChunkName: "public-results" */ './features/public/PublicResultChecker').then((m) => ({ default: m.PublicResultChecker })));
const BrandingStudio = lazy(() => import(/* webpackChunkName: "feature-branding" */ './features/branding/BrandingStudio').then((m) => ({ default: m.BrandingStudio })));
const AttendanceView = lazy(() => import(/* webpackChunkName: "feature-attendance" */ './features/attendance/AttendanceView').then((m) => ({ default: m.AttendanceView })));
const StudentRegistryView = lazy(() => import(/* webpackChunkName: "feature-students" */ './features/students/StudentRegistryView').then((m) => ({ default: m.StudentRegistryView })));
const AssessmentsView = lazy(() => import(/* webpackChunkName: "feature-assessments" */ './features/assessments/AssessmentsView').then((m) => ({ default: m.AssessmentsView })));
const ResultsManagementView = lazy(() => import(/* webpackChunkName: "feature-results" */ './features/results/ResultsManagementView').then((m) => ({ default: m.ResultsManagementView })));
const StaffManagementView = lazy(() => import(/* webpackChunkName: "feature-staff" */ './features/staff/StaffManagementView').then((m) => ({ default: m.StaffManagementView })));
const AcademicsConfigView = lazy(() => import(/* webpackChunkName: "feature-academics" */ './features/academics/AcademicsConfigView').then((m) => ({ default: m.AcademicsConfigView })));
const ReportCardGeneratorView = lazy(() => import(/* webpackChunkName: "feature-report-cards" */ './features/results/ReportCardGeneratorView').then((m) => ({ default: m.ReportCardGeneratorView })));
const FeeStructureBillingView = lazy(() => import(/* webpackChunkName: "feature-finance" */ './features/finance/FeeStructureBillingView').then((m) => ({ default: m.FeeStructureBillingView })));
const BroadcastCenterView = lazy(() => import(/* webpackChunkName: "feature-broadcasts" */ './features/communication/BroadcastCenterView').then((m) => ({ default: m.BroadcastCenterView })));
const ClassTimetableView = lazy(() => import(/* webpackChunkName: "feature-timetable" */ './features/academics/ClassTimetableView').then((m) => ({ default: m.ClassTimetableView })));
const CBTQuizModuleView = lazy(() => import(/* webpackChunkName: "feature-cbt" */ './features/cbt/CBTQuizModuleView').then((m) => ({ default: m.CBTQuizModuleView })));
const AILessonPlanner = lazy(() => import(/* webpackChunkName: "feature-ai-lessons" */ './features/teacher/AILessonPlanner').then((m) => ({ default: m.AILessonPlanner })));
const SmartMarkScanner = lazy(() => import(/* webpackChunkName: "feature-smart-marks" */ './features/teacher/SmartMarkScanner').then((m) => ({ default: m.SmartMarkScanner })));

function MainAppContent() {
  const { currentRole, setCurrentRole, toast, hideToast, showToast } = useApp();

  // Root View State
  const [currentView, setCurrentView] = useState<
    | 'landing'
    | 'register-school'
    | 'tenant-welcome'
    | 'tenant-login'
    | 'personal-auth'
    | 'school-auth'
    | 'result-checker'
    | 'app'
  >('landing');
  // Session restoration is progressive: never place an unbounded network request over the whole UI.
  const [isSessionChecking, setIsSessionChecking] = useState(false);
  const [verifyGateEmail, setVerifyGateEmail] = useState<string | null>(null);

  // Active App Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('home');

  // Sidebar Collapsed & Mobile Drawer States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const onApiError = (event: Event) => {
      const error = (event as CustomEvent<ApiError>).detail;
      if (error.code === 'EMAIL_UNVERIFIED') {
        const email = error.fields.email?.[0] || '';
        if (email) setVerifyGateEmail(email);
        localStorage.removeItem('skuggle_authenticated');
        setCurrentView('personal-auth');
        void (async () => {
          try {
            await initializeCsrf();
            await apiRequest('/auth/logout', { method: 'POST', suppressErrorNotification: true });
          } catch { /* ignore */ }
          restoreSessionPromise = null;
        })();
        return;
      }
      if (error.status === 401 && (currentView === 'landing' || currentView === 'tenant-login' || currentView === 'personal-auth' || currentView === 'school-auth' || currentView === 'tenant-welcome' || currentView === 'register-school')) return;
      showToast(error.status === 401 ? 'Session expired' : 'Request failed', describeApiError(error), error.status >= 500 ? 'failed' : 'error');
    };
    window.addEventListener('skuggle:api-error', onApiError);
    return () => window.removeEventListener('skuggle:api-error', onApiError);
  }, [currentView, showToast]);

  useEffect(() => {
    if (toast?.show) playNotificationTone(toast.type);
  }, [toast]);

  const [welcomeMode, setWelcomeMode] = useState<'entry' | 'preview'>('entry');

  useEffect(() => {
    let active = true;
    void restoreSession()
      .then(async (response) => {
        if (!active) return;
        if (response) {
          if (response.data.user.emailVerified === false) {
            setVerifyGateEmail(response.data.user.email || 'your account');
            localStorage.removeItem('skuggle_authenticated');
            try {
              await initializeCsrf();
              await apiRequest('/auth/logout', { method: 'POST', suppressErrorNotification: true });
            } catch { /* ignore */ }
            restoreSessionPromise = null;
            setCurrentView('personal-auth');
            return;
          }
          setCurrentRole(sessionRole(response.data.user.role));
          setCurrentView('app');
          window.dispatchEvent(new Event('skuggle:authenticated'));
          return;
        }
        // Only auto-open tenant welcome on a cold landing load. Never yank the user
        // off personal/school auth mid-registration (session restore can finish late).
        if (schoolKeyFromLocation()) {
          setCurrentView((view) => (view === 'landing' ? 'tenant-welcome' : view));
        }
      })
      .finally(() => { if (active) setIsSessionChecking(false); });
    return () => { active = false; };
  }, [setCurrentRole]);

  const handleLogout = async () => {
    try {
      await initializeCsrf();
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      restoreSessionPromise = null;
      localStorage.removeItem('skuggle_authenticated');
      setCurrentView('landing');
      setActiveTab('home');
    }
  };

  // Switch persona entry from landing page
  const handleSelectRoleFromLanding = (persona: Persona) => {
    switch (persona) {
      case 'school':
        setCurrentView('register-school');
        break;
      default:
        setCurrentView('personal-auth');
    }
  };

  const enterAuthenticatedApp = (role: UserRole) => {
    localStorage.setItem('skuggle_authenticated', '1');
    setCurrentRole(role);
    setCurrentView('app');
  };

  // Render main authenticated workspace tab
  const renderAppContent = () => {
    switch (activeTab) {
      case 'home':
        switch (currentRole) {
          case 'School Admin':
            return <SchoolAdminDashboard onNavigateTab={setActiveTab} />;
          case 'Principal':
            return <PrincipalDashboard onNavigateTab={setActiveTab} />;
          case 'Teacher':
            return <TeacherDashboard onNavigateTab={setActiveTab} />;
          case 'Parent':
            return <ParentDashboard onNavigateTab={setActiveTab} onOpenResultChecker={() => setCurrentView('result-checker')} />;
          case 'Student':
            return <StudentDashboard onNavigateTab={setActiveTab} onOpenResultChecker={() => setCurrentView('result-checker')} />;
          case 'Platform Owner':
            return <PlatformOwnerDashboard />;
          default:
            return <SchoolAdminDashboard onNavigateTab={setActiveTab} />;
        }
      case 'students':
        return <StudentRegistryView />;
      case 'attendance':
        return <AttendanceView />;
      case 'academics':
        return <AcademicsConfigView />;
      case 'report-cards':
        return <ReportCardGeneratorView />;
      case 'timetable':
        return <ClassTimetableView />;
      case 'cbt':
        return <CBTQuizModuleView />;
      case 'broadcasts':
        return <BroadcastCenterView />;
      case 'finance':
        return <FeeStructureBillingView />;
      case 'people':
      case 'staff':
        return <StaffManagementView />;
      case 'assessments':
        return <AssessmentsView />;
      case 'results':
        return <ResultsManagementView />;
      case 'branding':
        return <BrandingStudio onPreviewWelcome={() => { setWelcomeMode('preview'); setCurrentView('tenant-welcome'); }} />;
      case 'smartmark':
        return <SmartMarkScanner />;
      case 'teacher-ai':
      case 'lessons':
        return <AILessonPlanner />;
      case 'health':
      case 'schools':
      case 'governance':
        return <PlatformOwnerDashboard />;
      default:
        return <SchoolAdminDashboard onNavigateTab={setActiveTab} />;
    }
  };

  if (isSessionChecking) {
    return <div className="min-h-screen bg-[#FFFCF7] p-6"><DashboardLoading /></div>;
  }

  return (
    <div className="min-h-screen bg-[#FFFCF7] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            role={toast.type === 'error' || toast.type === 'failed' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' || toast.type === 'failed' ? 'assertive' : 'polite'}
            className={`fixed top-4 right-4 z-50 w-[min(92vw,390px)] text-white p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${toast.type === 'success' ? 'bg-emerald-700 border-emerald-500' : toast.type === 'warning' ? 'bg-amber-700 border-amber-500' : toast.type === 'info' ? 'bg-indigo-700 border-indigo-500' : toast.type === 'failed' ? 'bg-rose-950 border-rose-700' : 'bg-rose-700 border-rose-500'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : toast.type === 'warning' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : toast.type === 'info' ? <Info className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs text-white">{toast.title}</h4>
              {toast.description && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button type="button" onClick={hideToast} aria-label="Dismiss notification" className="p-1 rounded-lg hover:bg-white/15"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {verifyGateEmail && (
        <EmailVerificationModal
          email={verifyGateEmail}
          title="Verify your email to continue"
          onClose={() => setVerifyGateEmail(null)}
        />
      )}

      {/* Main Views Routing */}
      {currentView === 'landing' ? (
        <PublicLanding
          onSelectRole={handleSelectRoleFromLanding}
          onOpenResultChecker={() => setCurrentView('result-checker')}
          onTenantLogin={() => setCurrentView('school-auth')}
          onEnterAppDirectly={() => setCurrentView('school-auth')}
          onOpenPersonalAuth={() => setCurrentView('personal-auth')}
          onOpenSchoolAuth={() => setCurrentView('school-auth')}
        />
      ) : currentView === 'personal-auth' ? (
        <Suspense fallback={<div className="min-h-screen bg-[#FFFCF7] p-6"><DashboardLoading /></div>}>
          <PersonalAuthPage
            onSuccess={enterAuthenticatedApp}
            onBack={() => setCurrentView('landing')}
          />
        </Suspense>
      ) : currentView === 'school-auth' ? (
        <Suspense fallback={<div className="min-h-screen bg-[#FFFCF7] p-6"><DashboardLoading /></div>}>
          <SchoolAuthPage
            onSuccess={enterAuthenticatedApp}
            onBack={() => setCurrentView('landing')}
            onRegisterSchool={() => setCurrentView('register-school')}
          />
        </Suspense>
      ) : currentView === 'register-school' ? (
        <SchoolRegistrationStepper
          onCancel={() => setCurrentView('landing')}
          onComplete={() => {
            setWelcomeMode('entry');
            setCurrentView('tenant-welcome');
          }}
          onPreviewWelcome={() => {
            setWelcomeMode('preview');
            setCurrentView('tenant-welcome');
          }}
        />
      ) : currentView === 'tenant-welcome' ? (
        <TenantWelcome
          previewOnly={welcomeMode === 'preview'}
          onContinue={() => {
            if (welcomeMode === 'preview') {
              setCurrentView('app');
            } else {
              setCurrentView('tenant-login');
            }
          }}
          onSkip={() => setCurrentView(welcomeMode === 'preview' ? 'app' : 'tenant-login')}
          onOpenResultChecker={() => setCurrentView('result-checker')}
          onBackToLanding={() => setCurrentView('landing')}
        />
      ) : currentView === 'tenant-login' ? (
        <TenantLogin
          onSuccess={enterAuthenticatedApp}
          onBackToLanding={() => setCurrentView('landing')}
          onOpenResultChecker={() => setCurrentView('result-checker')}
        />
      ) : currentView === 'result-checker' ? (
        <PublicResultChecker onBack={() => setCurrentView('app')} />
      ) : (
        /* Authenticated Tenant & Personal Workspace Layout with Sidebar */
        <div className="flex-1 flex min-h-screen bg-[#FFFCF7]">
          {/* Responsive Collapsible Navigation Sidebar */}
          <AppSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            isMobileOpen={isMobileSidebarOpen}
            setIsMobileOpen={setIsMobileSidebarOpen}
            onOpenResultChecker={() => setCurrentView('result-checker')}
            onOpenPublicLanding={() => setCurrentView('landing')}
            onOpenBrandingStudio={() => setActiveTab('branding')}
          />

          {/* Main Content Workspace Column */}
          <div
            className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
            }`}
          >
            <AppHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenResultChecker={() => setCurrentView('result-checker')}
              onOpenPublicLanding={() => setCurrentView('landing')}
              onOpenBrandingStudio={() => setActiveTab('branding')}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onLogout={() => void handleLogout()}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentRole}-${activeTab}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Suspense fallback={<DashboardLoading />}>{renderAppContent()}</Suspense>
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Persistent Skuggle AI Buddy Floating Action Button & Assistant Drawer */}
            <SkuggleAIBuddy variant="floating" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#FFFCF7] p-6"><DashboardLoading /></div>}>
        <MainAppContent />
      </Suspense>
    </AppProvider>
  );
}
