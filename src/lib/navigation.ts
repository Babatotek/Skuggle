import { UserRole, WorkspaceItem } from '../types';
import type { NavIconKey } from './navIcons';

export type NavWorkspace = 'school' | 'personal' | 'platform';

export type NavCategoryId =
  | 'overview'
  | 'institution'
  | 'people'
  | 'learning'
  | 'operations'
  | 'engagement'
  | 'governance'
  | 'support';

export type NativeView =
  | 'home'
  | 'branding'
  | 'students'
  | 'staff'
  | 'administrators'
  | 'invitations'
  | 'academics'
  | 'timetable'
  | 'lessons'
  | 'assessments'
  | 'cbt'
  | 'smartmark'
  | 'results'
  | 'report-cards'
  | 'attendance'
  | 'finance'
  | 'broadcasts'
  | 'platform'
  | 'module'
  | 'structure'
  | 'performance'
  | 'reports'
  | 'library'
  | 'help'
  | 'subscription'
  | 'messages'
  | 'parents'
  | 'accounts'
  | 'audit'
  | 'forms';

export interface NavItem {
  id: string;
  label: string;
  view: NativeView;
  icon: NavIconKey;
  permission?: string | string[];
  alsoRoles?: UserRole[];
  roles?: UserRole[];
  excludeRoles?: UserRole[];
  workspaces: NavWorkspace[];
  governance?: boolean;
  structureResource?: string;
  moduleKey?: string;
  performanceView?: string;
  reportGroup?: string;
  messageAudience?: string;
  financeTab?: 'invoices' | 'structure' | 'settlement';
  attendanceTab?: 'roll-call' | 'trends' | 'summary';
  academicsSection?: 'overview' | 'curriculum' | 'planning' | 'allocation' | 'resources';
}

export interface NavGroup {
  id: string;
  label: string;
  icon: NavIconKey;
  category: NavCategoryId;
  description: string;
  workspaces: NavWorkspace[];
  items: NavItem[];
}

export const NAV_CATEGORIES: { id: NavCategoryId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'institution', label: 'Institution' },
  { id: 'people', label: 'People & Enrolment' },
  { id: 'learning', label: 'Teaching & Learning' },
  { id: 'operations', label: 'Daily Operations' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'governance', label: 'Governance' },
  { id: 'support', label: 'Support' },
];

const school: NavWorkspace[] = ['school'];
const schoolPersonal: NavWorkspace[] = ['school', 'personal'];
const schoolPlatform: NavWorkspace[] = ['school', 'platform'];
const allSpaces: NavWorkspace[] = ['school', 'personal', 'platform'];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    category: 'overview',
    description: 'Command centre for this workspace.',
    workspaces: allSpaces,
    items: [{ id: 'home', label: 'Dashboard', view: 'home', icon: 'dashboard', workspaces: allSpaces }],
  },
  {
    id: 'school',
    label: 'School',
    icon: 'school',
    category: 'institution',
    description: 'Identity, campuses, sessions, and academic structure.',
    workspaces: school,
    items: [
      { id: 'school-overview', label: 'Overview', view: 'structure', icon: 'school-profile', structureResource: 'overview', permission: ['settings.configure', 'students.view'], workspaces: school },
      { id: 'school-organisation', label: 'Organisation', view: 'structure', icon: 'departments', structureResource: 'organisation', permission: ['settings.configure', 'users.manage'], workspaces: school },
      { id: 'school-academics', label: 'Academics', view: 'structure', icon: 'sessions', structureResource: 'academics', permission: ['settings.configure', 'students.view'], workspaces: school },
      { id: 'school-facilities', label: 'Facilities', view: 'structure', icon: 'facilities', structureResource: 'facilities', permission: ['settings.configure', 'operations.manage'], workspaces: school },
      { id: 'school-settings-hub', label: 'Settings', view: 'structure', icon: 'school-settings', structureResource: 'settings', permission: 'settings.configure', governance: true, workspaces: school },
      { id: 'school-forms', label: 'Forms', view: 'forms', icon: 'workflow-rules', permission: 'settings.configure', governance: true, workspaces: school },
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: 'people',
    category: 'people',
    description: 'Students, staff, parents, and workspace access.',
    workspaces: school,
    items: [
      { id: 'students', label: 'Students', view: 'students', icon: 'students', permission: 'students.view', alsoRoles: ['Parent'], workspaces: school },
      { id: 'teachers', label: 'Teachers', view: 'staff', icon: 'teachers', permission: 'users.manage', alsoRoles: ['Principal'], workspaces: school },
      { id: 'people', label: 'Staff', view: 'staff', icon: 'staff', permission: 'users.manage', workspaces: school },
      { id: 'parents', label: 'Parents / Guardians', view: 'parents', icon: 'parents', permission: 'students.view', workspaces: school },
    ],
  },
  {
    id: 'academics',
    label: 'Academics',
    icon: 'academics',
    category: 'learning',
    description: 'Curriculum, allocations, timetable, and teaching plans.',
    workspaces: schoolPersonal,
    items: [
      { id: 'academics', label: 'Overview', view: 'academics', icon: 'academics', academicsSection: 'overview', permission: ['settings.configure', 'students.view'], alsoRoles: ['Teacher', 'Principal'], workspaces: school },
      { id: 'academic-curriculum', label: 'Curriculum', view: 'academics', icon: 'curriculum', academicsSection: 'curriculum', permission: ['settings.configure', 'students.view'], alsoRoles: ['Teacher', 'Principal'], workspaces: school },
      { id: 'academic-planning', label: 'Planning', view: 'academics', icon: 'lessons', academicsSection: 'planning', permission: ['ai.generate', 'students.view'], alsoRoles: ['Teacher', 'Principal'], workspaces: school },
      { id: 'academic-allocation', label: 'Allocation & Timetable', view: 'academics', icon: 'timetable', academicsSection: 'allocation', permission: ['settings.configure', 'students.view'], alsoRoles: ['Teacher', 'Principal'], workspaces: school },
      { id: 'academic-resources', label: 'Resources', view: 'academics', icon: 'learning-resources', academicsSection: 'resources', permission: ['library.view', 'students.view'], alsoRoles: ['Teacher'], workspaces: school },
    ],
  },
  {
    id: 'assessment',
    label: 'Assessment',
    icon: 'assessment',
    category: 'learning',
    description: 'Tests, examinations, marking, and published results.',
    workspaces: schoolPersonal,
    items: [
      { id: 'assessments', label: 'Assessment', view: 'assessments', icon: 'assessment', permission: 'assessments.view', alsoRoles: ['Teacher', 'Principal'], workspaces: schoolPersonal },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: 'performance',
    category: 'learning',
    description: 'Progress, trends, at-risk students, and interventions.',
    workspaces: school,
    items: [
      { id: 'student-progress', label: 'Student Progress', view: 'performance', icon: 'student-progress', performanceView: 'students', permission: 'reports.view', alsoRoles: ['Principal', 'Teacher'], workspaces: school },
      { id: 'subject-performance', label: 'Subject Performance', view: 'performance', icon: 'subject-performance', performanceView: 'subjects', permission: 'reports.view', alsoRoles: ['Principal', 'Teacher'], workspaces: school },
      { id: 'class-performance', label: 'Class Performance', view: 'performance', icon: 'class-performance', performanceView: 'classes', permission: 'reports.view', alsoRoles: ['Principal'], workspaces: school },
      { id: 'performance-trends', label: 'Performance Trends', view: 'performance', icon: 'performance-trends', performanceView: 'trends', permission: 'reports.view', alsoRoles: ['Principal'], workspaces: school },
      { id: 'at-risk-students', label: 'At-Risk Students', view: 'performance', icon: 'at-risk-students', performanceView: 'at-risk', permission: 'reports.view', alsoRoles: ['Principal'], workspaces: school },
      { id: 'intervention-tracking', label: 'Intervention Tracking', view: 'module', icon: 'intervention-tracking', moduleKey: 'interventions', permission: 'students.view', alsoRoles: ['Principal', 'Teacher'], workspaces: school },
      { id: 'ai-performance', label: 'AI Performance Insights', view: 'performance', icon: 'ai-performance', performanceView: 'insights', permission: 'reports.view', alsoRoles: ['Principal'], workspaces: school },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: 'attendance',
    category: 'operations',
    description: 'Registers, absences, biometrics, and attendance analytics.',
    workspaces: school,
    items: [
      { id: 'attendance', label: 'Student Attendance', view: 'attendance', icon: 'student-attendance', permission: 'attendance.view', alsoRoles: ['Parent', 'Teacher'], workspaces: school },
      { id: 'staff-attendance', label: 'Staff Attendance', view: 'module', icon: 'staff-attendance', moduleKey: 'staff-attendance', permission: ['attendance.view', 'users.manage'], workspaces: school },
      { id: 'daily-register', label: 'Daily Register', view: 'attendance', icon: 'daily-register', attendanceTab: 'roll-call', permission: 'attendance.view', alsoRoles: ['Teacher'], workspaces: school },
      { id: 'absence-management', label: 'Absence Management', view: 'module', icon: 'absence-management', moduleKey: 'absences', permission: 'attendance.view', workspaces: school },
      { id: 'late-arrivals', label: 'Late Arrivals', view: 'module', icon: 'late-arrivals', moduleKey: 'late-arrivals', permission: 'attendance.view', workspaces: school },
      { id: 'attendance-analytics', label: 'Attendance Analytics', view: 'attendance', icon: 'attendance-analytics', attendanceTab: 'trends', permission: 'attendance.view', alsoRoles: ['Principal'], workspaces: school },
      { id: 'attendance-summary', label: 'Cohort Overview', view: 'attendance', icon: 'attendance-summary', attendanceTab: 'summary', permission: 'attendance.view', alsoRoles: ['Principal'], workspaces: school },
      { id: 'biometrics', label: 'Biometrics', view: 'module', icon: 'biometrics', moduleKey: 'biometrics', permission: 'attendance.create', workspaces: school },
      { id: 'attendance-notifications', label: 'Attendance Notifications', view: 'module', icon: 'attendance-notifications', moduleKey: 'attendance-notifications', permission: 'attendance.create', workspaces: school },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'finance',
    category: 'operations',
    description: 'Fee structure, billing, collections, and reconciliation.',
    workspaces: school,
    items: [
      { id: 'fee-structure', label: 'Fee Structure', view: 'finance', icon: 'fee-structure', financeTab: 'structure', permission: 'finance.view', workspaces: school },
      { id: 'student-billing', label: 'Student Billing', view: 'finance', icon: 'student-billing', financeTab: 'invoices', permission: 'finance.view', alsoRoles: ['Parent'], workspaces: school },
      { id: 'invoices', label: 'Invoices', view: 'finance', icon: 'invoices', financeTab: 'invoices', permission: 'finance.view', alsoRoles: ['Parent'], workspaces: school },
      { id: 'payments', label: 'Payments', view: 'finance', icon: 'payments', financeTab: 'settlement', permission: 'finance.view', alsoRoles: ['Parent'], workspaces: school },
      { id: 'outstanding-fees', label: 'Outstanding Fees', view: 'finance', icon: 'outstanding-fees', financeTab: 'invoices', permission: 'finance.view', workspaces: school },
      { id: 'discounts', label: 'Discounts', view: 'module', icon: 'discounts', moduleKey: 'discounts', permission: 'finance.manage', workspaces: school },
      { id: 'scholarships', label: 'Scholarships', view: 'module', icon: 'scholarships', moduleKey: 'scholarships', permission: 'finance.manage', workspaces: school },
      { id: 'payment-plans', label: 'Payment Plans', view: 'module', icon: 'payment-plans', moduleKey: 'payment-plans', permission: 'finance.manage', workspaces: school },
      { id: 'receipts', label: 'Receipts', view: 'finance', icon: 'receipts', financeTab: 'settlement', permission: 'finance.view', alsoRoles: ['Parent'], workspaces: school },
      { id: 'expenses', label: 'Expenses', view: 'module', icon: 'expenses', moduleKey: 'expenses', permission: 'finance.manage', workspaces: school },
      { id: 'financial-reports', label: 'Financial Reports', view: 'reports', icon: 'financial-reports', reportGroup: 'finance', permission: 'reports.view', workspaces: school },
      { id: 'reconciliation', label: 'Reconciliation', view: 'module', icon: 'reconciliation', moduleKey: 'reconciliation', permission: 'finance.manage', workspaces: school },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: 'communication',
    category: 'engagement',
    description: 'Announcements, inbox, and outbound campaigns.',
    workspaces: school,
    items: [
      { id: 'announcements', label: 'Announcements', view: 'broadcasts', icon: 'announcements', permission: 'students.view', alsoRoles: ['Parent', 'Teacher', 'Student', 'Principal'], workspaces: school },
      { id: 'notices', label: 'Notices', view: 'broadcasts', icon: 'notices', permission: 'students.view', alsoRoles: ['Parent', 'Teacher', 'Principal'], workspaces: school },
      { id: 'parent-messages', label: 'Parent Messages', view: 'messages', icon: 'parent-messages', messageAudience: 'parent', permission: 'communication.send', alsoRoles: ['Parent'], workspaces: school },
      { id: 'teacher-messages', label: 'Teacher Messages', view: 'messages', icon: 'teacher-messages', messageAudience: 'teacher', permission: 'communication.send', alsoRoles: ['Teacher'], workspaces: school },
      { id: 'student-messages', label: 'Student Messages', view: 'messages', icon: 'student-messages', messageAudience: 'student', permission: 'communication.send', alsoRoles: ['Student'], workspaces: school },
      { id: 'email', label: 'Email', view: 'module', icon: 'email', moduleKey: 'email-campaigns', permission: 'communication.send', workspaces: school },
      { id: 'sms', label: 'SMS', view: 'module', icon: 'sms', moduleKey: 'sms-campaigns', permission: 'communication.send', workspaces: school },
      { id: 'push-notifications', label: 'Push Notifications', view: 'module', icon: 'push-notifications', moduleKey: 'push-campaigns', permission: 'communication.send', workspaces: school },
      { id: 'broadcasts', label: 'Broadcasts', view: 'broadcasts', icon: 'broadcasts', permission: 'students.view', alsoRoles: ['Parent', 'Principal'], workspaces: school },
    ],
  },
  {
    id: 'online-learning',
    label: 'Online Learning',
    icon: 'online-learning',
    category: 'learning',
    description: 'Virtual classes, materials, and online assessments.',
    workspaces: schoolPersonal,
    items: [
      { id: 'virtual-classes', label: 'Virtual Classes', view: 'module', icon: 'virtual-classes', moduleKey: 'virtual-classes', permission: 'learning.manage', alsoRoles: ['Teacher', 'Student'], workspaces: schoolPersonal },
      { id: 'live-lessons', label: 'Live Lessons', view: 'module', icon: 'live-lessons', moduleKey: 'live-lessons', permission: 'learning.manage', alsoRoles: ['Teacher', 'Student'], workspaces: schoolPersonal },
      { id: 'recorded-lessons', label: 'Recorded Lessons', view: 'module', icon: 'recorded-lessons', moduleKey: 'recorded-lessons', permission: 'library.view', alsoRoles: ['Teacher', 'Student', 'Parent'], workspaces: schoolPersonal },
      { id: 'online-materials', label: 'Learning Materials', view: 'library', icon: 'online-materials', permission: 'library.view', workspaces: schoolPersonal },
      { id: 'assignments', label: 'Assignments', view: 'module', icon: 'assignments', moduleKey: 'assignments', permission: 'learning.manage', alsoRoles: ['Teacher', 'Student'], workspaces: schoolPersonal },
      { id: 'discussions', label: 'Discussions', view: 'module', icon: 'discussions', moduleKey: 'discussions', permission: 'learning.manage', alsoRoles: ['Teacher', 'Student'], workspaces: schoolPersonal },
      { id: 'cbt', label: 'Online Assessments', view: 'cbt', icon: 'cbt', permission: 'assessment.cbt.attempt', alsoRoles: ['Student'], workspaces: schoolPersonal },
    ],
  },
  {
    id: 'student-services',
    label: 'Student Services',
    icon: 'student-services',
    category: 'operations',
    description: 'Behaviour, welfare, library, and transport.',
    workspaces: school,
    items: [
      { id: 'behaviour', label: 'Behaviour', view: 'module', icon: 'behaviour', moduleKey: 'behaviour', permission: 'services.manage', alsoRoles: ['Principal', 'Teacher'], workspaces: school },
      { id: 'discipline', label: 'Discipline', view: 'module', icon: 'discipline', moduleKey: 'discipline', permission: 'services.manage', alsoRoles: ['Principal'], workspaces: school },
      { id: 'welfare', label: 'Welfare', view: 'module', icon: 'welfare', moduleKey: 'welfare', permission: 'services.manage', workspaces: school },
      { id: 'counselling', label: 'Counselling', view: 'module', icon: 'counselling', moduleKey: 'counselling', permission: 'services.manage', workspaces: school },
      { id: 'library', label: 'Library', view: 'library', icon: 'library', permission: 'library.view', workspaces: school },
      { id: 'transport', label: 'Transport', view: 'module', icon: 'transport', moduleKey: 'transport', permission: 'services.manage', alsoRoles: ['Parent'], workspaces: school },
      { id: 'student-support', label: 'Student Support', view: 'module', icon: 'student-support', moduleKey: 'student-support', permission: 'services.manage', workspaces: school },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'operations',
    category: 'operations',
    description: 'Assets, inventory, facilities, and documents.',
    workspaces: school,
    items: [
      { id: 'assets', label: 'Assets', view: 'module', icon: 'assets', moduleKey: 'assets', permission: 'operations.manage', workspaces: school },
      { id: 'inventory', label: 'Inventory', view: 'module', icon: 'inventory', moduleKey: 'inventory', permission: 'operations.manage', workspaces: school },
      { id: 'operations-facilities', label: 'Facilities', view: 'module', icon: 'operations-facilities', moduleKey: 'facilities', permission: 'operations.manage', workspaces: school },
      { id: 'approvals', label: 'Approvals', view: 'module', icon: 'approvals', moduleKey: 'approvals', permission: 'operations.manage', workspaces: school },
      { id: 'documents', label: 'Documents', view: 'module', icon: 'documents', moduleKey: 'documents', permission: 'operations.manage', alsoRoles: ['School Admin'], workspaces: school },
      { id: 'operational-reports', label: 'Operational Reports', view: 'reports', icon: 'operational-reports', reportGroup: 'operations', permission: 'reports.view', workspaces: school },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: 'administration',
    category: 'governance',
    description: 'Roles, security, workflows, and system configuration.',
    workspaces: schoolPlatform,
    items: [
      { id: 'roles-permissions', label: 'Roles & Permissions', view: 'administrators', icon: 'roles-permissions', permission: 'roles.manage', governance: true, workspaces: school },
      { id: 'user-access', label: 'User Access', view: 'accounts', icon: 'user-access', permission: 'users.manage', workspaces: school },
      { id: 'workflow-rules', label: 'Workflow Rules', view: 'module', icon: 'workflow-rules', moduleKey: 'workflows', permission: 'settings.configure', governance: true, workspaces: school },
      { id: 'automation', label: 'Automation', view: 'module', icon: 'automation', moduleKey: 'automation', permission: 'settings.configure', governance: true, workspaces: school },
      { id: 'integrations', label: 'Integrations', view: 'module', icon: 'integrations', moduleKey: 'integrations', permission: 'security.manage', governance: true, workspaces: school },
      { id: 'audit-logs', label: 'Audit Logs', view: 'audit', icon: 'audit-logs', permission: 'audit.view', governance: true, workspaces: school },
      { id: 'security', label: 'Security', view: 'module', icon: 'security', moduleKey: 'security-settings', permission: 'security.manage', governance: true, workspaces: school },
      { id: 'auth-policies', label: 'Authentication Policies', view: 'module', icon: 'auth-policies', moduleKey: 'auth-policies', permission: 'security.manage', governance: true, workspaces: school },
      { id: 'system-configuration', label: 'System Configuration', view: 'module', icon: 'system-configuration', moduleKey: 'system-config', permission: 'settings.configure', governance: true, workspaces: school },
      { id: 'school-settings', label: 'School Settings', view: 'structure', icon: 'school-settings', structureResource: 'profile', permission: 'settings.configure', governance: true, workspaces: school },
      { id: 'schools', label: 'Tenant Schools', view: 'platform', icon: 'schools', roles: ['Platform Owner'], workspaces: ['platform'] },
      { id: 'health', label: 'System Health', view: 'platform', icon: 'health', roles: ['Platform Owner'], workspaces: ['platform'] },
      { id: 'governance', label: 'Security & Audit', view: 'platform', icon: 'governance', roles: ['Platform Owner'], workspaces: ['platform'] },
    ],
  },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: 'subscription',
    category: 'governance',
    description: 'Plan, usage, billing, and feature entitlements.',
    workspaces: schoolPersonal,
    items: [
      { id: 'current-plan', label: 'Current Plan', view: 'subscription', icon: 'current-plan', alsoRoles: ['Super Admin', 'School Admin', 'Bursar', 'Teacher', 'Parent', 'Student'], workspaces: schoolPersonal },
      { id: 'usage', label: 'Usage', view: 'subscription', icon: 'usage', alsoRoles: ['Super Admin', 'Bursar'], workspaces: school },
      { id: 'billing', label: 'Billing', view: 'subscription', icon: 'billing', alsoRoles: ['Super Admin', 'Bursar'], workspaces: school },
      { id: 'subscription-invoices', label: 'Invoices', view: 'subscription', icon: 'subscription-invoices', alsoRoles: ['Super Admin', 'Bursar'], workspaces: school },
      { id: 'entitlements', label: 'Feature Entitlements', view: 'subscription', icon: 'entitlements', alsoRoles: ['Super Admin'], workspaces: school },
      { id: 'upgrade', label: 'Upgrade', view: 'subscription', icon: 'upgrade', alsoRoles: ['Super Admin', 'Bursar', 'Teacher', 'Parent', 'Student'], workspaces: schoolPersonal },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'reports',
    category: 'governance',
    description: 'Academic, operations, and export-ready reports.',
    workspaces: school,
    items: [
      { id: 'academic-reports', label: 'Academic Reports', view: 'reports', icon: 'academic-reports', reportGroup: 'academic', permission: 'reports.view', alsoRoles: ['Principal'], workspaces: school },
      { id: 'attendance-reports', label: 'Attendance Reports', view: 'reports', icon: 'attendance-reports', reportGroup: 'attendance', permission: 'reports.view', alsoRoles: ['Principal'], workspaces: school },
      { id: 'student-reports', label: 'Student Reports', view: 'reports', icon: 'student-reports', reportGroup: 'student', permission: 'reports.view', workspaces: school },
      { id: 'staff-reports', label: 'Staff Reports', view: 'reports', icon: 'staff-reports', reportGroup: 'staff', permission: 'reports.view', workspaces: school },
      { id: 'finance-reports', label: 'Finance Reports', view: 'reports', icon: 'finance-reports', reportGroup: 'finance', permission: 'reports.view', workspaces: school },
      { id: 'admission-reports', label: 'Admission Reports', view: 'reports', icon: 'admission-reports', reportGroup: 'admissions', permission: 'reports.view', workspaces: school },
      { id: 'performance-reports', label: 'Performance Reports', view: 'reports', icon: 'performance-reports', reportGroup: 'academic', permission: 'reports.view', alsoRoles: ['Principal'], workspaces: school },
      { id: 'custom-reports', label: 'Custom Reports', view: 'reports', icon: 'custom-reports', reportGroup: 'custom', permission: 'reports.export', workspaces: school },
      { id: 'export-centre', label: 'Export Centre', view: 'reports', icon: 'export-centre', reportGroup: 'export', permission: 'reports.export', workspaces: school },
    ],
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: 'help',
    category: 'support',
    description: 'Guides and tickets for this workspace.',
    workspaces: allSpaces,
    items: [{ id: 'help-support', label: 'Help & Support', view: 'help', icon: 'help-support', workspaces: allSpaces }],
  },
];

export interface NavContext {
  role: UserRole;
  permissions: string[];
  workspace: NavWorkspace;
}

const NAV_ALIASES: Record<string, string> = {
  'teacher-ai': 'lessons',
  'continuous-assessment': 'assessments',
  tests: 'assessments',
  examinations: 'assessments',
  'question-bank': 'assessments',
  'exam-scheduling': 'assessments',
  'marks-entry': 'assessments',
  'manual-assessment': 'assessments',
  smartmark: 'assessments',
  'grade-configuration': 'assessments',
  results: 'assessments',
  'report-cards': 'assessments',
  'result-approval': 'assessments',
  'result-publishing': 'assessments',
  'result-pins': 'assessments',
  staff: 'people',
  finance: 'student-billing',
};

export function workspaceKind(type: WorkspaceItem['type']): NavWorkspace {
  if (type === 'platform') return 'platform';
  if (type === 'personal') return 'personal';
  return 'school';
}

function hasPermission(item: NavItem, permissions: string[]): boolean {
  if (!item.permission) return true;
  const required = Array.isArray(item.permission) ? item.permission : [item.permission];
  return required.some((name) => permissions.includes(name));
}

export function canSeeNavItem(item: NavItem, ctx: NavContext): boolean {
  if (!item.workspaces.includes(ctx.workspace)) return false;
  if (item.roles && !item.roles.includes(ctx.role)) return false;
  if (item.excludeRoles?.includes(ctx.role)) return false;
  if (item.governance && ctx.role !== 'Super Admin' && ctx.role !== 'Platform Owner') return false;
  if (ctx.role === 'Super Admin' && ctx.workspace === 'school') return true;
  if (ctx.role === 'Platform Owner' && ctx.workspace === 'platform') return true;
  if (item.alsoRoles?.includes(ctx.role)) return true;
  return hasPermission(item, ctx.permissions);
}

export function visibleNavGroups(ctx: NavContext): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSeeNavItem(item, ctx)),
  })).filter((group) => group.workspaces.includes(ctx.workspace) && group.items.length > 0);
}

export function findNavItem(id: string): NavItem | undefined {
  const resolved = NAV_ALIASES[id] || id;
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) => entry.id === resolved);
    if (item) return item;
  }
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) => entry.view === id);
    if (item) return item;
  }
  return undefined;
}

export function visibleNavItems(ctx: NavContext) {
  return visibleNavGroups(ctx).flatMap((group) =>
    group.items.map((item) => ({
      id: item.id,
      label: item.label,
      module: group.label,
      category: categoryLabel(group.category),
      icon: item.icon,
      groupId: group.id,
    })),
  );
}

export function findNavGroup(id: string): NavGroup | undefined {
  return NAV_GROUPS.find((group) => group.id === id);
}

export function findNavGroupForTab(id: string): NavGroup | undefined {
  const resolved = NAV_ALIASES[id] || id;
  for (const group of NAV_GROUPS) {
    if (group.items.some((entry) => entry.id === resolved || entry.id === id || entry.view === id)) {
      return group;
    }
  }
  return undefined;
}

export function categoryLabel(id: NavCategoryId): string {
  return NAV_CATEGORIES.find((category) => category.id === id)?.label || id;
}

export function tabMeta(id: string): { title: string; category: string; module: string } {
  const group = findNavGroupForTab(id);
  const item = findNavItem(id);
  if (item && group) {
    return { title: item.label, category: categoryLabel(group.category), module: group.label };
  }
  if (group) return { title: group.label, category: categoryLabel(group.category), module: group.label };
  return { title: 'Workspace', category: 'School', module: 'School' };
}
