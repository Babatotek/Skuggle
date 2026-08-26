import type { ResultSummary } from "@/shared/api/results";

export type ResultStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "locked"
  | "published";

export type ResultAction =
  | "submit"
  | "review"
  | "approve"
  | "lock"
  | "publish"
  | "reopen";

export const RESULT_STATUS_META: Record<
  ResultStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700" },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
  under_review: {
    label: "Under review",
    className: "bg-amber-100 text-amber-800",
  },
  approved: { label: "Approved", className: "bg-teal-100 text-teal-800" },
  locked: { label: "Locked", className: "bg-purple-100 text-purple-800" },
  published: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
};

export const RESULT_ACTION_META: Record<
  ResultAction,
  { label: string; description: string; tone: "primary" | "danger" | "neutral" }
> = {
  submit: {
    label: "Submit",
    description: "Send to examination office for review",
    tone: "primary",
  },
  review: {
    label: "Review",
    description: "Mark as under review",
    tone: "neutral",
  },
  approve: {
    label: "Approve",
    description: "Approve result for locking",
    tone: "primary",
  },
  lock: {
    label: "Lock",
    description: "Lock gradebook before publication",
    tone: "neutral",
  },
  publish: {
    label: "Publish & issue PIN",
    description: "Publish result and generate parent PIN",
    tone: "primary",
  },
  reopen: {
    label: "Reopen",
    description: "Return to draft for corrections",
    tone: "danger",
  },
};

export function isResultStatus(value: string): value is ResultStatus {
  return value in RESULT_STATUS_META;
}

export function isResultAction(value: string): value is ResultAction {
  return value in RESULT_ACTION_META;
}

export function countByStatus(items: ResultSummary[]): Record<ResultStatus, number> {
  const counts: Record<ResultStatus, number> = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    locked: 0,
    published: 0,
  };

  for (const item of items) {
    if (isResultStatus(item.status)) {
      counts[item.status] += 1;
    }
  }

  return counts;
}
