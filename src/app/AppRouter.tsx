import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { appConfig } from "@/app/config";
import { useAuth } from "@/features/auth/AuthProvider";
import LoginPage from "@/features/auth/LoginPage";
import IndividualRegistrationPage from "@/features/auth/IndividualRegistrationPage";
import VerifyEmailPage from "@/features/auth/VerifyEmailPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import MfaSetupPage from "@/features/auth/MfaSetupPage";
import LandingPage from "@/features/public/LandingPage";
import RegisterSchoolPage from "@/features/public/RegisterSchoolPage";
import ResultCheckerPage from "@/features/public/ResultCheckerPage";
import {
  ForgotPasswordPage,
  StaticPublicPage,
} from "@/features/public/SimplePublicPage";
import { PublicLayout } from "@/shared/layout/PublicLayout";
import { PageSkeleton } from "@/shared/ui";
import { RouteErrorBoundary } from "@/shared/ui/RouteErrorBoundary";

const WorkspaceApp = lazy(() => import("@/App"));

function RouteFallback() {
  return <PageSkeleton label="Loading…" />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (!appConfig.liveApi) {
    return <>{children}</>;
  }

  if (auth.status === "loading") {
    return <PageSkeleton label="Checking your session…" />;
  }

  if (auth.status !== "authenticated" || !auth.user) {
    return <Navigate to="/login?returnTo=/app" replace />;
  }

  if (auth.user.emailVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  if (auth.user.mfaRequired) {
    return <Navigate to="/security/mfa?returnTo=/app" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="join" element={<IndividualRegistrationPage />} />
          <Route path="register-school" element={<RegisterSchoolPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="security/mfa" element={<MfaSetupPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="result-checker" element={<ResultCheckerPage />} />
          <Route
            path="privacy"
            element={
              <StaticPublicPage title="Privacy">
                {
                  "Skuggle protects student, guardian and school information through tenant-aware access, data minimisation and purpose-limited processing. The school remains responsible for providing applicable privacy notices and managing lawful access.\n\nA complete production privacy notice must be supplied by the product owner and reviewed for compliance with applicable Nigerian data-protection requirements before launch."
                }
              </StaticPublicPage>
            }
          />
          <Route
            path="terms"
            element={
              <StaticPublicPage title="Terms of Service">
                {
                  "The final commercial Terms of Service have not been supplied in this frontend repository. Contractual terms, service levels, data-processing terms and school responsibilities must be approved and published before accepting production registrations."
                }
              </StaticPublicPage>
            }
          />
        </Route>

        <Route
          path="app/*"
          element={
            <RequireAuth>
              <RouteErrorBoundary label="The workspace could not be loaded">
                <WorkspaceApp />
              </RouteErrorBoundary>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
