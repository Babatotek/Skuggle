import { ArrowRight, KeyRound } from "lucide-react";
import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest, getApiError } from "@/shared/api/client";
import { usePageTitle } from "@/shared/hooks/usePageTitle";

export const ResetPasswordPage = () => {
  usePageTitle("Choose a new password");
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const emailFromLink = useMemo(() => params.get("email") ?? "", [params]);

  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!token) {
      setError("This reset link is missing a token. Request a new one.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: {
          token,
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
        },
      });
      setMessage("Password updated. You can sign in with your new password.");
    } catch (caught: unknown) {
      setError(getApiError(caught).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="app-container flex min-h-[calc(100dvh-72px)] items-center justify-center py-12">
      <div className="surface-card w-full max-w-lg p-7 sm:p-10">
        <KeyRound className="size-9 text-brand-600" />
        <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-900">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Paste the email from your reset link and set a strong password (at least 10 characters).
        </p>
        {(message !== null || error !== null) && (
          <div
            className={`mt-5 rounded-2xl p-3 text-sm ${error ? "border border-rose-200 bg-rose-50 text-rose-800" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}
            role="status"
          >
            {message ?? error}
          </div>
        )}
        {!message && (
          <form
            onSubmit={(event) => {
              void submit(event);
            }}
            className="mt-6 space-y-4"
          >
            <label className="block text-sm font-bold">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal"
              />
            </label>
            <label className="block text-sm font-bold">
              New password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={10}
                autoComplete="new-password"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal"
              />
            </label>
            <label className="block text-sm font-bold">
              Confirm password
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
                minLength={10}
                autoComplete="new-password"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {loading ? "Saving…" : "Reset password"} <ArrowRight className="size-4" />
            </button>
          </form>
        )}
        <Link to="/login" className="mt-5 inline-block text-sm font-bold text-brand-700">
          Back to sign in
        </Link>
      </div>
    </section>
  );
};
