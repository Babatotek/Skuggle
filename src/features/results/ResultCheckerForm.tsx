import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Key,
  Loader2,
  Shield,
} from "lucide-react";
import {
  checkPublicResult,
  fetchPublicReportCard,
  type PublicReportCard,
  type PublicResultCheckResponse,
} from "@/shared/api/results";
import { getApiError } from "@/shared/api/client";
import { PublicReportCardView } from "@/features/results/PublicReportCardView";

export interface ResultCheckerFormProps {
  initialAdmissionNo?: string;
  compact?: boolean;
  onVerified?: (result: PublicResultCheckResponse) => void;
}

export function ResultCheckerForm({
  initialAdmissionNo = "",
  compact = false,
  onVerified,
}: ResultCheckerFormProps) {
  const [admissionNo, setAdmissionNo] = useState(initialAdmissionNo);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("First Term");
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState<PublicResultCheckResponse | null>(
    null,
  );
  const [report, setReport] = useState<PublicReportCard | null>(null);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsVerifying(true);
    setError(null);
    setReport(null);

    try {
      const result = await checkPublicResult({
        admissionNumber: admissionNo.trim(),
        session: session.trim(),
        term: term.trim(),
        pin: pin.trim(),
      });
      setVerified(result);
      onVerified?.(result);
      setLoadingReport(true);
      try {
        const reportCard = await fetchPublicReportCard(result.viewToken);
        setReport(reportCard);
      } catch {
        setError(
          "PIN verified, but the report card could not be loaded. Try again shortly.",
        );
      } finally {
        setLoadingReport(false);
      }
    } catch (err) {
      const apiError = getApiError(err);
      setError(
        apiError.kind === "rate_limited"
          ? "Too many attempts. Please wait before trying again."
          : "The result details or PIN could not be verified. Check your information and try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  if (verified) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">
            Result verified successfully
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Authentic published result for {verified.studentDisplayName}
          </p>
        </div>

        {loadingReport && (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading report card…
          </div>
        )}

        {report && <PublicReportCardView report={report} />}

        <button
          type="button"
          onClick={() => {
            setVerified(null);
            setReport(null);
            setPin("");
          }}
          className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Check another result
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4 text-xs">
      {!compact && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 p-4 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold">Public Result PIN Checker</p>
            <p className="text-[10.5px] text-white/80">
              Enter your admission number, session, term and PIN
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block font-bold text-slate-700">
          Student admission number
        </label>
        <input
          type="text"
          required
          value={admissionNo}
          onChange={(event) => setAdmissionNo(event.target.value)}
          placeholder="e.g. RGA26/1006"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-bold text-slate-700">
            Academic session
          </label>
          <input
            type="text"
            required
            value={session}
            onChange={(event) => setSession(event.target.value)}
            placeholder="e.g. 2025/2026"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block font-bold text-slate-700">Term</label>
          <select
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800"
          >
            <option>First Term</option>
            <option>Second Term</option>
            <option>Third Term</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
          <Key className="h-3.5 w-3.5 text-amber-600" />
          <span>Result PIN</span>
        </div>
        <input
          type="text"
          required
          minLength={6}
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="Enter your result PIN"
          className="w-full rounded-lg border border-amber-200 bg-white p-2 font-mono font-bold tracking-wider text-slate-900"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isVerifying}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {isVerifying ? "Verifying PIN…" : "Check result now →"}
      </button>
    </form>
  );
}
