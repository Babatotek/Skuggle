import { ArrowRight, CheckCircle2, MailWarning, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { authService } from "./authService";
import { appConfig } from "@/app/config";
import { getApiError } from "@/shared/api/client";
import { usePageTitle } from "@/shared/hooks/usePageTitle";

export default function VerifyEmailPage() {
  usePageTitle("Verify email");
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const goToSignIn = async (): Promise<void> => {
    setSigningOut(true);
    setError(null);
    try {
      // LoginPage redirects authenticated-but-unverified users back here.
      // End the session first so /login can actually render.
      if (auth.status === "authenticated") {
        await auth.logout();
      }
      void navigate("/login", { replace: true });
    } catch (caught: unknown) {
      setError(getApiError(caught).message);
      setSigningOut(false);
    }
  };

  const resend = async (): Promise<void> => {
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      if (!appConfig.liveApi) {
        setMessage("Email verification is available when the live API is enabled.");
        return;
      }
      const result = await authService.resendVerification();
      setMessage(
        result.alreadyVerified
          ? "Your email is already verified. You can sign in."
          : result.message || "A new verification link has been sent.",
      );
      if (result.alreadyVerified) {
        await auth.refresh();
      }
    } catch (caught: unknown) {
      setError(getApiError(caught).message);
    } finally {
      setSending(false);
    }
  };

  if (status === "success") {
    return (
      <section className="app-container flex min-h-[calc(100dvh-72px)] items-center justify-center py-12">
        <div className="surface-card max-w-xl p-8 text-center sm:p-12">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
          <h1 className="mt-5 text-3xl font-black text-brand-900">
            Email verified
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your address is confirmed. Sign in to continue school setup and
            enrollment.
          </p>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => {
              void goToSignIn();
            }}
            className="tap-target mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Continue to sign in"}{" "}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    );
  }

  if (status === "invalid") {
    return (
      <section className="app-container flex min-h-[calc(100dvh-72px)] items-center justify-center py-12">
        <div className="surface-card max-w-xl p-8 text-center sm:p-12">
          <MailWarning className="mx-auto size-12 text-amber-600" />
          <h1 className="mt-5 text-3xl font-black text-brand-900">
            Link expired or invalid
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Request a fresh verification email after signing in, then try again.
          </p>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => {
              void goToSignIn();
            }}
            className="tap-target mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign in to resend"}{" "}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    );
  }

  const email = auth.user?.email;
  const alreadyVerified = auth.user?.emailVerified === true;

  return (
    <section className="app-container flex min-h-[calc(100dvh-72px)] items-center justify-center py-12">
      <div className="surface-card max-w-xl p-8 text-center sm:p-12">
        <MailWarning className="mx-auto size-12 text-brand-600" />
        <h1 className="mt-5 text-3xl font-black text-brand-900">
          {alreadyVerified ? "Email already verified" : "Verify your email"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {alreadyVerified
            ? "You are ready to use Skuggle."
            : email
              ? `We sent a verification link to ${email}. Open that email, then return here to continue.`
              : "Check your inbox for a verification link. Sign in first if you need to resend it."}
        </p>
        {(message || error) && (
          <div
            className={`mt-5 rounded-2xl p-3 text-sm ${error ? "border border-rose-200 bg-rose-50 text-rose-800" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}
            role="status"
          >
            {message ?? error}
          </div>
        )}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {alreadyVerified ? (
            <Link
              to="/app"
              className="tap-target inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white"
            >
              Open workspace <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              {auth.status === "authenticated" && (
                <button
                  type="button"
                  disabled={sending || signingOut}
                  onClick={() => {
                    void resend();
                  }}
                  className="tap-target inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  <RefreshCw className={`size-4 ${sending ? "animate-spin" : ""}`} />
                  {sending ? "Sending…" : "Resend verification email"}
                </button>
              )}
              <button
                type="button"
                disabled={signingOut}
                onClick={() => {
                  void goToSignIn();
                }}
                className="tap-target inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-700 disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Back to sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
