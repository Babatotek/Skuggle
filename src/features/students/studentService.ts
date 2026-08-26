import type { PaginatedResponse, StudentFilters, StudentSummary } from "../../app/types";
import { apiRequest } from "../../shared/api/client";
import type { CustomFieldDefinition } from "../../shared/types/customFields";
import type { StudentRecord } from "../../types";

const filtersToSearch = (filters: StudentFilters): string => {
  const params = new URLSearchParams({
    page: String(filters.page),
    perPage: String(filters.perPage),
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (
      key === "page" ||
      key === "perPage" ||
      value === undefined ||
      value === ""
    ) {
      return;
    }
    params.set(key, String(value));
  });
  return params.toString();
};

export interface StudentRegistrationLookups {
  classes: Array<{ id: string; name: string }>;
  academicSessions: Array<{ id: string; name: string; selected?: boolean }>;
  customFields: CustomFieldDefinition[];
}

export const studentService = {
  list: (filters: StudentFilters, signal?: AbortSignal) =>
    apiRequest<PaginatedResponse<StudentSummary>>(
      `/students?${filtersToSearch(filters)}`,
      signal ? { signal } : {},
    ),

  lookups: (signal?: AbortSignal) =>
    apiRequest<StudentRegistrationLookups>(
      "/lookups/student-registration",
      signal ? { signal } : {},
    ),

  create: (formData: FormData) =>
    apiRequest<StudentSummary>("/students", {
      method: "POST",
      body: formData,
    }),
};

export function mapStudentSummaryToRecord(summary: StudentSummary): StudentRecord {
  const guardian = summary.guardians?.[0];
  const genderRaw = summary.gender ?? "Male";
  const gender =
    genderRaw.toLowerCase() === "female" ? "Female" : ("Male" as const);
  const statusLabel: StudentRecord["status"] =
    summary.status?.toLowerCase() === "active" ? "Active" : "Transferred";

  return {
    id: summary.id,
    admissionNo: summary.admissionNumber,
    name: summary.fullName,
    firstName: summary.firstName ?? summary.fullName.split(" ")[0] ?? "",
    lastName:
      summary.lastName ??
      summary.fullName.split(" ").slice(1).join(" ") ??
      "",
    photo:
      summary.photoUrl ??
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    class: summary.className ?? "",
    classArm: summary.classArm ?? summary.className ?? "",
    gender,
    status: statusLabel,
    dob: summary.dateOfBirth ?? "",
    stateOfOrigin: summary.stateOfOrigin ?? "",
    localGovernmentArea: summary.localGovernmentArea ?? "",
    countryCode: summary.countryCode ?? "",
    nationality: summary.nationality ?? "Nigerian",
    admissionDate: summary.admissionDate ?? "",
    guardianName: guardian?.name ?? "Guardian",
    guardianPhone: guardian?.phone ?? "",
    guardianEmail: guardian?.email ?? "",
    guardianRelationship: guardian?.relationship ?? "Guardian",
    currentAverage: Number(summary.currentAverage ?? 0),
    attendanceRate: Number(summary.attendanceRate ?? 0),
    feesStatus: (summary.feesStatus as StudentRecord["feesStatus"]) ?? "Paid",
    outstandingFees: Number(summary.outstandingFees ?? 0),
    trend: (summary.trend as StudentRecord["trend"]) ?? "steady",
    trendPercent: Number(summary.trendPercent ?? 0),
  };
}
