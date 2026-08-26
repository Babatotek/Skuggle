import type { UserRole } from "../../types";
import type { AppRole } from "../../app/types";
import { appConfig } from "@/app/config";

const ROLE_MAP: Record<string, UserRole> = {
  platform_super_admin: "super_admin",
  school_admin: "school_admin",
  teacher: "teacher",
  principal: "principal",
  parent: "parent",
  student: "student",
  bursar: "bursar",
  examination_officer: "examination_officer",
  head_teacher: "principal",
  proprietor: "super_admin",
  director: "principal",
};

export function mapBackendRoleToUi(role: AppRole | string): UserRole {
  return ROLE_MAP[role] ?? "school_admin";
}

/**
 * Seeded local credentials — only available when demo mode is enabled.
 * Production builds must never ship these values.
 */
export const DEMO_LOGIN_BY_ROLE: Partial<
  Record<Exclude<UserRole, "landing">, { email: string; password: string }>
> = appConfig.enableDemo
  ? {
      school_admin: {
        email: "admin@royalgateway.edu.ng",
        password: "SkuggleDemo!2026",
      },
      teacher: {
        email: "adewale.o@royalgateway.edu.ng",
        password: "SkuggleDemo!2026",
      },
      principal: {
        email: "principal@royalgateway.edu.ng",
        password: "SkuggleDemo!2026",
      },
      parent: {
        email: "bello.folashade@gmail.com",
        password: "SkuggleDemo!2026",
      },
      student: {
        email: "nathan.bello@student.royalgateway.edu.ng",
        password: "SkuggleDemo!2026",
      },
      super_admin: {
        email: "owner@skuggle.com",
        password: "SkuggleOwner!2026",
      },
    }
  : {};
