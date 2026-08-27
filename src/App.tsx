import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { UserRole, StudentRecord, UserProfile } from './types';
import { USER_PROFILES, INITIAL_STUDENTS } from './data/mockData';
import { Header } from './components/Header';

import {
  ModalSkeleton,
  PageSkeleton,
} from './shared/ui';
import { appConfig } from './app/config';
import { useAuth } from './features/auth/AuthProvider';
import { DEMO_LOGIN_BY_ROLE, mapBackendRoleToUi } from './features/auth/roleMap';
import {
  mapStudentSummaryToRecord,
  studentService,
} from './features/students/studentService';
import { feedbackBus } from './shared/feedback/feedbackBus';
import { getApiError } from './shared/api/client';
import { shouldRedirectToSetup } from './features/onboarding/setupRedirect';
import { workspaceHomeTab } from './features/workspaces/workspaceHomeTab';
import {
  bumpWorkspaceSwitchScope,
  currentWorkspaceSwitchGeneration,
  isCurrentWorkspaceSwitchGeneration,
} from './features/workspaces/workspaceSwitchScope';
import { ApiError } from './shared/api/client';

/** Lazy-load named exports so the initial bundle only pulls the active view/modal. */
function lazyNamed<T extends React.ComponentType<any>>(
  factory: () => Promise<Record<string, T>>,
  exportName: string
) {
  return lazy(async () => {
    const mod = await factory();
    return { default: mod[exportName] };
  });
}

// Views — code-split by route/role tab
const AdminDashboardView = lazyNamed(() => import('./components/views/AdminDashboardView'), 'AdminDashboardView');
const TeacherDashboardView = lazyNamed(() => import('./components/views/TeacherDashboardView'), 'TeacherDashboardView');
const PrincipalDashboardView = lazyNamed(() => import('./components/views/PrincipalDashboardView'), 'PrincipalDashboardView');
const SuperAdminDashboardView = lazyNamed(() => import('./components/views/SuperAdminDashboardView'), 'SuperAdminDashboardView');
const ParentDashboardView = lazyNamed(() => import('./components/views/ParentDashboardView'), 'ParentDashboardView');
const StudentDashboardView = lazyNamed(() => import('./components/views/StudentDashboardView'), 'StudentDashboardView');
const BursarDashboardView = lazyNamed(() => import('./components/views/BursarDashboardView'), 'BursarDashboardView');
const ExamOfficerDashboardView = lazyNamed(() => import('./components/views/ExamOfficerDashboardView'), 'ExamOfficerDashboardView');
const StudentsDirectoryView = lazyNamed(() => import('./components/views/StudentsDirectoryView'), 'StudentsDirectoryView');
const ResourceLibraryView = lazyNamed(() => import('./components/views/ResourceLibraryView'), 'ResourceLibraryView');
const SchoolAdminReportsView = lazyNamed(() => import('./components/views/SchoolAdminReportsView'), 'SchoolAdminReportsView');
const SchoolAdminSettingsView = lazyNamed(() => import('./components/views/SchoolAdminSettingsView'), 'SchoolAdminSettingsView');
const TeacherAssessmentsView = lazyNamed(() => import('./components/views/TeacherAssessmentsView'), 'TeacherAssessmentsView');
const TeacherAttendanceView = lazyNamed(() => import('./components/views/TeacherAttendanceView'), 'TeacherAttendanceView');
const TeacherMyClassesView = lazyNamed(() => import('./components/views/TeacherMyClassesView'), 'TeacherMyClassesView');
const TeacherMoreView = lazyNamed(() => import('./components/views/TeacherMoreView'), 'TeacherMoreView');
const PrincipalAcademicsView = lazyNamed(() => import('./components/views/PrincipalAcademicsView'), 'PrincipalAcademicsView');
const PrincipalAttendanceView = lazyNamed(() => import('./components/views/PrincipalAttendanceView'), 'PrincipalAttendanceView');
const PrincipalFinanceView = lazyNamed(() => import('./components/views/PrincipalFinanceView'), 'PrincipalFinanceView');
const PrincipalStaffView = lazyNamed(() => import('./components/views/PrincipalStaffView'), 'PrincipalStaffView');
const PrincipalReportsView = lazyNamed(() => import('./components/views/PrincipalReportsView'), 'PrincipalReportsView');
const PrincipalCommunicationView = lazyNamed(() => import('./components/views/PrincipalCommunicationView'), 'PrincipalCommunicationView');
const ParentMyChildrenView = lazyNamed(() => import('./components/views/ParentMyChildrenView'), 'ParentMyChildrenView');
const ParentAttendanceView = lazyNamed(() => import('./components/views/ParentAttendanceView'), 'ParentAttendanceView');
const ParentAcademicsView = lazyNamed(() => import('./components/views/ParentAcademicsView'), 'ParentAcademicsView');
const ParentPaymentsView = lazyNamed(() => import('./components/views/ParentPaymentsView'), 'ParentPaymentsView');
const ParentMessagesView = lazyNamed(() => import('./components/views/ParentMessagesView'), 'ParentMessagesView');
const ParentMoreView = lazyNamed(() => import('./components/views/ParentMoreView'), 'ParentMoreView');
const StudentProgressView = lazyNamed(() => import('./components/views/StudentProgressView'), 'StudentProgressView');
const StudentLearningView = lazyNamed(() => import('./components/views/StudentLearningView'), 'StudentLearningView');
const StudentAssessmentsView = lazyNamed(() => import('./components/views/StudentAssessmentsView'), 'StudentAssessmentsView');
const StudentResultsView = lazyNamed(() => import('./components/views/StudentResultsView'), 'StudentResultsView');
const StudentMoreView = lazyNamed(() => import('./components/views/StudentMoreView'), 'StudentMoreView');
const SchoolsView = lazyNamed(() => import('./components/views/saas/SchoolsView'), 'SchoolsView');
const PlansView = lazyNamed(() => import('./components/views/saas/PlansView'), 'PlansView');
const SubscriptionsView = lazyNamed(() => import('./components/views/saas/SubscriptionsView'), 'SubscriptionsView');
const UsageView = lazyNamed(() => import('./components/views/saas/UsageView'), 'UsageView');
const SupportView = lazyNamed(() => import('./components/views/saas/SupportView'), 'SupportView');
const SystemHealthView = lazyNamed(() => import('./components/views/saas/SystemHealthView'), 'SystemHealthView');
const MoreMenuView = lazyNamed(() => import('./components/views/saas/MoreMenuView'), 'MoreMenuView');

// Modals — loaded only when opened
const SmartMarkModal = lazyNamed(() => import('./components/modals/SmartMarkModal'), 'SmartMarkModal');
const AILessonBuilderModal = lazyNamed(() => import('./components/modals/AILessonBuilderModal'), 'AILessonBuilderModal');
const RegisterStudentModal = lazyNamed(() => import('./components/modals/RegisterStudentModal'), 'RegisterStudentModal');
const AttendanceModal = lazyNamed(() => import('./components/modals/AttendanceModal'), 'AttendanceModal');
const ReportCardModal = lazyNamed(() => import('./components/modals/ReportCardModal'), 'ReportCardModal');
const ResultCheckerModal = lazyNamed(() => import('./components/modals/ResultCheckerModal'), 'ResultCheckerModal');
const MakePaymentModal = lazyNamed(() => import('./components/modals/MakePaymentModal'), 'MakePaymentModal');
const OnboardingPage = lazy(() => import('./features/onboarding/OnboardingPage'));
const MySkuggleWorkspace = lazyNamed(
  () => import('./features/workspaces/MySkuggleWorkspace'),
  'MySkuggleWorkspace',
);
const AdminResultsWorkflowView = lazy(async () => ({
  default: (await import('./features/results/AdminResultsWorkflowView')).AdminResultsWorkflowView,
}));

function ViewFallback() {
  return <PageSkeleton />;
}

export default function App() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionUser = auth.user;
  const isPersonalWorkspace = sessionUser?.tenant?.type === 'individual';
  const [currentRole, setCurrentRole] = useState<UserRole>('school_admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [students, setStudents] = useState<StudentRecord[]>(
    appConfig.liveApi ? [] : INITIAL_STUDENTS,
  );
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);

  const profileFromSession = useMemo<UserProfile>(() => {
    const base = USER_PROFILES[currentRole] || USER_PROFILES.school_admin;
    if (!sessionUser) return base;
    const isPersonal = sessionUser.tenant?.type === 'individual';
    return {
      ...base,
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      role: currentRole,
      roleTitle: sessionUser.roleLabel || base.roleTitle,
      schoolName: isPersonal
        ? 'My Skuggle'
        : sessionUser.tenant?.name || base.schoolName,
      schoolCode: sessionUser.tenant?.code || base.schoolCode,
      avatar: sessionUser.avatarUrl || base.avatar,
    };
  }, [currentRole, sessionUser]);

  const loadStudents = useCallback(async () => {
    if (!appConfig.liveApi) return;
    const generation = currentWorkspaceSwitchGeneration();
    setStudentsLoading(true);
    try {
      const page = await studentService.list({ page: 1, perPage: 100 });
      if (!isCurrentWorkspaceSwitchGeneration(generation)) return;
      const mapped = page.data.map(mapStudentSummaryToRecord);
      if (mapped.length > 0) {
        setStudents(mapped);
      }
    } catch (error) {
      if (!isCurrentWorkspaceSwitchGeneration(generation)) return;
      if (error instanceof ApiError && error.kind === 'cancelled') return;
      feedbackBus.warning(getApiError(error).message);
      setStudents([]);
    } finally {
      if (isCurrentWorkspaceSwitchGeneration(generation)) {
        setStudentsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!sessionUser) return;
    const uiRole = mapBackendRoleToUi(sessionUser.role);
    setCurrentRole(uiRole);
    setActiveTab(workspaceHomeTab(uiRole, sessionUser.tenant?.type));
  }, [sessionUser?.id, sessionUser?.role, sessionUser?.tenant?.id, sessionUser?.tenant?.type]);

  useEffect(() => {
    if (sessionUser && appConfig.liveApi && !isPersonalWorkspace) {
      void loadStudents();
    } else if (isPersonalWorkspace) {
      setStudents([]);
      setStudentsLoading(false);
    }
  }, [sessionUser, isPersonalWorkspace, loadStudents]);

  useEffect(() => {
    if (!sessionUser || !appConfig.liveApi || isPersonalWorkspace) return;
    if (location.pathname.startsWith('/app/setup')) return;
    if (currentRole !== 'school_admin' && currentRole !== 'super_admin') return;

    void shouldRedirectToSetup().then((needsSetup) => {
      if (needsSetup) {
        void navigate('/app/setup', { replace: true });
      }
    });
  }, [sessionUser?.id, currentRole, isPersonalWorkspace, location.pathname, navigate]);

  useEffect(() => {
    if (isPersonalWorkspace && location.pathname.startsWith('/app/setup')) {
      void navigate('/app', { replace: true });
    }
  }, [isPersonalWorkspace, location.pathname, navigate]);

  const handleOpenModal = useCallback((modalName: string, data?: any) => {
    if (modalName === 'onboarding_wizard') {
      void navigate('/app/setup');
      return;
    }
    if (modalName === 'result_checker') {
      void navigate('/result-checker');
      return;
    }
    setActiveModal(modalName);
    setModalData(data ?? null);
  }, [navigate]);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const handleSaveNewStudent = useCallback((newStudent: StudentRecord) => {
    setStudents((prev) => {
      const withoutDup = prev.filter((item) => item.id !== newStudent.id);
      return [newStudent, ...withoutDup];
    });
  }, []);

  const applyRoleTabs = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'school_admin') {
      setActiveTab('dashboard');
    } else if (newRole === 'super_admin' || newRole === 'principal') {
      setActiveTab('overview');
    } else if (newRole === 'landing') {
      setActiveTab('home');
    } else {
      setActiveTab('home');
    }
  };

  const handleRoleChange = useCallback(
    async (newRole: UserRole) => {
      if (newRole === 'landing') {
        void navigate('/');
        return;
      }
      if (appConfig.liveApi && appConfig.enableDemo) {
        const creds = DEMO_LOGIN_BY_ROLE[newRole];
        if (!creds) {
          applyRoleTabs(newRole);
          return;
        }
        try {
          const user = await auth.login({
            email: creds.email,
            password: creds.password,
            remember: true,
          });
          applyRoleTabs(mapBackendRoleToUi(user.role));
          feedbackBus.info(`Signed in as ${user.name}`);
        } catch (error) {
          feedbackBus.error(getApiError(error).message);
        }
        return;
      }
      applyRoleTabs(newRole);
    },
    [auth, navigate],
  );

  const handleRequestLogin = useCallback(() => {
    void navigate('/login?returnTo=/app');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    feedbackBus.info('Signed out. Welcome back anytime.');
    await auth.logout();
  }, [auth]);

  const handleSwitchWorkspace = useCallback(
    (tenantId: string) => {
      const previousActiveTab = activeTab;
      void (async () => {
        bumpWorkspaceSwitchScope();
        setIsSwitchingWorkspace(true);
        setStudents([]);
        setStudentsLoading(false);
        setActiveModal(null);
        setModalData(null);
        setActiveTab('home');
        try {
          const user = await auth.switchWorkspace(tenantId);
          const uiRole = mapBackendRoleToUi(user.role);
          setCurrentRole(uiRole);
          setActiveTab(workspaceHomeTab(uiRole, user.tenant?.type));
          const destinationLabel =
            user.tenant?.type === 'individual'
              ? 'My Skuggle'
              : user.tenant?.name ?? 'workspace';
          feedbackBus.success(`Switched to ${destinationLabel}`);
          if (user.tenant?.type !== 'individual' && appConfig.liveApi) {
            void loadStudents();
          }
        } catch (caught) {
          setActiveTab(previousActiveTab);
          if (sessionUser?.tenant?.type !== 'individual') void loadStudents();
          feedbackBus.error(getApiError(caught).message);
        } finally {
          setIsSwitchingWorkspace(false);
        }
      })();
    },
    [activeTab, auth, loadStudents, sessionUser?.tenant?.type],
  );

  const isSmartMark =
    activeModal === 'smartmark_scan' || activeModal === 'smartmark';
  const isAiLesson =
    activeModal === 'ai_lesson_builder' || activeModal === 'ai_lesson';

  if (appConfig.liveApi && auth.status === 'loading') {
    return <PageSkeleton label="Connecting to Skuggle…" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Header
        currentRole={currentRole === 'landing' ? 'school_admin' : currentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectTab={setActiveTab}
        onSelectRole={handleRoleChange}
        onRequestLogin={handleRequestLogin}
        onLogout={handleLogout}
        onOpenModal={handleOpenModal}
        onNavigate={(path) => void navigate(path)}
        profile={profileFromSession}
        currentUser={profileFromSession}
        workspaceType={isPersonalWorkspace ? 'personal' : 'school'}
        isSwitchingWorkspace={isSwitchingWorkspace}
        workspaces={(auth.user?.memberships ?? []).map((m) => ({
          tenantId: m.tenantId,
          tenantName: m.tenantName,
          tenantCode: m.tenantCode,
          tenantType: m.tenantType,
          roleLabel: m.roleLabel,
          current: m.current ?? m.tenantId === auth.user?.tenant?.id,
        }))}
        onSwitchWorkspace={handleSwitchWorkspace}
        hqModules={
          currentRole === 'super_admin'
            ? [
                { id: 'overview', label: 'Overview' },
                { id: 'schools', label: 'Schools' },
                { id: 'plans', label: 'Plans' },
                { id: 'subscriptions', label: 'Billing' },
                { id: 'usage', label: 'Usage' },
                { id: 'support', label: 'Support desk' },
                { id: 'system_health', label: 'System health' },
                { id: 'more', label: 'Ops / broadcasts' },
              ]
            : []
        }
      />

      {!isPersonalWorkspace && auth.user?.mfaRequired && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[12px] font-semibold text-amber-950">
          Privileged MFA is required before creating or changing school data.{" "}
          <button
            type="button"
            className="underline font-extrabold"
            onClick={() => void navigate("/security/mfa")}
          >
            Enable authenticator
          </button>
        </div>
      )}

      {!isPersonalWorkspace && studentsLoading && (
        <div className="border-b border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-center text-[11px] font-semibold text-indigo-700">
          Syncing students from database…
        </div>
      )}

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isSwitchingWorkspace
          ? 'Switching workspace. Clearing previous school context.'
          : isPersonalWorkspace
            ? 'My Skuggle personal workspace is active.'
            : `${sessionUser?.tenant?.name ?? 'School'} workspace is active.`}
      </div>

      {isSwitchingWorkspace ? (
        <PageSkeleton label="Switching workspace…" />
      ) : (
      <main className="flex-1 pb-8">
        <Routes>
          <Route
            path="setup"
            element={
              <Suspense fallback={<ViewFallback />}>
                <OnboardingPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<ViewFallback />}>
          {isPersonalWorkspace ? (
            <MySkuggleWorkspace
              role={currentRole}
              userId={profileFromSession.id}
              userName={profileFromSession.name}
              activeTab={activeTab}
              schoolCount={(sessionUser?.memberships ?? []).filter((membership) => membership.tenantType !== 'individual').length}
              schools={(sessionUser?.memberships ?? [])
                .filter((membership) => membership.tenantType !== 'individual')
                .map((membership) => ({
                  tenantId: membership.tenantId,
                  tenantName: membership.tenantName,
                  tenantCode: membership.tenantCode,
                  roleLabel: membership.roleLabel,
                  current: membership.current ?? membership.tenantId === sessionUser?.tenant?.id,
                }))}
              onSelectTab={setActiveTab}
              onOpenModal={handleOpenModal}
              onSwitchWorkspace={handleSwitchWorkspace}
            />
          ) : activeTab === 'students' ? (
            <StudentsDirectoryView
              students={students}
              onOpenModal={handleOpenModal}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'resources' || activeTab === 'lessons' ? (
            <ResourceLibraryView
              onOpenModal={handleOpenModal}
              onNavigateTab={setActiveTab}
            />
          ) : (
            <>
              {currentRole === 'school_admin' && (
                <>
                  {activeTab === 'reports' ? (
                    <SchoolAdminReportsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'results' ? (
                    <AdminResultsWorkflowView onOpenModal={handleOpenModal} />
                  ) : activeTab === 'settings' ? (
                    <SchoolAdminSettingsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : (
                    <AdminDashboardView
                      students={students}
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                </>
              )}

              {currentRole === 'bursar' && (
                <>
                  {activeTab === 'reports' ? (
                    <SchoolAdminReportsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'settings' ? (
                    <SchoolAdminSettingsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'payments' ||
                    activeTab === 'receipts' ||
                    activeTab === 'reminders' ? (
                    <ParentPaymentsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : (
                    <BursarDashboardView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                </>
              )}

              {currentRole === 'examination_officer' && (
                <>
                  {activeTab === 'assessments' ? (
                    <TeacherAssessmentsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'results' ? (
                    <AdminResultsWorkflowView onOpenModal={handleOpenModal} />
                  ) : activeTab === 'reports' ? (
                    <SchoolAdminReportsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'settings' ? (
                    <SchoolAdminSettingsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : (
                    <ExamOfficerDashboardView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                </>
              )}

              {currentRole === 'teacher' && (
                <>
                  {activeTab === 'assessments' ? (
                    <TeacherAssessmentsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'attendance' ? (
                    <TeacherAttendanceView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'my_classes' ? (
                    <TeacherMyClassesView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'more' ||
                    activeTab === 'scheme' ||
                    activeTab === 'homework' ? (
                    <TeacherMoreView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : (
                    <TeacherDashboardView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                </>
              )}

              {currentRole === 'principal' && (
                <>
                  {activeTab === 'academics' ? (
                    <PrincipalAcademicsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'attendance' ? (
                    <PrincipalAttendanceView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'finance' ? (
                    <PrincipalFinanceView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'staff' ? (
                    <PrincipalStaffView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'reports' ? (
                    <PrincipalReportsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'results' ? (
                    <AdminResultsWorkflowView onOpenModal={handleOpenModal} />
                  ) : activeTab === 'communication' ? (
                    <PrincipalCommunicationView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'settings' ? (
                    <SchoolAdminSettingsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : (
                    <PrincipalDashboardView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                </>
              )}

              {currentRole === 'super_admin' && (
                <>
                  {activeTab === 'schools' && (
                    <SchoolsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                  {activeTab === 'plans' && (
                    <PlansView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                  {activeTab === 'subscriptions' && (
                    <SubscriptionsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                  {activeTab === 'usage' && (
                    <UsageView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                  {activeTab === 'support' && (
                    <SupportView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                  {activeTab === 'system_health' && (
                    <SystemHealthView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                  {activeTab === 'more' && (
                    <MoreMenuView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                  {(activeTab === 'overview' ||
                    (activeTab !== 'schools' &&
                      activeTab !== 'plans' &&
                      activeTab !== 'subscriptions' &&
                      activeTab !== 'usage' &&
                      activeTab !== 'support' &&
                      activeTab !== 'system_health' &&
                      activeTab !== 'more')) && (
                    <SuperAdminDashboardView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                </>
              )}

              {currentRole === 'parent' && (
                <>
                  {activeTab === 'my_children' ? (
                    <ParentMyChildrenView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'attendance' ? (
                    <ParentAttendanceView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'academics' ? (
                    <ParentAcademicsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'payments' ? (
                    <ParentPaymentsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'messages' ? (
                    <ParentMessagesView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'more' ? (
                    <ParentMoreView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : (
                    <ParentDashboardView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                </>
              )}

              {currentRole === 'student' && (
                <>
                  {activeTab === 'my_progress' ? (
                    <StudentProgressView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'learning' ? (
                    <StudentLearningView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'assessments' ? (
                    <StudentAssessmentsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'results' ? (
                    <StudentResultsView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : activeTab === 'more' ? (
                    <StudentMoreView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  ) : (
                    <StudentDashboardView
                      onOpenModal={handleOpenModal}
                      onNavigateTab={setActiveTab}
                    />
                  )}
                </>
              )}
            </>
          )}
              </Suspense>
            }
          />
        </Routes>
      </main>
      )}



      {/* Mount only the active modal to avoid idle re-renders and heavy JS */}
      <Suspense fallback={<ModalSkeleton />}>
        {isSmartMark && (
          <SmartMarkModal isOpen onClose={handleCloseModal} />
        )}
        {isAiLesson && (
          <AILessonBuilderModal
            isOpen
            onClose={handleCloseModal}
            initialTopic={modalData?.topic}
          />
        )}
        {activeModal === 'register_student' && (
          <RegisterStudentModal
            isOpen
            onClose={handleCloseModal}
            onSaveStudent={handleSaveNewStudent}
          />
        )}
        {activeModal === 'attendance' && (
          <AttendanceModal
            isOpen
            onClose={handleCloseModal}
            initialClassArm={modalData?.classArm}
          />
        )}
        {activeModal === 'report_card' && (
          <ReportCardModal
            isOpen
            onClose={handleCloseModal}
            student={modalData}
          />
        )}
        {activeModal === 'result_checker' && (
          <ResultCheckerModal
            isOpen
            onClose={handleCloseModal}
            student={modalData}
          />
        )}
        {activeModal === 'make_payment' && (
          <MakePaymentModal
            isOpen
            onClose={handleCloseModal}
            student={modalData}
          />
        )}
      </Suspense>
    </div>
  );
}
