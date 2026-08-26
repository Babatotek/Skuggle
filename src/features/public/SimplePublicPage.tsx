import { ArrowRight, MailCheck } from "lucide-react";
import { useState, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getApiError } from "@/shared/api/client";
import { usePageTitle } from "@/shared/hooks/usePageTitle";

export const ForgotPasswordPage = () => {
  usePageTitle("Reset password");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });
      setMessage(
        "If an account matches that address, password-reset instructions will be sent.",
      );
    } catch (caught: unknown) {
      const apiError = getApiError(caught);
      setError(
        ["not_found", "validation"].includes(apiError.kind)
          ? "If an account matches that address, password-reset instructions will be sent."
          : apiError.message,
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="app-container flex min-h-[calc(100dvh-72px)] items-center justify-center py-12">
      <div className="surface-card w-full max-w-lg p-7 sm:p-10">
        <MailCheck className="size-9 text-brand-600" />
        <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-900">
          Reset your password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your account email. For privacy, the response is the same
          whether or not the address is registered.
        </p>
        {(message !== null || error !== null) && (
          <div
            className={`mt-5 rounded-2xl p-3 text-sm ${error ? "border border-rose-200 bg-rose-50 text-rose-800" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}
            role="status"
          >
            {message ?? error}
          </div>
        )}
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
          className="mt-6"
        >
          <label className="text-sm font-bold">
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
          <button
            type="submit"
            disabled={loading}
            className="tap-target mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset instructions"}{" "}
            <ArrowRight className="size-4" />
          </button>
        </form>
        <Link
          to="/login"
          className="mt-5 inline-block text-sm font-bold text-brand-700"
        >
          Back to sign in
        </Link>
      </div>
    </section>
  );
};

export const StaticPublicPage = ({
  title,
  children,
}: {
  title: string;
  children: string;
}) => {
  usePageTitle(title);
  return (
    <article className="app-container max-w-3xl py-16">
      <h1 className="text-4xl font-black tracking-tight text-brand-900">
        {title}
      </h1>
      <p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-700">
        {children}
      </p>
    </article>
  );
};
