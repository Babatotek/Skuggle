import type { UserRole } from "@/types";

/** Destination home tab after a workspace switch or session tenant change. */
export function workspaceHomeTab(
  role: UserRole,
  tenantType?: string | null,
): string {
  if (tenantType === "individual") {
    return "home";
  }
  if (role === "super_admin" || role === "principal") {
    return "overview";
  }
  if (
    role === "bursar" ||
    role === "examination_officer" ||
    role === "teacher" ||
    role === "parent" ||
    role === "student"
  ) {
    return "home";
  }
  return "dashboard";
}
