import type { CanonicalRouteDefinition, PageKey } from './types';

const settings = 'school.settings.update';
const security = 'identity.security.manage';
const users = 'identity.user.manage';
const roles = 'identity.role.manage';
const attendance = 'attendance.student.record';
export const ADMINISTRATION_DOMAINS = [
  { key: 'school-setup', label: 'School Setup', description: 'Profile, campuses, branding and basic configuration.' },
  { key: 'academic-structure', label: 'Academic Structure', description: 'Sessions, terms, classes, arms and subjects.' },
  { key: 'people-access', label: 'People & Access', description: 'Login accounts, access roles, permissions, invitations and policies.' },
  { key: 'forms-records', label: 'Forms & Records', description: 'Reusable forms, custom fields and record configuration.' },
  { key: 'workflow-automation', label: 'Workflow & Automation', description: 'Workflow rules and scheduled automation configuration.' },
  { key: 'communication-setup', label: 'Communication Setup', description: 'Notification triggers, channels and audiences.' },
  { key: 'integrations', label: 'Integrations', description: 'Connected services and external device configuration.' },
  { key: 'governance', label: 'Governance', description: 'Audit logs and security controls.' },
  { key: 'system', label: 'System', description: 'Advanced tenant settings, subscription and plan controls.' },
] as const;

type Domain = typeof ADMINISTRATION_DOMAINS[number]['key'];
type Capability = { id: string; domain: Domain; slug: string; label: string; description: string; permission: string; pageKey: PageKey; resource?: string; moduleKey?: string; legacyNavIds?: string[]; oldPath?: string };
export const ADMINISTRATION_CAPABILITIES: Capability[] = [
  { id: 'profile', domain: 'school-setup', slug: 'profile', label: 'Profile', description: 'School identity and contact information.', permission: settings, pageKey: 'structure', resource: 'profile', legacyNavIds: ['school-settings'] },
  { id: 'campuses', domain: 'school-setup', slug: 'campuses', label: 'Campuses', description: 'School branches and locations.', permission: settings, pageKey: 'structure', resource: 'campuses', legacyNavIds: ['school-organisation'] },
  { id: 'branding', domain: 'school-setup', slug: 'branding', label: 'Branding', description: 'School logo, colours and welcome experience.', permission: settings, pageKey: 'branding', legacyNavIds: ['branding'], oldPath: 'branding' },
  { id: 'localization', domain: 'school-setup', slug: 'localization', label: 'Localization', description: 'Region, currency and timezone.', permission: settings, pageKey: 'structure', resource: 'regional' },
  { id: 'sessions', domain: 'academic-structure', slug: 'sessions', label: 'Sessions & Terms', description: 'Academic years and their term dates.', permission: settings, pageKey: 'structure', resource: 'sessions' },
  { id: 'classes', domain: 'academic-structure', slug: 'classes', label: 'Classes & Arms', description: 'Class names, streams and capacity.', permission: settings, pageKey: 'structure', resource: 'classes' },
  { id: 'subjects', domain: 'academic-structure', slug: 'subjects', label: 'Subjects', description: 'Curriculum subject names and codes.', permission: settings, pageKey: 'structure', resource: 'subjects' },
  { id: 'departments', domain: 'academic-structure', slug: 'departments', label: 'Departments', description: 'Academic departments and their codes.', permission: settings, pageKey: 'structure', resource: 'departments' },
  { id: 'houses', domain: 'academic-structure', slug: 'houses', label: 'Houses', description: 'House configuration and patrons.', permission: settings, pageKey: 'module', moduleKey: 'houses' },
  { id: 'users-access', domain: 'people-access', slug: 'users', label: 'Users', description: 'Manage accounts that can access Skuggle.', permission: users, pageKey: 'accounts', legacyNavIds: ['user-access', 'accounts', 'administrators'], oldPath: 'users-access' },
  { id: 'roles', domain: 'people-access', slug: 'roles', label: 'Roles', description: 'Define authorization roles for the school.', permission: roles, pageKey: 'roles', legacyNavIds: ['roles-permissions'] },
  { id: 'permissions', domain: 'people-access', slug: 'permissions', label: 'Permissions', description: 'Review what each role can access and perform.', permission: roles, pageKey: 'permissions' },
  { id: 'invitations', domain: 'people-access', slug: 'invitations', label: 'Invitations', description: 'Manage pending user invitations.', permission: users, pageKey: 'invitations', legacyNavIds: ['invitations'] },
  { id: 'access-policies', domain: 'people-access', slug: 'access-policies', label: 'Access Policies', description: 'Configure authentication and access controls.', permission: security, pageKey: 'module', moduleKey: 'auth-policies', legacyNavIds: ['auth-policies'] },
  { id: 'forms', domain: 'forms-records', slug: 'forms', label: 'Forms & Custom Fields', description: 'Configure fields, validation and visibility across supported records.', permission: settings, pageKey: 'forms', legacyNavIds: ['school-forms'], oldPath: 'forms' },
  { id: 'workflows', domain: 'workflow-automation', slug: 'workflows', label: 'Workflows', description: 'Record workflow triggers and actions.', permission: settings, pageKey: 'module', moduleKey: 'workflows', legacyNavIds: ['workflow-rules'], oldPath: 'workflows' },
  { id: 'automation', domain: 'workflow-automation', slug: 'automation', label: 'Automation', description: 'Record automation schedules and actions.', permission: settings, pageKey: 'module', moduleKey: 'automation', legacyNavIds: ['automation'] },
  { id: 'notifications', domain: 'communication-setup', slug: 'notifications', label: 'Attendance Notifications', description: 'Configure attendance notification triggers, channels and audiences.', permission: attendance, pageKey: 'module', moduleKey: 'attendance-notifications', legacyNavIds: ['attendance-notifications'] },
  { id: 'connected-services', domain: 'integrations', slug: 'connected-services', label: 'Connected Services', description: 'Service provider metadata and connection status records.', permission: security, pageKey: 'module', moduleKey: 'integrations', legacyNavIds: ['integrations'] },
  { id: 'biometrics', domain: 'integrations', slug: 'biometrics', label: 'Biometric Devices', description: 'Device providers, locations and status.', permission: attendance, pageKey: 'module', moduleKey: 'biometrics', legacyNavIds: ['biometrics'] },
  { id: 'audit', domain: 'governance', slug: 'audit-logs', label: 'Audit Logs', description: 'Review administrative activity for this school.', permission: 'identity.audit.view', pageKey: 'audit', legacyNavIds: ['audit-logs'], oldPath: 'audit' },
  { id: 'security', domain: 'governance', slug: 'security', label: 'Security Controls', description: 'Record tenant security controls and their status.', permission: security, pageKey: 'module', moduleKey: 'security-settings', legacyNavIds: ['security'], oldPath: 'security' },
  { id: 'advanced-settings', domain: 'system', slug: 'advanced-settings', label: 'Advanced Settings', description: 'Tenant system configuration records.', permission: settings, pageKey: 'module', moduleKey: 'system-config', legacyNavIds: ['system-configuration'] },
  { id: 'subscription', domain: 'system', slug: 'subscription', label: 'Subscription & Plan', description: 'Plan, usage, billing and entitlements.', permission: '', pageKey: 'subscription', legacyNavIds: ['current-plan', 'usage', 'billing', 'subscription-invoices', 'entitlements', 'upgrade'], oldPath: 'subscription' },
];

const prefix = '/school/administration';
const access = (permissions: string[]) => ({ authenticated: true, capabilities: permissions.filter(Boolean), capabilitiesMode: 'any' as const, exposureOnly: true as const });
const base = { workspace: 'school' as const, domain: 'administration' as const, visibility: 'staff' as const, classification: 'private' as const };
export const ADMINISTRATION_ROUTES: CanonicalRouteDefinition[] = [
  { ...base, id: 'school.administration', capability: 'administration.overview', path: prefix, pageKey: 'administration', access: access([]), breadcrumb: { label: 'Administration', parentId: 'school.home' }, title: 'Administration', legacyNavIds: ['administration'] },
  ...ADMINISTRATION_DOMAINS.map(domain => ({ ...base, id: `school.administration.${domain.key}`, capability: `administration.${domain.key}`, path: `${prefix}/${domain.key}`, pageKey: 'administration' as const, access: access(domain.key === 'system' ? [] : ADMINISTRATION_CAPABILITIES.filter(c => c.domain === domain.key).map(c => c.permission)), breadcrumb: { label: domain.label, parentId: 'school.administration' }, title: domain.label, pageContext: { adminDomain: domain.key }, legacyNavIds: domain.key === 'school-setup' ? ['school-overview', 'school-settings-hub'] : domain.key === 'academic-structure' ? ['school-academics'] : [] })),
  ...ADMINISTRATION_CAPABILITIES.map(c => ({ ...base, id: `school.administration.${c.id}`, capability: `administration.${c.id}`, path: `${prefix}/${c.domain}/${c.slug}`, pageKey: c.pageKey, access: access(c.permission ? [c.permission] : []), breadcrumb: { label: c.label, parentId: `school.administration.${c.domain}` }, title: c.label, moduleKey: c.moduleKey, pageContext: { adminDomain: c.domain, resource: c.resource ?? '' }, legacyNavIds: c.legacyNavIds })),
];

export const ADMINISTRATION_REDIRECTS = [
  ...ADMINISTRATION_CAPABILITIES.filter(c => c.oldPath).map(c => ({ oldPath: `${prefix}/${c.oldPath}`, canonicalId: `school.administration.${c.id}` })),
  { oldPath: `${prefix}/roles-permissions`, canonicalId: 'school.administration.roles' },
  { oldPath: `${prefix}/governance/policies`, canonicalId: 'school.administration.access-policies' },
  { oldPath: '/school/people/invitations', canonicalId: 'school.administration.invitations' },
];
