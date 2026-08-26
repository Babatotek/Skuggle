export type AppRole =
  | "platform_super_admin"
  | "proprietor"
  | "director"
  | "principal"
  | "head_teacher"
  | "school_admin"
  | "admission_officer"
  | "examination_officer"
  | "bursar"
  | "teacher"
  | "parent"
  | "student";

export interface TenantSummary {
  id: string;
  name: string;
  code: string;
  type?: string;
  status?: string;
  logoUrl?: string;
  /** From individual registration / profile settings (optional). */
  className?: string | null;
}

export interface WorkspaceMembership {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  tenantType: string;
  tenantStatus: string;
  role: string;
  roleLabel: string;
  logoUrl?: string | null;
  current?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  role: AppRole;
  roleLabel: string;
  permissions: string[];
  avatarUrl?: string;
  privileged?: boolean;
  mfaConfirmed?: boolean;
  mfaRequired?: boolean;
  tenant?: TenantSummary;
  memberships?: WorkspaceMembership[];
  context?: {
    campus?: { id: string; name: string };
    session?: { id: string; name: string };
    term?: { id: string; name: string };
  };
}

export interface SessionResponse {
  user: AuthenticatedUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}

export interface StudentGuardianSummary {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
}

export interface StudentSummary {
  id: string;
  admissionNumber: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  className?: string | null;
  classArm?: string | null;
  gender?: string | null;
  status: string;
  photoUrl?: string | null;
  currentAverage?: number | null;
  attendanceRate?: number | null;
  feesStatus?: string | null;
  outstandingFees?: number | null;
  trend?: string | null;
  trendPercent?: number | null;
  dateOfBirth?: string | null;
  stateOfOrigin?: string | null;
  countryCode?: string | null;
  localGovernmentArea?: string | null;
  nationality?: string | null;
  admissionDate?: string | null;
  guardians?: StudentGuardianSummary[];
  customFields?: Record<string, string | number | boolean>;
}

export interface StudentFilters {
  page: number;
  perPage: number;
  search?: string;
  status?: string;
  gender?: string;
  classId?: string;
}
