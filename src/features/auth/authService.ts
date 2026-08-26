import type { AuthenticatedUser, SessionResponse } from "../../app/types";
import { apiRequest } from "../../shared/api/client";

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
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

export const authService = {
  session: (signal?: AbortSignal) =>
    apiRequest<SessionResponse>("/auth/me", signal ? { signal } : {}),
  login: (input: LoginInput) =>
    apiRequest<SessionResponse>("/auth/login", {
      method: "POST",
      body: {
        email: input.email,
        password: input.password,
        remember: input.remember ?? true,
      },
    }),
  completeMfaChallenge: (input: { code?: string; recovery_code?: string }) =>
    apiRequest<SessionResponse>("/auth/two-factor-challenge", {
      method: "POST",
      body: input,
    }),
  logout: () => apiRequest<null>("/auth/logout", { method: "POST" }),
  resendVerification: () =>
    apiRequest<{ message: string; alreadyVerified?: boolean }>(
      "/auth/email/verification-notification",
      { method: "POST" },
    ),
  memberships: () =>
    apiRequest<{ data: WorkspaceMembership[] }>("/auth/memberships"),
  switchWorkspace: (tenantId: string) =>
    apiRequest<{ user: AuthenticatedUser }>("/auth/switch-workspace", {
      method: "POST",
      body: { tenantId },
    }),
  googleRedirectUrl: (input: {
    intent?: "login" | "signup";
    accountType?: "student" | "parent" | "teacher";
    returnTo?: string;
  } = {}) => {
    const query = new URLSearchParams({ format: "json" });
    if (input.intent) query.set("intent", input.intent);
    if (input.accountType) query.set("accountType", input.accountType);
    if (input.returnTo) query.set("returnTo", input.returnTo);
    return apiRequest<{ url: string }>(`/auth/google/redirect?${query}`);
  },
};
