import { onboardingService } from "@/shared/api/onboarding";

export async function shouldRedirectToSetup(): Promise<boolean> {
  try {
    const snapshot = await onboardingService.getProgress();
    return snapshot.requiresSetup;
  } catch {
    return false;
  }
}
