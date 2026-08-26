import { ShieldCheck, Copy, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiRequest, getApiError } from "@/shared/api/client";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { appConfig } from "@/app/config";
import { PageSkeleton } from "@/shared/ui";

type MfaStatus = {
  privileged: boolean;
  enabled: boolean;
  confirmed: boolean;
  required: boolean;
};

export default function MfaSetupPage() {
  usePageTitle("Secure your account");
  const auth = useAuth();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [setupKey, setSetupKey] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!appConfig.liveApi || auth.status !== "authenticated") {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await apiRequest<MfaStatus>("/auth/mfa");
        setStatus(data);
        if (data.enabled && !data.confirmed) {
          const qr = await apiRequest<{ qrCodeSvg: string; setupKey: string }>("/auth/mfa/qr-code");
          setQrCodeSvg(qr.qrCodeSvg);
          setSetupKey(qr.setupKey);
        }
      } catch (caught) {
        setError(getApiError(caught).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth.status]);

  if (!appConfig.liveApi) {
    return <Navigate to="/app" replace />;
  }
  if (auth.status === "loading" || loading) {
    return <PageSkeleton label="Checking MFA status…" />;
  }
  if (auth.status !== "authenticated") {
    return <Navigate to="/login?returnTo=/security/mfa" replace />;
  }

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await apiRequest<{
        qrCodeSvg: string;
        setupKey: string;
        recoveryCodes: string[];
      }>("/auth/mfa/enable", { method: "POST", body: {} });
      setQrCodeSvg(data.qrCodeSvg);
      setSetupKey(data.setupKey);
      setRecoveryCodes(data.recoveryCodes ?? []);
      setStatus((prev) =>
        prev ? { ...prev, enabled: true, confirmed: false, required: true } : prev,
      );
    } catch (caught) {
      setError(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await apiRequest<{ recoveryCodes: string[] }>("/auth/mfa/confirm", {
        method: "POST",
        body: { code },
      });
      setRecoveryCodes(data.recoveryCodes ?? []);
      setStatus((prev) =>
        prev ? { ...prev, confirmed: true, required: false, enabled: true } : prev,
      );
      setMessage("Multi-factor authentication is now active for this account.");
      await auth.refresh?.();
    } catch (caught) {
      setError(getApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="app-container flex min-h-[calc(100dvh-72px)] items-center justify-center py-12">
      <div className="surface-card w-full max-w-xl p-7 sm:p-10 space-y-5">
        <ShieldCheck className="size-9 text-brand-600" />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-brand-900">
            Protect privileged access
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            School admins, bursars and platform owners must enable an authenticator app before
            creating or changing school data.
          </p>
        </div>

        {status?.required && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            MFA is required for your role. Finish setup to continue privileged actions.
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex gap-2">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {!status?.enabled && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void enable()}
            className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {busy ? "Starting…" : "Enable authenticator"}
          </button>
        )}

        {status?.enabled && !status.confirmed && qrCodeSvg && (
          <div className="space-y-4">
            <div
              className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-4"
              dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
            />
            {setupKey && (
              <p className="text-xs text-slate-500 break-all">
                Manual key: <span className="font-mono font-semibold text-slate-800">{setupKey}</span>
              </p>
            )}
            <label className="block text-sm font-bold">
              6-digit code from your app
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal tracking-widest"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>
            <button
              type="button"
              disabled={busy || code.trim().length < 6}
              onClick={() => void confirm()}
              className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {busy ? "Confirming…" : "Confirm and activate"}
            </button>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Copy className="size-4" /> Save these recovery codes
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs text-slate-700">
              {recoveryCodes.map((item) => (
                <li key={item} className="rounded-lg bg-white px-2 py-1.5 border border-slate-200">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link to="/app" className="inline-block text-sm font-bold text-brand-700">
          {status?.confirmed || !status?.required ? "Continue to workspace" : "Continue in read-only mode"}
        </Link>
      </div>
    </section>
  );
}
