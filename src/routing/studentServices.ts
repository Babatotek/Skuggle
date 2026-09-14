import type { CanonicalRouteDefinition, RouteAccessMetadata } from './types';

const expose = true as const;
const CAPABILITY_ALIASES: Record<string, string> = {
  'services.manage': 'services.record.manage',
  'library.view': 'library.resource.view',
};

const access = (...capabilities: string[]): RouteAccessMetadata => ({
  authenticated: true,
  capabilities: capabilities.map((capability) => CAPABILITY_ALIASES[capability] ?? capability),
  capabilitiesMode: 'any',
  exposureOnly: expose,
});

export const STUDENT_SERVICE_SECTIONS = [
  {
    id: 'behaviour',
    slug: 'behaviour',
    label: 'Behaviour',
    description: 'Record and review behaviour incidents, points, and follow-up.',
    moduleKey: 'behaviour' as string | null,
    permission: 'services.manage',
    legacyNavIds: ['behaviour'] as string[],
    routeId: 'school.student-services',
    path: '/school/student-services',
  },
  {
    id: 'discipline',
    slug: 'discipline',
    label: 'Discipline',
    description: 'Track disciplinary actions from open cases through resolution.',
    moduleKey: 'discipline',
    permission: 'services.manage',
    legacyNavIds: ['discipline'],
    routeId: 'school.student-services.discipline',
    path: '/school/student-services/discipline',
  },
  {
    id: 'welfare',
    slug: 'welfare',
    label: 'Welfare',
    description: 'Manage student welfare cases, owners, and monitoring status.',
    moduleKey: 'welfare',
    permission: 'services.manage',
    legacyNavIds: ['welfare'],
    routeId: 'school.student-services.welfare',
    path: '/school/student-services/welfare',
  },
  {
    id: 'counselling',
    slug: 'counselling',
    label: 'Counselling',
    description: 'Schedule and complete counselling sessions with session notes.',
    moduleKey: 'counselling',
    permission: 'services.manage',
    legacyNavIds: ['counselling'],
    routeId: 'school.student-services.counselling',
    path: '/school/student-services/counselling',
  },
  {
    id: 'library',
    slug: 'library',
    label: 'Library',
    description: 'Open learning resources and library materials for this school.',
    moduleKey: null,
    permission: 'library.view',
    legacyNavIds: [] as string[],
    routeId: 'school.student-services.library',
    path: '/school/student-services/library',
  },
  {
    id: 'transport',
    slug: 'transport',
    label: 'Transport',
    description: 'Maintain school routes, vehicles, and assigned drivers.',
    moduleKey: 'transport',
    permission: 'services.manage',
    legacyNavIds: ['transport'],
    routeId: 'school.student-services.transport',
    path: '/school/student-services/transport',
  },
  {
    id: 'student-support',
    slug: 'student-support',
    label: 'Student Support',
    description: 'Capture support needs and assign case owners through closure.',
    moduleKey: 'student-support',
    permission: 'services.manage',
    legacyNavIds: ['student-support'],
    routeId: 'school.student-services.student-support',
    path: '/school/student-services/student-support',
  },
] as const;

export type StudentServiceSectionId = (typeof STUDENT_SERVICE_SECTIONS)[number]['id'];

const base = {
  workspace: 'school' as const,
  domain: 'student-services' as const,
  visibility: 'staff' as const,
  classification: 'private' as const,
  pageKey: 'student-services' as const,
};

export const STUDENT_SERVICES_ROUTES: CanonicalRouteDefinition[] = STUDENT_SERVICE_SECTIONS.map((section) => ({
  ...base,
  id: section.routeId,
  capability: `services.${section.id}`,
  path: section.path,
  access: access(section.permission),
  breadcrumb: section.id === 'behaviour'
    ? { label: 'Student services', parentId: 'school.home' }
    : { label: section.label, parentId: 'school.student-services' },
  title: section.label,
  pageContext: { section: section.id },
  moduleKey: section.moduleKey ?? undefined,
  legacyNavIds: section.legacyNavIds,
}));
