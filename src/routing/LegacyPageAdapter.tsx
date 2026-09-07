import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { CanonicalRouteDefinition } from './types';
import { buildRoute } from './builders';
import { RouteAccessDenied, RouteNotFound, RoutePlaceholder } from './RouteSurfaces';
import {
  AcademicsConfigView,
  AdministratorsView,
  AILessonPlanner,
  AttendanceView,
  AuditLogsView,
  BrandingStudio,
  BroadcastCenterView,
  ClassTimetableView,
  FeeStructureBillingView,
  FormsSettingsView,
  HelpSupportView,
  InvitationsPage,
  LearningResourcesView,
  MessagesView,
  ParentDashboard,
  ParentsView,
  PerformanceView,
  PlatformOwnerDashboard,
  PrincipalDashboard,
  ReportCardGeneratorView,
  ReportsCentreView,
  ResultsManagementView,
  SchoolAdminDashboard,
  SchoolModuleView,
  SchoolStructureView,
  StaffManagementView,
  StudentDashboard,
  StudentRegistryView,
  SubscriptionView,
  SuperAdminDashboard,
  TeacherDashboard,
} from './pages';

/**
 * Temporary Wave 7 adapter. Canonical route → existing view.
 * Owner: Frontend Platform. Removal: Wave 8–10 as domains migrate. Not permanent architecture.
 */
export const LegacyPageAdapter: React.FC<{
  route: CanonicalRouteDefinition;
  params: Record<string, string>;
  onNavigateTab: (tab: string) => void;
}> = ({ route, params, onNavigateTab }) => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { currentRole } = useApp();
  const context = route.pageContext ?? {};
  const view = search.get('view') || context.view;
  const academicsSection = (context.section || 'overview') as 'overview' | 'curriculum' | 'planning' | 'allocation' | 'resources';
  const attendanceTab = (view as 'roll-call' | 'trends' | 'summary') || 'roll-call';
  const financeTab = (view as 'invoices' | 'structure' | 'settlement') || undefined;

  switch (route.pageKey) {
    case 'school-home':
      switch (currentRole) {
        case 'Super Admin':
          return <SuperAdminDashboard onNavigateTab={onNavigateTab} />;
        case 'School Admin':
          return <SchoolAdminDashboard onNavigateTab={onNavigateTab} />;
        case 'Principal':
          return <PrincipalDashboard onNavigateTab={onNavigateTab} />;
        case 'Teacher':
          return <TeacherDashboard onNavigateTab={onNavigateTab} />;
        case 'Parent':
          return <ParentDashboard onNavigateTab={onNavigateTab} onOpenResultChecker={() => navigate(buildRoute('public.results'))} />;
        case 'Student':
          return <StudentDashboard onNavigateTab={onNavigateTab} onOpenResultChecker={() => navigate(buildRoute('public.results'))} />;
        case 'Platform Owner':
          return <PlatformOwnerDashboard />;
        default:
          return <SchoolAdminDashboard onNavigateTab={onNavigateTab} />;
      }
    case 'personal-home':
      return <TeacherDashboard onNavigateTab={onNavigateTab} />;
    case 'platform-overview':
      return <PlatformOwnerDashboard />;
    case 'students':
      return (
        <StudentRegistryView
          mode={route.legacyNavIds?.includes('bulk-import') ? 'import' : 'register'}
          studentPublicId={params.studentPublicId}
          onOpenStudent={(id) => navigate(buildRoute('school.people.students.profile', { studentPublicId: id }))}
          onCloseStudent={() => navigate(buildRoute('school.people.students'))}
        />
      );
    case 'guardians':
      return <ParentsView />;
    case 'workforce':
      return <StaffManagementView context={view === 'teachers' || context.view === 'teachers' ? 'teachers' : 'staff'} />;
    case 'invitations':
      return <InvitationsPage />;
    case 'academics':
      return <AcademicsConfigView initialSection={academicsSection} onNavigateSection={onNavigateTab} />;
    case 'timetable':
      return <ClassTimetableView />;
    case 'performance':
      return <PerformanceView view={view || 'students'} title={route.title} />;
    case 'results':
      return <ResultsManagementView section={context.section || 'results'} />;
    case 'report-cards':
      return <ReportCardGeneratorView />;
    case 'learning-resources':
      return <LearningResourcesView title={route.title} />;
    case 'attendance':
      return <AttendanceView initialTab={attendanceTab} hideInternalNav />;
    case 'finance':
      return <FeeStructureBillingView initialTab={financeTab} hideInternalNav />;
    case 'module':
      return route.moduleKey ? <SchoolModuleView moduleKey={route.moduleKey} /> : <HelpSupportView />;
    case 'structure':
      return <SchoolStructureView resource={context.resource || 'overview'} title={route.title} />;
    case 'broadcasts':
      return <BroadcastCenterView />;
    case 'messages':
      return <MessagesView title={route.title} audience={search.get('audience') || undefined} />;
    case 'reports':
      return <ReportsCentreView title={route.title} />;
    case 'administrators':
      return <AdministratorsView />;
    case 'accounts':
      return <AdministratorsView />;
    case 'forms':
      return <FormsSettingsView />;
    case 'subscription':
      return <SubscriptionView title={route.title} />;
    case 'audit':
      return <AuditLogsView />;
    case 'branding':
      return <BrandingStudio onPreviewWelcome={() => navigate(buildRoute('public.tenant-welcome'))} />;
    case 'help':
      return <HelpSupportView />;
    case 'lessons':
      return <AILessonPlanner />;
    case 'placeholder':
      return <RoutePlaceholder title={route.title} description="This capability is registered for a later wave and is not implemented yet." />;
    case 'not-found':
      return <RouteNotFound />;
    case 'access-denied':
      return <RouteAccessDenied />;
    default:
      return <RouteNotFound />;
  }
};
