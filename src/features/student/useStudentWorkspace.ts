import { useMemo } from "react";
import { appConfig } from "@/app/config";
import { useAuth } from "@/features/auth/AuthProvider";

export interface StudentWorkspace {
  /** When true, UI must not show Royal Gateway / Nathan demo content. */
  isLive: boolean;
  isPersonal: boolean;
  isSchool: boolean;
  displayName: string;
  firstName: string;
  schoolLabel: string;
  classLabel: string | null;
  contextLine: string;
  greeting: string;
  avatarUrl?: string;
  userId: string;
}

const demoWorkspace: StudentWorkspace = {
  isLive: false,
  isPersonal: false,
  isSchool: true,
  displayName: "Nathan Bello",
  firstName: "Nathan",
  schoolLabel: "Royal Gateway Academy",
  classLabel: "JSS 2A",
  contextLine: "JSS 2A • Royal Gateway Academy",
  greeting: "Good afternoon",
  userId: "std-nathan",
};

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstNameFrom(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || name || "Student";
}

/**
 * Resolves the logged-in student identity for UI.
 * In live API mode, never fall back to the Royal Gateway demo student.
 */
export function useStudentWorkspace(): StudentWorkspace {
  const auth = useAuth();

  return useMemo(() => {
    if (!appConfig.liveApi || !auth.user) {
      return { ...demoWorkspace, greeting: timeGreeting() };
    }

    const user = auth.user;
    const tenantType = user.tenant?.type ?? "school";
    const isPersonal = tenantType === "individual";
    const displayName = user.name?.trim() || "Student";
    const classLabel = user.tenant?.className?.trim() || null;
    const schoolLabel = isPersonal
      ? "Personal Learning Space"
      : user.tenant?.name?.trim() || "Your school";

    const contextParts = [
      classLabel,
      isPersonal ? "Personal Learning Space" : schoolLabel,
    ].filter(Boolean);

    return {
      isLive: true,
      isPersonal,
      isSchool: !isPersonal,
      displayName,
      firstName: firstNameFrom(displayName),
      schoolLabel,
      classLabel,
      contextLine: contextParts.join(" • "),
      greeting: timeGreeting(),
      avatarUrl: user.avatarUrl,
      userId: user.id,
    };
  }, [auth.user]);
}
