import { apiRequest } from "./client";
import type { CustomFieldDefinition } from "../types/customFields";

export type OnboardingStepStatus = "complete" | "incomplete" | "blocked";

export interface OnboardingStep {
  id: string;
  title: string;
  status: OnboardingStepStatus;
  blocker: string | null;
}

export interface OnboardingSnapshot {
  progress: number;
  canLaunch: boolean;
  requiresSetup: boolean;
  launchedAt: string | null;
  tenant: {
    id: string;
    name: string;
    code: string;
    motto?: string | null;
    country?: string | null;
    state?: string | null;
    primaryColour?: string | null;
  };
  steps: OnboardingStep[];
}

export interface CampusRecord {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface PaginatedCampuses {
  data: CampusRecord[];
  meta: { total: number };
}

export interface TermRecord {
  id: string;
  name: string;
  sequence: number;
  startsAt: string;
  endsAt: string;
  isCurrent: boolean;
}

export interface AcademicSessionRecord {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isCurrent: boolean;
  status: string;
  terms: TermRecord[];
}

export interface ClassRecord {
  id: string;
  name: string;
  arm: string | null;
  educationalLevel: string | null;
  status: string;
}

export interface SubjectRecord {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface EmployeeRecord {
  id: string;
  employeeNumber: string;
  name: string;
  employmentType: string;
  status: string;
}

export const onboardingService = {
  getProgress: () => apiRequest<OnboardingSnapshot>("/onboarding"),

  updateSchoolProfile: (body: {
    name: string;
    motto?: string;
    country?: string;
    state?: string;
  }) =>
    apiRequest<{ message: string }>("/onboarding/steps/school_profile", {
      method: "PATCH",
      body,
    }),

  updateAssessmentStructure: (body: {
    ca1Weight: number;
    ca2Weight: number;
    examWeight: number;
  }) =>
    apiRequest<{ message: string }>(
      "/onboarding/steps/assessment_structure",
      { method: "PATCH", body },
    ),

  updateFees: (body: {
    feeHeads: Array<{ name: string; amount: number }>;
  }) =>
    apiRequest<{ message: string }>("/onboarding/steps/fees", {
      method: "PATCH",
      body,
    }),

  launch: () =>
    apiRequest<{ message: string; launchedAt: string }>(
      "/onboarding/steps/launch",
      { method: "PATCH", body: {} },
    ),

  listCampuses: () =>
    apiRequest<PaginatedCampuses>("/campuses?perPage=100"),

  createCampus: (body: { name: string; code: string }) =>
    apiRequest<CampusRecord>("/campuses", { method: "POST", body }),

  listSessions: () =>
    apiRequest<{ data: AcademicSessionRecord[] }>(
      "/academic-sessions?perPage=100",
    ),

  createSession: (body: {
    name: string;
    startsAt: string;
    endsAt: string;
    isCurrent?: boolean;
    terms: Array<{
      name: string;
      sequence: number;
      startsAt: string;
      endsAt: string;
      isCurrent?: boolean;
    }>;
  }) =>
    apiRequest<AcademicSessionRecord>("/academic-sessions", {
      method: "POST",
      body,
    }),

  listClasses: () =>
    apiRequest<{ data: ClassRecord[]; meta: { total: number } }>(
      "/classes?perPage=100",
    ),

  createClass: (body: {
    name: string;
    arm?: string;
    educational_level?: string;
    campus_id?: string;
  }) => apiRequest<ClassRecord>("/classes", { method: "POST", body }),

  listSubjects: () =>
    apiRequest<{ data: SubjectRecord[]; meta: { total: number } }>(
      "/subjects?perPage=100",
    ),

  createSubject: (body: { name: string; code: string }) =>
    apiRequest<SubjectRecord>("/subjects", { method: "POST", body }),

  studentLookups: () =>
    apiRequest<{
      classes: Array<{ id: string; name: string }>;
      academicSessions: Array<{ id: string; name: string }>;
      customFields: CustomFieldDefinition[];
    }>("/lookups/student-registration"),

  createStudent: (formData: FormData) =>
    apiRequest<{ id: string; admissionNumber: string; fullName: string }>(
      "/students",
      { method: "POST", body: formData },
    ),

  createEmployee: (body: {
    employee_number: string;
    name: string;
    employment_type: string;
    countryCode?: string;
    stateRegion?: string;
    localGovernmentArea?: string;
    customFields?: Record<string, string | number | boolean>;
  }) => apiRequest<EmployeeRecord>("/employees", { method: "POST", body }),
};
