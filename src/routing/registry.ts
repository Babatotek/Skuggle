import type { CanonicalRouteDefinition, RouteAccessMetadata } from './types';

const expose = true as const;
const publicAccess: RouteAccessMetadata = { authenticated: false, exposureOnly: expose };
const authed: RouteAccessMetadata = { authenticated: true, exposureOnly: expose };

const CANONICAL_CAPABILITY: Readonly<Record<string, string>> = {
  'platform.view': 'platform.tenant.view',
  'users.manage': 'identity.user.manage',
  'roles.manage': 'identity.role.manage',
  'security.manage': 'identity.security.manage',
  'audit.view': 'identity.audit.view',
  'settings.configure': 'school.settings.update',
  'students.view': 'students.profile.view',
  'students.create': 'students.profile.create',
  'attendance.view': 'attendance.student.view',
  'assessments.view': 'assessment.assessment.view',
  'results.view': 'performance.result.view',
  'reports.view': 'reporting.report.view',
  'finance.view': 'finance.account.view',
  'library.view': 'library.resource.view',
  'ai.generate': 'ai.content.generate',
  'admissions.manage': 'admissions.application.manage',
  'communication.send': 'communication.message.send',
  'operations.manage': 'operations.record.manage',
  'services.manage': 'services.record.manage',
};

const cap = (...capabilities: string[]): RouteAccessMetadata => ({
  authenticated: true,
  capabilities: capabilities.map((capability) => CANONICAL_CAPABILITY[capability] ?? capability),
  capabilitiesMode: 'any',
  exposureOnly: expose,
});

function route(definition: CanonicalRouteDefinition): CanonicalRouteDefinition {
  return definition;
}

const publicRoutes: CanonicalRouteDefinition[] = [
  route({ id: 'public.landing', workspace: 'public', domain: 'landing', capability: 'public.landing', path: '/', pageKey: 'landing', access: publicAccess, breadcrumb: { label: 'Home' }, visibility: 'public', classification: 'public', title: 'Skuggle' }),
  route({ id: 'public.tenant-welcome', workspace: 'public', domain: 'welcome', capability: 'public.welcome', path: '/welcome', pageKey: 'tenant-welcome', access: publicAccess, breadcrumb: { label: 'Welcome' }, visibility: 'public', classification: 'public', title: 'Welcome' }),
  route({ id: 'public.tenant-login', workspace: 'public', domain: 'welcome', capability: 'public.login', path: '/welcome/login', pageKey: 'tenant-login', access: publicAccess, breadcrumb: { label: 'Sign in', parentId: 'public.tenant-welcome' }, visibility: 'public', classification: 'public', title: 'School sign in' }),
  route({ id: 'public.register-school', workspace: 'public', domain: 'register', capability: 'public.register', path: '/register', pageKey: 'register-school', access: publicAccess, breadcrumb: { label: 'Register school' }, visibility: 'public', classification: 'public', title: 'Register a school' }),
  route({ id: 'public.results', workspace: 'public', domain: 'results', capability: 'public.results', path: '/results', pageKey: 'result-checker', access: publicAccess, breadcrumb: { label: 'Results' }, visibility: 'public', classification: 'public', title: 'Check results' }),
  route({ id: 'auth.personal-login', workspace: 'auth', domain: 'login', capability: 'auth.login', path: '/login', pageKey: 'personal-auth', access: publicAccess, breadcrumb: { label: 'Sign in' }, visibility: 'public', classification: 'public', title: 'Sign in' }),
  route({ id: 'auth.school-login', workspace: 'auth', domain: 'login', capability: 'auth.school-login', path: '/school/login', pageKey: 'school-auth', access: publicAccess, breadcrumb: { label: 'School sign in' }, visibility: 'public', classification: 'public', title: 'School sign in' }),
  route({ id: 'auth.reset-password', workspace: 'auth', domain: 'reset', capability: 'auth.reset', path: '/reset-password', pageKey: 'reset-password', access: publicAccess, breadcrumb: { label: 'Reset password' }, visibility: 'public', classification: 'public', title: 'Reset password' }),
  route({ id: 'auth.verify-email', workspace: 'auth', domain: 'verify', capability: 'auth.verify', path: '/verify-email', pageKey: 'verify-email', access: publicAccess, breadcrumb: { label: 'Verify email' }, visibility: 'public', classification: 'public', title: 'Verify email' }),
  route({ id: 'auth.join', workspace: 'auth', domain: 'join', capability: 'auth.join', path: '/join', pageKey: 'join', access: publicAccess, breadcrumb: { label: 'Join' }, visibility: 'public', classification: 'public', title: 'Join school' }),
  route({ id: 'auth.continue', workspace: 'auth', domain: 'login', capability: 'auth.continue', path: '/session', pageKey: 'school-home', access: authed, breadcrumb: { label: 'Continue' }, visibility: 'authenticated', classification: 'private', title: 'Continue' }),
  route({ id: 'public.not-found', workspace: 'public', domain: 'landing', capability: 'public.not-found', path: '/not-found', pageKey: 'not-found', access: publicAccess, breadcrumb: { label: 'Not found' }, visibility: 'public', classification: 'public', title: 'Page not found' }),
];

const schoolHome: CanonicalRouteDefinition[] = [
  route({ id: 'school.home', workspace: 'school', domain: 'home', capability: 'school.home', path: '/school', pageKey: 'school-home', access: authed, breadcrumb: { label: 'Home' }, legacyNavIds: ['home'], visibility: 'authenticated', classification: 'private', title: 'Home', isWorkspaceDefault: true }),
];

const people: CanonicalRouteDefinition[] = [
  route({ id: 'school.people.students', workspace: 'school', domain: 'people', capability: 'people.students', path: '/school/people/students', pageKey: 'students', query: [{ name: 'q', kind: 'search', invalid: 'drop' }, { name: 'page', kind: 'page', invalid: 'default', defaultValue: '1' }, { name: 'class', kind: 'filter', invalid: 'drop' }, { name: 'status', kind: 'filter', invalid: 'drop' }], access: cap('students.view'), breadcrumb: { label: 'Students', parentId: 'school.home' }, legacyNavIds: ['students', 'bulk-import'], visibility: 'staff', classification: 'private', title: 'Students' }),
  route({ id: 'school.people.students.profile', workspace: 'school', domain: 'people', capability: 'people.students', path: '/school/people/students/:studentPublicId', pageKey: 'students', params: [{ name: 'studentPublicId', kind: 'publicId', invalid: '404' }], access: cap('students.view'), breadcrumb: { label: 'Student', parentId: 'school.people.students' }, legacyNavIds: ['students'], visibility: 'staff', classification: 'private', title: 'Student profile' }),
  route({ id: 'school.people.guardians', workspace: 'school', domain: 'people', capability: 'people.guardians', path: '/school/people/guardians', pageKey: 'guardians', access: cap('students.view'), breadcrumb: { label: 'Guardians', parentId: 'school.home' }, legacyNavIds: ['parents'], visibility: 'staff', classification: 'private', title: 'Guardians' }),
  route({ id: 'school.people.workforce', workspace: 'school', domain: 'people', capability: 'people.workforce', path: '/school/people/workforce', pageKey: 'workforce', query: [{ name: 'view', kind: 'view', enumValues: ['staff', 'teachers'], invalid: 'default', defaultValue: 'staff' }], access: cap('users.manage'), breadcrumb: { label: 'Workforce', parentId: 'school.home' }, legacyNavIds: ['people', 'staff'], visibility: 'staff', classification: 'private', title: 'Workforce' }),
  route({ id: 'school.people.workforce.teachers', workspace: 'school', domain: 'people', capability: 'people.workforce', path: '/school/people/workforce/teachers', pageKey: 'workforce', access: cap('users.manage'), breadcrumb: { label: 'Teachers', parentId: 'school.people.workforce' }, legacyNavIds: ['teachers'], visibility: 'staff', classification: 'private', title: 'Teachers', pageContext: { view: 'teachers' } }),
  route({ id: 'school.people.invitations', workspace: 'school', domain: 'people', capability: 'people.workforce', path: '/school/people/invitations', pageKey: 'invitations', access: cap('users.manage'), breadcrumb: { label: 'Invitations', parentId: 'school.people.workforce' }, legacyNavIds: ['invitations'], visibility: 'staff', classification: 'private', title: 'Invitations' }),
];

// View is the fine-grained grant; manage is the legacy aggregate alias target.
const admissionsAccess = cap('admissions.application.view', 'admissions.manage');
const admissions: CanonicalRouteDefinition[] = [
  route({ id: 'school.admissions', workspace: 'school', domain: 'admissions', capability: 'admissions.overview', path: '/school/admissions', pageKey: 'admissions', access: admissionsAccess, breadcrumb: { label: 'Admissions', parentId: 'school.home' }, visibility: 'staff', classification: 'private', title: 'Admissions', pageContext: { section: 'overview' } }),
  route({ id: 'school.admissions.applications', workspace: 'school', domain: 'admissions', capability: 'admissions.applications', path: '/school/admissions/applications', pageKey: 'admissions', access: admissionsAccess, breadcrumb: { label: 'Applications', parentId: 'school.admissions' }, visibility: 'staff', classification: 'private', title: 'Applications', pageContext: { section: 'applications' } }),
  route({ id: 'school.admissions.screening', workspace: 'school', domain: 'admissions', capability: 'admissions.screening', path: '/school/admissions/screening', pageKey: 'admissions', access: admissionsAccess, breadcrumb: { label: 'Screening', parentId: 'school.admissions' }, visibility: 'staff', classification: 'private', title: 'Screening', pageContext: { section: 'screening' } }),
  route({ id: 'school.admissions.decisions', workspace: 'school', domain: 'admissions', capability: 'admissions.decisions', path: '/school/admissions/decisions', pageKey: 'admissions', access: admissionsAccess, breadcrumb: { label: 'Decisions & Offers', parentId: 'school.admissions' }, visibility: 'staff', classification: 'private', title: 'Decisions & Offers', pageContext: { section: 'decisions' } }),
  route({ id: 'school.admissions.enrolment', workspace: 'school', domain: 'admissions', capability: 'admissions.enrolment', path: '/school/admissions/enrolment', pageKey: 'admissions', access: admissionsAccess, breadcrumb: { label: 'Enrolment', parentId: 'school.admissions' }, visibility: 'staff', classification: 'private', title: 'Enrolment', pageContext: { section: 'enrolment' } }),
  route({ id: 'school.admissions.settings', workspace: 'school', domain: 'admissions', capability: 'admissions.settings', path: '/school/admissions/settings', pageKey: 'admissions', access: admissionsAccess, breadcrumb: { label: 'Settings', parentId: 'school.admissions' }, visibility: 'staff', classification: 'private', title: 'Admissions settings', pageContext: { section: 'settings' } }),
];

const teaching: CanonicalRouteDefinition[] = [
  route({ id: 'school.academics', workspace: 'school', domain: 'academics', capability: 'academics.overview', path: '/school/academics', pageKey: 'academics', access: cap('settings.configure', 'students.view'), breadcrumb: { label: 'Academics', parentId: 'school.home' }, legacyNavIds: ['academics'], visibility: 'staff', classification: 'private', title: 'Academics', pageContext: { section: 'overview' } }),
  route({ id: 'school.academics.curriculum', workspace: 'school', domain: 'academics', capability: 'academics.curriculum', path: '/school/academics/curriculum', pageKey: 'academics', access: cap('settings.configure', 'students.view'), breadcrumb: { label: 'Curriculum', parentId: 'school.academics' }, legacyNavIds: ['academic-curriculum'], visibility: 'staff', classification: 'private', title: 'Curriculum', pageContext: { section: 'curriculum' } }),
  route({ id: 'school.academics.planning', workspace: 'school', domain: 'academics', capability: 'academics.planning', path: '/school/academics/planning', pageKey: 'academics', access: cap('ai.generate', 'students.view'), breadcrumb: { label: 'Planning', parentId: 'school.academics' }, legacyNavIds: ['academic-planning', 'lessons', 'teacher-ai'], visibility: 'staff', classification: 'private', title: 'Planning', pageContext: { section: 'planning' } }),
  route({ id: 'school.academics.allocation', workspace: 'school', domain: 'academics', capability: 'academics.allocation', path: '/school/academics/allocation', pageKey: 'academics', access: cap('settings.configure', 'students.view'), breadcrumb: { label: 'Allocation', parentId: 'school.academics' }, legacyNavIds: ['academic-allocation'], visibility: 'staff', classification: 'private', title: 'Allocation', pageContext: { section: 'allocation' } }),
  route({ id: 'school.academics.resources', workspace: 'school', domain: 'academics', capability: 'academics.resources', path: '/school/academics/resources', pageKey: 'academics', access: cap('library.view', 'students.view'), breadcrumb: { label: 'Resources', parentId: 'school.academics' }, legacyNavIds: ['academic-resources'], visibility: 'staff', classification: 'private', title: 'Academic resources', pageContext: { section: 'resources' } }),
  route({ id: 'school.academics.timetable', workspace: 'school', domain: 'academics', capability: 'academics.timetable', path: '/school/academics/timetable', pageKey: 'timetable', access: cap('settings.configure', 'students.view'), breadcrumb: { label: 'Timetable', parentId: 'school.academics' }, legacyNavIds: ['timetable'], visibility: 'staff', classification: 'private', title: 'Timetable' }),
  route({ id: 'school.assessment', workspace: 'school', domain: 'assessment', capability: 'assessment.overview', path: '/school/assessment', pageKey: 'assessment', access: cap('assessments.view'), breadcrumb: { label: 'Assessment', parentId: 'school.home' }, legacyNavIds: ['assessments'], visibility: 'staff', classification: 'private', title: 'Assessment', pageContext: { tab: 'overview' } }),
  route({ id: 'school.assessment.assessments', workspace: 'school', domain: 'assessment', capability: 'assessment.assessments', path: '/school/assessment/assessments', pageKey: 'assessment', query: [{ name: 'type', kind: 'type', enumValues: ['continuous', 'tests', 'examinations', 'continuous-assessment', 'quiz', 'test', 'mid-term-test', 'exam', 'assignment', 'project', 'practical', 'oral', 'presentation'], invalid: 'drop' }], access: cap('assessments.view'), breadcrumb: { label: 'Assessments', parentId: 'school.assessment' }, legacyNavIds: ['continuous-assessment', 'tests', 'examinations'], visibility: 'staff', classification: 'private', title: 'Assessments', pageContext: { tab: 'assessments' } }),
  ...(['create', 'import', 'detail', 'edit', 'questions', 'score-entry', 'marking-detail', 'moderation'] as const).map((view) => route({
    id: `school.assessment.${view}`, workspace: 'school', domain: 'assessment', capability: `assessment.${view}`,
    path: view === 'create' || view === 'import' ? `/school/assessment/assessments/${view}` : `/school/assessment/assessments/:assessmentPublicId${view === 'detail' ? '' : '/' + (view === 'marking-detail' ? 'marking' : view)}`,
    pageKey: 'assessment', params: view === 'create' || view === 'import' ? [] : [{ name: 'assessmentPublicId', kind: 'publicId', invalid: '404' }],
    access: cap(['create', 'edit', 'import'].includes(view) ? 'assessment.assessment.create' : 'assessments.view'),
    breadcrumb: { label: view === 'detail' ? 'Assessment details' : view, parentId: 'school.assessment' }, visibility: 'staff', classification: 'private', title: view === 'detail' ? 'Assessment details' : view,
    pageContext: { tab: view === 'marking-detail' ? 'marking' : view },
  })),
  route({ id: 'school.assessment.question-bank', workspace: 'school', domain: 'assessment', capability: 'assessment.questions', path: '/school/assessment/question-bank', pageKey: 'assessment', access: cap('assessments.view'), breadcrumb: { label: 'Question bank', parentId: 'school.assessment' }, legacyNavIds: ['question-bank'], visibility: 'staff', classification: 'private', title: 'Question bank', pageContext: { tab: 'questions' } }),
  route({ id: 'school.assessment.exam-schedule', workspace: 'school', domain: 'assessment', capability: 'assessment.schedule', path: '/school/assessment/schedule', pageKey: 'assessment', access: cap('assessments.view'), breadcrumb: { label: 'Exam schedule', parentId: 'school.assessment' }, legacyNavIds: ['exam-scheduling'], visibility: 'staff', classification: 'private', title: 'Exam schedule', pageContext: { tab: 'schedule' } }),
  route({ id: 'school.assessment.marking', workspace: 'school', domain: 'assessment', capability: 'assessment.marking', path: '/school/assessment/marking', pageKey: 'assessment', access: cap('assessments.view'), breadcrumb: { label: 'Marking', parentId: 'school.assessment' }, legacyNavIds: ['marks-entry', 'manual-assessment', 'smartmark'], visibility: 'staff', classification: 'private', title: 'Marking', pageContext: { tab: 'marking' } }),
  route({ id: 'school.assessment.settings', workspace: 'school', domain: 'assessment', capability: 'assessment.settings', path: '/school/assessment/settings', pageKey: 'assessment', access: cap('assessment.settings.configure'), breadcrumb: { label: 'Settings', parentId: 'school.assessment' }, legacyNavIds: ['grade-configuration'], visibility: 'staff', classification: 'private', title: 'Assessment settings', pageContext: { tab: 'settings' } }),
  route({ id: 'school.assessment.cbt', workspace: 'school', domain: 'assessment', capability: 'assessment.cbt', path: '/school/assessment/cbt', pageKey: 'assessment', access: cap('assessments.view'), breadcrumb: { label: 'Online assessments', parentId: 'school.assessment' }, visibility: 'staff', classification: 'private', title: 'Online assessments', pageContext: { tab: 'assessments', delivery: 'cbt' } }),
  route({ id: 'school.student-cbt', workspace: 'school', domain: 'student-cbt', capability: 'student.cbt', path: '/school/my-assessments', pageKey: 'student-cbt', access: cap('assessment.cbt.attempt'), breadcrumb: { label: 'My CBT Assessments', parentId: 'school.home' }, legacyNavIds: ['cbt'], visibility: 'student', classification: 'private', title: 'My CBT Assessments' }),
  route({ id: 'school.student-cbt.take', workspace: 'school', domain: 'student-cbt', capability: 'student.cbt.take', path: '/school/my-assessments/:assessmentPublicId/take', pageKey: 'student-cbt-take', params: [{ name: 'assessmentPublicId', kind: 'publicId', invalid: '404' }], access: cap('assessment.cbt.attempt'), breadcrumb: { label: 'Take assessment', parentId: 'school.student-cbt' }, visibility: 'student', classification: 'private', title: 'Take CBT assessment' }),
  route({ id: 'school.performance', workspace: 'school', domain: 'performance', capability: 'performance.overview', path: '/school/performance', pageKey: 'performance', access: cap('reports.view'), breadcrumb: { label: 'Performance', parentId: 'school.home' }, legacyNavIds: ['student-progress'], visibility: 'staff', classification: 'private', title: 'Performance', pageContext: { view: 'students' } }),
  route({ id: 'school.performance.results', workspace: 'school', domain: 'performance', capability: 'performance.results', path: '/school/performance/results', pageKey: 'results', access: cap('results.view', 'reports.view'), breadcrumb: { label: 'Results', parentId: 'school.performance' }, legacyNavIds: ['results', 'result-approval', 'result-publishing', 'result-pins'], visibility: 'staff', classification: 'private', title: 'Results' }),
  route({ id: 'school.performance.report-cards', workspace: 'school', domain: 'performance', capability: 'performance.report-cards', path: '/school/performance/report-cards', pageKey: 'report-cards', access: cap('results.view', 'reports.view'), breadcrumb: { label: 'Report cards', parentId: 'school.performance' }, legacyNavIds: ['report-cards'], visibility: 'staff', classification: 'private', title: 'Report cards' }),
  route({ id: 'school.performance.broadsheet', workspace: 'school', domain: 'performance', capability: 'performance.broadsheet', path: '/school/performance/broadsheet', pageKey: 'results', access: cap('results.view', 'reports.view'), breadcrumb: { label: 'Broadsheet', parentId: 'school.performance' }, visibility: 'staff', classification: 'private', title: 'Broadsheet', pageContext: { section: 'broadsheet' } }),
  route({ id: 'school.performance.analytics', workspace: 'school', domain: 'performance', capability: 'performance.analytics', path: '/school/performance/analytics', pageKey: 'performance', access: cap('reports.view'), breadcrumb: { label: 'Analytics', parentId: 'school.performance' }, legacyNavIds: ['subject-performance', 'class-performance', 'performance-trends', 'ai-performance'], visibility: 'staff', classification: 'private', title: 'Performance analytics', pageContext: { view: 'trends' } }),
  route({ id: 'school.performance.at-risk', workspace: 'school', domain: 'performance', capability: 'performance.at-risk', path: '/school/performance/at-risk', pageKey: 'performance', access: cap('reports.view'), breadcrumb: { label: 'At-risk', parentId: 'school.performance' }, legacyNavIds: ['at-risk-students'], visibility: 'staff', classification: 'private', title: 'At-risk students', pageContext: { view: 'at-risk' } }),
  route({ id: 'school.performance.interventions', workspace: 'school', domain: 'performance', capability: 'performance.interventions', path: '/school/performance/interventions', pageKey: 'module', access: cap('students.view'), breadcrumb: { label: 'Interventions', parentId: 'school.performance' }, legacyNavIds: ['intervention-tracking'], visibility: 'staff', classification: 'private', title: 'Interventions', moduleKey: 'interventions' }),
  route({ id: 'school.learning-resources', workspace: 'school', domain: 'learning-resources', capability: 'learning.resources', path: '/school/learning-resources', pageKey: 'learning-resources', access: cap('library.view'), breadcrumb: { label: 'Learning resources', parentId: 'school.home' }, legacyNavIds: ['library', 'online-materials', 'recorded-lessons'], visibility: 'staff', classification: 'private', title: 'Learning resources' }),
];

const operations: CanonicalRouteDefinition[] = [
  route({ id: 'school.attendance', workspace: 'school', domain: 'attendance', capability: 'attendance.overview', path: '/school/attendance', pageKey: 'attendance', query: [{ name: 'view', kind: 'view', enumValues: ['roll-call', 'trends', 'summary'], invalid: 'default', defaultValue: 'roll-call' }], access: cap('attendance.view'), breadcrumb: { label: 'Attendance', parentId: 'school.home' }, legacyNavIds: ['attendance', 'daily-register', 'attendance-analytics', 'attendance-summary'], visibility: 'staff', classification: 'private', title: 'Attendance' }),
  route({ id: 'school.finance', workspace: 'school', domain: 'finance', capability: 'finance.overview', path: '/school/finance', pageKey: 'finance', query: [{ name: 'view', kind: 'view', enumValues: ['invoices', 'structure', 'settlement'], invalid: 'default', defaultValue: 'invoices' }], access: cap('finance.view'), breadcrumb: { label: 'Finance', parentId: 'school.home' }, legacyNavIds: ['finance', 'student-billing', 'invoices', 'fee-structure', 'payments', 'outstanding-fees', 'receipts'], visibility: 'staff', classification: 'private', title: 'Finance' }),
  route({ id: 'school.student-services', workspace: 'school', domain: 'student-services', capability: 'services.overview', path: '/school/student-services', pageKey: 'module', access: cap('services.manage'), breadcrumb: { label: 'Student services', parentId: 'school.home' }, legacyNavIds: ['behaviour', 'discipline', 'welfare', 'counselling', 'student-support', 'transport'], visibility: 'staff', classification: 'private', title: 'Student services', moduleKey: 'behaviour' }),
  route({ id: 'school.operations', workspace: 'school', domain: 'operations', capability: 'operations.overview', path: '/school/operations', pageKey: 'module', access: cap('operations.manage'), breadcrumb: { label: 'Operations', parentId: 'school.home' }, legacyNavIds: ['assets', 'inventory', 'operations-facilities', 'approvals', 'documents'], visibility: 'staff', classification: 'private', title: 'Operations', moduleKey: 'assets' }),
];

const engagementInsights: CanonicalRouteDefinition[] = [
  route({ id: 'school.communication', workspace: 'school', domain: 'communication', capability: 'communication.overview', path: '/school/communication', pageKey: 'broadcasts', access: cap('students.view', 'communication.send'), breadcrumb: { label: 'Communication', parentId: 'school.home' }, legacyNavIds: ['announcements', 'notices', 'broadcasts'], visibility: 'staff', classification: 'private', title: 'Communication' }),
  route({ id: 'school.communication.messages', workspace: 'school', domain: 'communication', capability: 'communication.messages', path: '/school/communication/messages', pageKey: 'messages', query: [{ name: 'audience', kind: 'filter', enumValues: ['parent', 'teacher', 'student'], invalid: 'drop' }], access: cap('communication.send'), breadcrumb: { label: 'Messages', parentId: 'school.communication' }, legacyNavIds: ['parent-messages', 'teacher-messages', 'student-messages'], visibility: 'staff', classification: 'private', title: 'Messages' }),
  route({ id: 'school.calendar', workspace: 'school', domain: 'calendar', capability: 'calendar.overview', path: '/school/calendar', pageKey: 'placeholder', access: authed, breadcrumb: { label: 'Calendar', parentId: 'school.home' }, visibility: 'placeholder', classification: 'private', title: 'Calendar', implemented: false }),
  route({ id: 'school.insights.analytics', workspace: 'school', domain: 'insights', capability: 'insights.analytics', path: '/school/insights/analytics', pageKey: 'performance', access: cap('reports.view'), breadcrumb: { label: 'Analytics', parentId: 'school.home' }, visibility: 'staff', classification: 'private', title: 'Analytics', pageContext: { view: 'insights' } }),
  route({ id: 'school.insights.reports', workspace: 'school', domain: 'insights', capability: 'insights.reports', path: '/school/insights/reports', pageKey: 'reports', access: cap('reports.view'), breadcrumb: { label: 'Reports', parentId: 'school.home' }, legacyNavIds: ['academic-reports', 'attendance-reports', 'student-reports', 'staff-reports', 'finance-reports', 'admission-reports', 'performance-reports', 'custom-reports', 'export-centre', 'financial-reports', 'operational-reports'], visibility: 'staff', classification: 'private', title: 'Reports' }),
];

const administration: CanonicalRouteDefinition[] = [
  route({ id: 'school.administration.school-setup', workspace: 'school', domain: 'administration', capability: 'administration.school-setup', path: '/school/administration/school-setup', pageKey: 'structure', access: cap('settings.configure'), breadcrumb: { label: 'School setup', parentId: 'school.home' }, legacyNavIds: ['school-overview', 'school-organisation', 'school-academics', 'school-facilities', 'school-settings-hub', 'school-settings'], visibility: 'staff', classification: 'private', title: 'School setup', pageContext: { resource: 'overview' } }),
  route({ id: 'school.administration.users-access', workspace: 'school', domain: 'administration', capability: 'administration.users', path: '/school/administration/users-access', pageKey: 'accounts', access: cap('users.manage'), breadcrumb: { label: 'Users & access', parentId: 'school.home' }, legacyNavIds: ['user-access', 'accounts'], visibility: 'staff', classification: 'private', title: 'Users & access' }),
  route({ id: 'school.administration.roles-permissions', workspace: 'school', domain: 'administration', capability: 'administration.roles', path: '/school/administration/roles-permissions', pageKey: 'administrators', access: cap('roles.manage'), breadcrumb: { label: 'Roles & permissions', parentId: 'school.home' }, legacyNavIds: ['roles-permissions', 'administrators'], visibility: 'staff', classification: 'private', title: 'Roles & permissions' }),
  route({ id: 'school.administration.forms', workspace: 'school', domain: 'administration', capability: 'administration.forms', path: '/school/administration/forms', pageKey: 'forms', access: cap('settings.configure'), breadcrumb: { label: 'Forms', parentId: 'school.home' }, legacyNavIds: ['school-forms'], visibility: 'staff', classification: 'private', title: 'Forms & custom fields' }),
  route({ id: 'school.administration.workflows', workspace: 'school', domain: 'administration', capability: 'administration.workflows', path: '/school/administration/workflows', pageKey: 'module', access: cap('settings.configure'), breadcrumb: { label: 'Workflows', parentId: 'school.home' }, legacyNavIds: ['workflow-rules', 'automation'], visibility: 'staff', classification: 'private', title: 'Workflows', moduleKey: 'workflows' }),
  route({ id: 'school.administration.integrations', workspace: 'school', domain: 'administration', capability: 'administration.integrations', path: '/school/administration/integrations', pageKey: 'module', access: cap('security.manage'), breadcrumb: { label: 'Integrations', parentId: 'school.home' }, legacyNavIds: ['integrations'], visibility: 'staff', classification: 'private', title: 'Integrations', moduleKey: 'integrations' }),
  route({ id: 'school.administration.subscription', workspace: 'school', domain: 'administration', capability: 'administration.subscription', path: '/school/administration/subscription', pageKey: 'subscription', access: authed, breadcrumb: { label: 'Subscription', parentId: 'school.home' }, legacyNavIds: ['current-plan', 'usage', 'billing', 'subscription-invoices', 'entitlements', 'upgrade'], visibility: 'authenticated', classification: 'private', title: 'Subscription & plan' }),
  route({ id: 'school.administration.security', workspace: 'school', domain: 'administration', capability: 'administration.security', path: '/school/administration/security', pageKey: 'module', access: cap('security.manage'), breadcrumb: { label: 'Security', parentId: 'school.home' }, legacyNavIds: ['security', 'auth-policies', 'system-configuration'], visibility: 'staff', classification: 'private', title: 'Security', moduleKey: 'security-settings' }),
  route({ id: 'school.administration.audit', workspace: 'school', domain: 'administration', capability: 'administration.audit', path: '/school/administration/audit', pageKey: 'audit', access: cap('audit.view'), breadcrumb: { label: 'Audit', parentId: 'school.home' }, legacyNavIds: ['audit-logs'], visibility: 'staff', classification: 'private', title: 'Audit' }),
  route({ id: 'school.administration.branding', workspace: 'school', domain: 'administration', capability: 'administration.branding', path: '/school/administration/branding', pageKey: 'branding', access: cap('settings.configure'), breadcrumb: { label: 'Branding', parentId: 'school.administration.school-setup' }, legacyNavIds: ['branding'], visibility: 'staff', classification: 'private', title: 'Branding' }),
  route({ id: 'school.help', workspace: 'school', domain: 'help', capability: 'help.support', path: '/school/help', pageKey: 'help', access: authed, breadcrumb: { label: 'Help', parentId: 'school.home' }, legacyNavIds: ['help-support', 'help'], visibility: 'authenticated', classification: 'private', title: 'Help & support' }),
];

const personal: CanonicalRouteDefinition[] = [
  route({ id: 'personal.home', workspace: 'personal', domain: 'home', capability: 'personal.home', path: '/personal', pageKey: 'personal-home', access: authed, breadcrumb: { label: 'Home' }, visibility: 'personal', classification: 'private', title: 'Personal home', isWorkspaceDefault: true }),
  route({ id: 'personal.learning-resources', workspace: 'personal', domain: 'learning-resources', capability: 'personal.learning', path: '/personal/learning-resources', pageKey: 'learning-resources', access: authed, breadcrumb: { label: 'Learning resources', parentId: 'personal.home' }, visibility: 'personal', classification: 'private', title: 'Learning resources' }),
  route({ id: 'personal.assessment', workspace: 'personal', domain: 'assessment', capability: 'personal.assessment', path: '/personal/assessment', pageKey: 'assessment', access: cap('assessments.view'), breadcrumb: { label: 'Assessment', parentId: 'personal.home' }, visibility: 'personal', classification: 'private', title: 'Assessment' }),
  route({ id: 'personal.subscription', workspace: 'personal', domain: 'subscription', capability: 'personal.subscription', path: '/personal/subscription', pageKey: 'subscription', access: authed, breadcrumb: { label: 'Subscription', parentId: 'personal.home' }, visibility: 'personal', classification: 'private', title: 'Subscription' }),
  route({ id: 'personal.help', workspace: 'personal', domain: 'help', capability: 'help.support', path: '/personal/help', pageKey: 'help', access: authed, breadcrumb: { label: 'Help', parentId: 'personal.home' }, visibility: 'personal', classification: 'private', title: 'Help & support' }),
];

const platform: CanonicalRouteDefinition[] = [
  route({ id: 'platform.overview', workspace: 'platform', domain: 'overview', capability: 'platform.overview', path: '/platform', pageKey: 'platform-overview', access: cap('platform.view'), breadcrumb: { label: 'Overview' }, legacyNavIds: ['platform'], visibility: 'platform', classification: 'private', title: 'Platform overview', isWorkspaceDefault: true }),
  route({ id: 'platform.tenants', workspace: 'platform', domain: 'tenants', capability: 'platform.tenants', path: '/platform/tenants', pageKey: 'platform-overview', access: cap('platform.view'), breadcrumb: { label: 'Tenants', parentId: 'platform.overview' }, legacyNavIds: ['schools'], visibility: 'platform', classification: 'private', title: 'Platform tenants' }),
  route({ id: 'platform.health', workspace: 'platform', domain: 'health', capability: 'platform.health', path: '/platform/health', pageKey: 'platform-overview', access: cap('platform.view'), breadcrumb: { label: 'Health', parentId: 'platform.overview' }, legacyNavIds: ['health'], visibility: 'platform', classification: 'private', title: 'System health' }),
  route({ id: 'platform.governance', workspace: 'platform', domain: 'governance', capability: 'platform.governance', path: '/platform/governance', pageKey: 'platform-overview', access: cap('platform.view'), breadcrumb: { label: 'Governance', parentId: 'platform.overview' }, legacyNavIds: ['governance'], visibility: 'platform', classification: 'private', title: 'Security & audit' }),
  route({ id: 'platform.help', workspace: 'platform', domain: 'help', capability: 'help.support', path: '/platform/help', pageKey: 'help', access: cap('platform.view'), breadcrumb: { label: 'Help', parentId: 'platform.overview' }, visibility: 'platform', classification: 'private', title: 'Help & support' }),
];

const relate: CanonicalRouteDefinition[] = [
  route({ id: 'relate.home', workspace: 'relate', domain: 'home', capability: 'relate.home', path: '/relate', pageKey: 'placeholder', access: authed, breadcrumb: { label: 'Relate' }, visibility: 'placeholder', classification: 'private', title: 'Skuggle Relate', implemented: false }),
];

export const CANONICAL_ROUTES: readonly CanonicalRouteDefinition[] = [
  ...publicRoutes,
  ...schoolHome,
  ...people,
  ...admissions,
  ...teaching,
  ...operations,
  ...engagementInsights,
  ...administration,
  ...personal,
  ...platform,
  ...relate,
];

export const ROUTES_BY_ID: ReadonlyMap<string, CanonicalRouteDefinition> = new Map(CANONICAL_ROUTES.map((item) => [item.id, item]));
export const ROUTES_BY_PATH: ReadonlyMap<string, CanonicalRouteDefinition> = new Map(CANONICAL_ROUTES.map((item) => [item.path, item]));

export const WORKSPACE_DEFAULT_ROUTE_ID: Readonly<Record<'school' | 'personal' | 'platform', string>> = {
  school: 'school.home',
  personal: 'personal.home',
  platform: 'platform.overview',
};

export const RESERVED_SCHOOL_SEGMENTS = new Set(
  CANONICAL_ROUTES
    .filter((item) => item.path.startsWith('/school/'))
    .map((item) => item.path.split('/')[2])
    .filter(Boolean),
);

RESERVED_SCHOOL_SEGMENTS.add('login');

export const LEGACY_NAV_TO_ROUTE_ID: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const item of CANONICAL_ROUTES) {
    for (const navId of item.legacyNavIds ?? []) {
      if (!map.has(navId)) map.set(navId, item.id);
    }
  }
  map.set('home', 'school.home');
  return map;
})();
