export const WORKSPACE_KINDS = ['school', 'personal', 'platform', 'public', 'auth', 'relate'] as const;
export type WorkspaceKind = (typeof WORKSPACE_KINDS)[number];

export const ROUTE_CLASSIFICATIONS = ['public', 'private'] as const;
export type RouteClassification = (typeof ROUTE_CLASSIFICATIONS)[number];

export const VISIBILITY_CLASSES = ['public', 'authenticated', 'staff', 'parent', 'student', 'platform', 'personal', 'placeholder'] as const;
export type VisibilityClass = (typeof VISIBILITY_CLASSES)[number];

export const SCHOOL_DOMAINS = [
  'home',
  'people',
  'admissions',
  'academics',
  'assessment',
  'performance',
  'learning-resources',
  'attendance',
  'finance',
  'student-services',
  'operations',
  'communication',
  'calendar',
  'insights',
  'administration',
  'help',
] as const;
export type SchoolDomain = (typeof SCHOOL_DOMAINS)[number];

export const PERSONAL_DOMAINS = ['home', 'learning-resources', 'assessment', 'subscription', 'help'] as const;
export const PLATFORM_DOMAINS = ['overview', 'tenants', 'health', 'governance', 'help'] as const;
export const PUBLIC_DOMAINS = ['landing', 'welcome', 'results', 'register'] as const;
export const AUTH_DOMAINS = ['login', 'reset', 'verify', 'join'] as const;
export const RELATE_DOMAINS = ['home'] as const;

export type DomainId = SchoolDomain | (typeof PERSONAL_DOMAINS)[number] | (typeof PLATFORM_DOMAINS)[number] | (typeof PUBLIC_DOMAINS)[number] | (typeof AUTH_DOMAINS)[number] | (typeof RELATE_DOMAINS)[number];

export type PageKey =
  | 'landing'
  | 'register-school'
  | 'tenant-welcome'
  | 'tenant-login'
  | 'personal-auth'
  | 'school-auth'
  | 'reset-password'
  | 'verify-email'
  | 'join'
  | 'result-checker'
  | 'school-home'
  | 'personal-home'
  | 'platform-overview'
  | 'students'
  | 'guardians'
  | 'workforce'
  | 'admissions'
  | 'academics'
  | 'timetable'
  | 'assessment'
  | 'performance'
  | 'results'
  | 'report-cards'
  | 'learning-resources'
  | 'cbt'
  | 'attendance'
  | 'finance'
  | 'module'
  | 'structure'
  | 'broadcasts'
  | 'messages'
  | 'reports'
  | 'administrators'
  | 'accounts'
  | 'forms'
  | 'subscription'
  | 'audit'
  | 'branding'
  | 'help'
  | 'invitations'
  | 'lessons'
  | 'placeholder'
  | 'not-found'
  | 'access-denied';

export type ParamKind = 'publicId' | 'slug' | 'enum' | 'page';
export type QueryKind = 'search' | 'filter' | 'page' | 'sort' | 'view' | 'type';

export interface ParamDefinition {
  name: string;
  kind: ParamKind;
  optional?: boolean;
  enumValues?: readonly string[];
  invalid: '404' | 'default';
  defaultValue?: string;
}

export interface QueryDefinition {
  name: string;
  kind: QueryKind;
  enumValues?: readonly string[];
  invalid: 'drop' | 'default';
  defaultValue?: string;
}

export interface RouteAccessMetadata {
  authenticated: boolean;
  capabilities?: readonly string[];
  capabilitiesMode?: 'any' | 'all';
  feature?: string;
  /** UX exposure only. Backend authorization remains authoritative. */
  exposureOnly: true;
}

export interface BreadcrumbMetadata {
  label: string;
  parentId?: string;
}

export interface CanonicalRouteDefinition {
  id: string;
  workspace: WorkspaceKind;
  domain: DomainId;
  capability: string;
  path: string;
  pageKey: PageKey;
  params?: readonly ParamDefinition[];
  query?: readonly QueryDefinition[];
  access: RouteAccessMetadata;
  breadcrumb: BreadcrumbMetadata;
  legacyNavIds?: readonly string[];
  visibility: VisibilityClass;
  classification: RouteClassification;
  title: string;
  isWorkspaceDefault?: boolean;
  implemented?: boolean;
  pageContext?: Readonly<Record<string, string>>;
  moduleKey?: string;
}

export type GuardReason =
  | 'ok'
  | 'unauthenticated'
  | 'workspace_mismatch'
  | 'workspace_unavailable'
  | 'capability_denied'
  | 'not_implemented'
  | 'unknown_route'
  | 'invalid_param'
  | 'redirect_loop';

export interface GuardDecision {
  reason: GuardReason;
  redirectTo?: string;
  replace?: boolean;
}

export type RoutingSignal =
  | 'legacy_alias_used'
  | 'unknown_route'
  | 'redirect_loop_prevented'
  | 'workspace_route_mismatch'
  | 'canonical_resolution_failure';

export interface LegacyAliasDefinition {
  id: string;
  oldPath: string;
  canonicalId: string;
  mode: 'redirect' | 'rewrite';
  reason: string;
  owner: string;
  removalWave: number;
  preserveQuery?: boolean;
  mapParams?: Readonly<Record<string, string>>;
  pageContext?: Readonly<Record<string, string>>;
}
