import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, type SyntheticEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { authService } from "./authService";
import { getApiError } from "@/shared/api/client";
import { shouldRedirectToSetup } from "@/features/onboarding/setupRedirect";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { appConfig } from "@/app/config";

const robotImage = "/skuggle-ai-login.png";

const safeReturnPath = (candidate: string | null): string =>
  candidate &&
  candidate.startsWith("/") &&
  !candidate.startsWith("//") &&
  !candidate.startsWith("/login")
    ? candidate
    : "/app";

export default function LoginPage() {
  usePageTitle("Sign in");
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mfaStep, setMfaStep] = useState(searchParams.get("mfa") === "1");
  const [mfaCode, setMfaCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    if (!oauth) return;
    const messages: Record<string, string> = {
      denied: "Google sign-in was cancelled.",
      invalid_state: "Google sign-in expired. Try again.",
      missing_code: "Google did not return an authorization code.",
      token_failed: "Google token exchange failed. Check OAuth credentials.",
      profile_incomplete: "Google did not return a usable email profile.",
      account_inactive: "This account is inactive.",
      no_workspace: "No active workspace is available for this Google account.",
      suspended: "Google sign-in is temporarily unavailable. Use email and password.",
    };
    setError(messages[oauth] ?? "Google sign-in failed.");
  }, [searchParams]);

  if (auth.status === "loading") {
    return (
      <main className="app-container grid min-h-[50vh] place-items-center py-16">
        <p className="text-sm font-semibold text-slate-500">
          Checking your session…
        </p>
      </main>
    );
  }

  if (auth.status === "authenticated" && !mfaStep) {
    if (auth.user?.emailVerified === false) {
      return (
        <main className="app-container flex min-h-[calc(100dvh-72px)] items-center justify-center py-12">
          <div className="surface-card max-w-lg p-8 text-center sm:p-10">
            <ShieldCheck className="mx-auto size-10 text-brand-600" />
            <h1 className="mt-4 text-2xl font-black text-brand-900">
              Verify your email to continue
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You are signed in as{" "}
              <strong className="text-slate-800">{auth.user.email}</strong>, but
              this address is not verified yet.
            </p>
            {(error || submitting) && (
              <p
                className={`mt-4 text-sm ${error ? "text-rose-700" : "text-slate-500"}`}
                role="status"
              >
                {error ?? "Signing out…"}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/verify-email"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white"
              >
                Continue verification
              </Link>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setSubmitting(true);
                  setError(null);
                  void auth
                    .logout()
                    .catch((caught: unknown) => {
                      setError(getApiError(caught).message);
                    })
                    .finally(() => {
                      setSubmitting(false);
                    });
                }}
                className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-700 disabled:opacity-60"
              >
                Use a different account
              </button>
            </div>
          </div>
        </main>
      );
    }
    return (
      <Navigate to={safeReturnPath(searchParams.get("returnTo"))} replace />
    );
  }

  const afterAuth = async (): Promise<void> => {
    const returnTo = safeReturnPath(searchParams.get("returnTo"));
    const needsSetup = await shouldRedirectToSetup();
    void navigate(needsSetup ? "/app/setup" : returnTo, { replace: true });
  };

  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await auth.login({ email: email.trim(), password, remember });
      if (user.emailVerified === false) {
        void navigate("/verify-email", { replace: true });
        return;
      }
      await afterAuth();
    } catch (caught: unknown) {
      const apiError = getApiError(caught);
      if (apiError.code === "MFA_CHALLENGE_REQUIRED" || apiError.status === 409) {
        setMfaStep(true);
        setError(null);
        return;
      }
      setError(
        apiError.kind === "unauthorized"
          ? "The email or password is incorrect."
          : apiError.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitMfa = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await auth.completeMfaChallenge(
        useRecovery
          ? { recovery_code: mfaCode.trim() }
          : { code: mfaCode.trim() },
      );
      if (user.emailVerified === false) {
        void navigate("/verify-email", { replace: true });
        return;
      }
      setMfaStep(false);
      await afterAuth();
    } catch (caught: unknown) {
      setError(getApiError(caught).message);
    } finally {
      setSubmitting(false);
    }
  };

  const startGoogle = async (): Promise<void> => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await authService.googleRedirectUrl({
        intent: "login",
        returnTo: safeReturnPath(searchParams.get("returnTo")),
      });
      window.location.assign(result.url);
    } catch (caught: unknown) {
      setError(getApiError(caught).message);
      setSubmitting(false);
    }
  };

  return (
    <section className="app-container grid min-h-[calc(100dvh-72px)] items-center gap-8 py-10 lg:grid-cols-[.9fr_1.1fr]">
      <div className="relative hidden min-h-[42rem] overflow-hidden rounded-[2rem] bg-brand-900 lg:block">
        <img
          src={robotImage}
          alt="Skuggle AI school assistant waving and holding a book"
          width="1024"
          height="1536"
          className="absolute inset-x-0 top-[-4%] bottom-[22%] mx-auto h-auto w-[118%] max-w-none object-contain object-top opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/20 to-transparent" />
        <div className="absolute inset-x-8 bottom-8 text-white">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-300">
            Welcome back
          </p>
          <h1 className="mt-3 max-w-md font-display text-5xl leading-tight">
            Your school day, in one calm place.
          </h1>
          <ul className="mt-6 grid gap-3 text-sm text-brand-100">
            <li className="flex items-center gap-2">
              <Sparkles className="size-4" /> Role-specific workspaces
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4" /> Tenant- and permission-aware
              access
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600">
          Secure account access
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-brand-900 sm:text-4xl">
          {mfaStep ? "Enter authentication code" : "Sign in to your account"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {mfaStep
            ? "Open your authenticator app and enter the 6-digit code to finish signing in."
            : "Enter the email and password for your Skuggle account."}
        </p>
        {searchParams.get("expired") === "1" && (
          <div
            className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            role="status"
          >
            <strong>Your session has expired.</strong> Please sign in again.
          </div>
        )}
        {error && (
          <div
            className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            role="alert"
          >
            {error}
          </div>
        )}

        {mfaStep ? (
          <form onSubmit={(e) => void submitMfa(e)} className="mt-7 space-y-5" noValidate>
            <label className="block text-sm font-bold text-slate-800">
              {useRecovery ? "Recovery code" : "6-digit code"}
              <input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                inputMode={useRecovery ? "text" : "numeric"}
                autoComplete="one-time-code"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm tracking-widest"
                placeholder={useRecovery ? "xxxx-xxxx" : "123456"}
                required
              />
            </label>
            <button
              type="button"
              className="text-xs font-bold text-brand-700 hover:underline"
              onClick={() => {
                setUseRecovery((v) => !v);
                setMfaCode("");
              }}
            >
              {useRecovery ? "Use authenticator code instead" : "Use a recovery code"}
            </button>
            <button
              type="submit"
              disabled={submitting || mfaCode.trim().length < 6}
              className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {submitting ? "Verifying…" : "Verify and continue"}
            </button>
            <button
              type="button"
              className="w-full text-center text-xs font-bold text-slate-500 hover:underline"
              onClick={() => {
                setMfaStep(false);
                setMfaCode("");
              }}
            >
              Back to password sign-in
            </button>
          </form>
        ) : (
          <>
            {appConfig.enableGoogleOAuth && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void startGoogle()}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                >
                  <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z" />
                  </svg>
                  Continue with Google
                </button>
                <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" /> or{" "}
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              </>
            )}
            <form
              onSubmit={(event) => {
                void submit(event);
              }}
              className={appConfig.enableGoogleOAuth ? "space-y-5" : "mt-7 space-y-5"}
              noValidate
            >
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-800">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
                    placeholder="you@school.edu.ng"
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-bold text-slate-800">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-bold text-brand-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="tap-target absolute right-0 top-0 grid place-items-center text-slate-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="size-4 rounded border-slate-300 accent-brand-600"
                />{" "}
                Keep me signed in on this device
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Sign in"}{" "}
                {!submitting && <ArrowRight className="size-4" />}
              </button>
            </form>
          </>
        )}
        <p className="mt-6 text-center text-sm text-slate-600">
          New to Skuggle?{" "}
          <Link to="/join" className="font-extrabold text-brand-700 hover:underline">
            Create a free personal account
          </Link>
        </p>
      </div>
    </section>
  );
}
