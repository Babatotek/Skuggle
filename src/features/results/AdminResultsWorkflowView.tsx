import {
  CheckCircle2,
  Copy,
  Eye,
  Key,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicReportCardView } from "@/features/results/PublicReportCardView";
import {
  RESULT_ACTION_META,
  RESULT_STATUS_META,
  countByStatus,
  isResultAction,
  isResultStatus,
  type ResultStatus,
} from "@/features/results/resultWorkflow";
import {
  resultService,
  type ResultDetail,
  type ResultSummary,
} from "@/shared/api/results";
import { getApiError } from "@/shared/api/client";
import { feedbackBus } from "@/shared/feedback/feedbackBus";

interface AdminResultsWorkflowViewProps {
  onOpenModal?: (modalName: string, data?: unknown) => void;
}

export function AdminResultsWorkflowView({
  onOpenModal,
}: AdminResultsWorkflowViewProps) {
  const [items, setItems] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | ResultStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [issuedPin, setIssuedPin] = useState<{
    student: string;
    pin: string;
  } | null>(null);
  const [bulkPins, setBulkPins] = useState<
    Array<{ student: string; pin: string }>
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await resultService.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setItems(data);
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => countByStatus(items), [items]);
  const lockedCount = useMemo(
    () => items.filter((item) => item.status === "locked").length,
    [items],
  );

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await resultService.show(id);
      setDetail(data);
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await resultService.generate();
      feedbackBus.success(
        result.created > 0
          ? `Created ${result.created} draft result(s) for ${result.session}, ${result.term}.`
          : `All enrolled students already have draft results for ${result.session}, ${result.term}.`,
      );
      await load();
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkPublish = async () => {
    if (lockedCount === 0) return;
    if (
      !window.confirm(
        `Publish ${lockedCount} locked result(s)? A parent PIN will be issued for each.`,
      )
    ) {
      return;
    }

    setBulkPublishing(true);
    try {
      const lockedIds = items
        .filter((item) => item.status === "locked")
        .map((item) => item.id);
      const result = await resultService.bulkPublish(lockedIds);
      const pins = result.items
        .filter((item) => item.issuedPin)
        .map((item) => ({
          student: item.title,
          pin: item.issuedPin as string,
        }));
      if (pins.length > 0) {
        setBulkPins(pins);
      }
      feedbackBus.success(
        result.failed > 0
          ? `Published ${result.published} result(s); ${result.failed} failed.`
          : `Published ${result.published} result(s) and issued PINs.`,
      );
      await load();
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
    } finally {
      setBulkPublishing(false);
    }
  };

  const handleAction = async (item: ResultSummary, action: string) => {
    if (!isResultAction(action)) return;
    if (
      action === "publish" &&
      !window.confirm(
        `Publish the result for ${item.title}? A new parent PIN will be issued.`,
      )
    ) {
      return;
    }
    if (
      action === "reopen" &&
      !window.confirm(`Reopen ${item.title}'s result for editing?`)
    ) {
      return;
    }

    setBusyId(item.id);
    try {
      const updated = await resultService.transition(item.id, action);
      setItems((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      if (selectedId === updated.id) {
        setDetail((current) => (current ? { ...current, ...updated } : current));
        if (updated.status === "published") {
          const refreshed = await resultService.show(updated.id);
          setDetail(refreshed);
        }
      }
      if (updated.issuedPin) {
        setIssuedPin({ student: updated.title, pin: updated.issuedPin });
      }
      feedbackBus.success(
        action === "publish"
          ? `Published ${updated.title}. PIN issued.`
          : `${RESULT_ACTION_META[action].label} completed for ${updated.title}.`,
      );
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
    } finally {
      setBusyId(null);
    }
  };

  const copyPin = async (pin: string) => {
    try {
      await navigator.clipboard.writeText(pin);
      feedbackBus.success("PIN copied to clipboard.");
    } catch {
      feedbackBus.error("Could not copy PIN.");
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Results workflow
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate draft publications, move results through approval, and
            issue parent PINs on publish.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => void handleGenerate()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate drafts
          </button>
          {lockedCount > 0 && (
            <button
              type="button"
              disabled={bulkPublishing}
              onClick={() => void handleBulkPublish()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {bulkPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Publish all locked ({lockedCount})
            </button>
          )}
          {onOpenModal && (
            <button
              type="button"
              onClick={() => onOpenModal("result_checker")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
            >
              <Shield className="h-3.5 w-3.5" />
              Test PIN checker
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(RESULT_STATUS_META) as ResultStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() =>
              setStatusFilter((current) =>
                current === status ? "all" : status,
              )
            }
            className={`rounded-2xl border p-3 text-left transition ${
              statusFilter === status
                ? "border-indigo-300 bg-indigo-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {RESULT_STATUS_META[status].label}
            </p>
            <p className="mt-1 text-xl font-black text-slate-900">
              {counts[status]}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student name or admission number"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | ResultStatus)
          }
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        >
          <option value="all">All statuses</option>
          {(Object.keys(RESULT_STATUS_META) as ResultStatus[]).map((status) => (
            <option key={status} value={status}>
              {RESULT_STATUS_META[status].label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading results…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No result publications yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Generate drafts for the current session and term to begin the
              workflow.
            </p>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Generate drafts
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Student</th>
                  <th className="px-4 py-3 font-bold">Class</th>
                  <th className="px-4 py-3 font-bold">Session / Term</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">PIN</th>
                  <th className="px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusMeta = isResultStatus(item.status)
                    ? RESULT_STATUS_META[item.status]
                    : RESULT_STATUS_META.draft;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.admissionNumber}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {item.className || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {item.session}
                        <span className="text-slate-400"> · </span>
                        {item.term}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.hasActivePin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <Key className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void openDetail(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          {item.allowedActions.map((action) => {
                            if (!isResultAction(action)) return null;
                            const meta = RESULT_ACTION_META[action];
                            const toneClass =
                              meta.tone === "primary"
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : meta.tone === "danger"
                                  ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";

                            return (
                              <button
                                key={action}
                                type="button"
                                disabled={busyId === item.id}
                                title={meta.description}
                                onClick={() => void handleAction(item, action)}
                                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60 ${toneClass}`}
                              >
                                {busyId === item.id ? "…" : meta.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {detail?.title ?? "Result detail"}
                </h2>
                <p className="text-xs text-slate-500">
                  {detail?.session} · {detail?.term}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-4rem)] overflow-y-auto p-5">
              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading detail…
                </div>
              ) : detail ? (
                <div className="space-y-4">
                  <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Admission number</dt>
                      <dd className="font-semibold">{detail.admissionNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Class</dt>
                      <dd className="font-semibold">
                        {detail.className || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Status</dt>
                      <dd className="font-semibold capitalize">
                        {detail.status.replaceAll("_", " ")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Last updated</dt>
                      <dd className="font-semibold">
                        {new Date(detail.updatedAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>

                  {detail.reportPreview ? (
                    <PublicReportCardView report={detail.reportPreview} />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                      Report preview appears after the result is published.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {issuedPin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  PIN issued for {issuedPin.student}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Share this PIN securely with the parent or student. It is only
                  shown once.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIssuedPin(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <code className="text-lg font-black tracking-wider text-emerald-900">
                {issuedPin.pin}
              </code>
              <button
                type="button"
                onClick={() => void copyPin(issuedPin.pin)}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIssuedPin(null)}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {bulkPins.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-emerald-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {bulkPins.length} PIN{bulkPins.length === 1 ? "" : "s"} issued
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Copy and share securely. These values are only shown once.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkPins([])}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto p-5">
              {bulkPins.map((entry) => (
                <div
                  key={`${entry.student}-${entry.pin}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {entry.student}
                    </p>
                    <code className="text-sm font-black tracking-wider text-emerald-900">
                      {entry.pin}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyPin(entry.pin)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 shadow-sm"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-emerald-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setBulkPins([])}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
