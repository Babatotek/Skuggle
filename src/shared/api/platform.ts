import { apiRequest } from "@/shared/api/client";

export type PlatformMetric = {
  id: string;
  label: string;
  value: number | string;
  status?: string;
  helper?: string;
  trend?: { direction?: string; label?: string };
};

export type PlatformOverview = {
  greeting?: string;
  source?: string;
  metrics: PlatformMetric[];
  recentSchools: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    subscriptionPlan?: string | null;
    studentsCount?: number;
    createdAt?: string;
    location?: string | null;
  }>;
  revenue?: {
    currency?: string;
    totalMinor?: number;
    trendLabel?: string;
  };
  schoolsByPlan?: Array<{ code: string; name: string; count: number; percent: number }>;
  tasks?: Array<{ id: string; title: string; detail: string; count?: number | null }>;
};

export async function fetchPlatformOverview(): Promise<PlatformOverview> {
  return apiRequest<PlatformOverview>("/platform/overview");
}

export async function fetchPlatformSchools(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest<{
    data: Array<Record<string, unknown>>;
    meta: { total: number; currentPage: number; lastPage: number };
  }>(`/platform/schools${query}`);
}

export async function fetchPlatformUsage() {
  return apiRequest<{
    summary: Record<string, number>;
    tenants: Array<Record<string, unknown>>;
  }>("/platform/usage");
}

export async function fetchPlatformSupport() {
  return apiRequest<{
    summary: Record<string, number>;
    items: Array<Record<string, unknown>>;
    guidance?: string;
  }>("/platform/support");
}

export async function fetchPlatformSystemHealth() {
  return apiRequest<{
    status: string;
    checks: Record<string, boolean>;
    queue: { pending: number; failed: number };
    runtime: Record<string, unknown>;
    checkedAt?: string;
  }>("/platform/system-health");
}

export async function fetchPlatformGoLive() {
  return apiRequest<{
    ready: boolean;
    checkedAt?: string;
    gates: Array<{
      id: string;
      label: string;
      status: string;
      detail: string;
      action: string;
    }>;
    commands: Record<string, string>;
  }>("/platform/go-live");
}

export async function fetchPlatformSubscriptions() {
  return apiRequest<{
    data: Array<Record<string, unknown>>;
    meta: { total: number };
  }>("/platform/subscriptions");
}

export async function fetchPlatformAudit() {
  return apiRequest<{
    data: Array<Record<string, unknown>>;
    meta: { total: number };
  }>("/platform/audit");
}

export async function fetchPlans() {
  return apiRequest<Array<Record<string, unknown>>>("/plans");
}

export async function fetchPlatformTickets(params: { search?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query}` : "";
  return apiRequest<{
    summary: Record<string, number>;
    data: Array<Record<string, unknown>>;
    meta: { total: number };
  }>(`/platform/tickets${suffix}`);
}

export async function fetchPlatformTicket(id: string) {
  return apiRequest<{ ticket: Record<string, unknown> }>(`/platform/tickets/${id}`);
}

export async function replyPlatformTicket(id: string, body: string, status?: string) {
  return apiRequest<{ ticket: Record<string, unknown> }>(`/platform/tickets/${id}/reply`, {
    method: "POST",
    body: { body, status },
  });
}

export async function resolvePlatformTicket(id: string) {
  return apiRequest<{ ticket: Record<string, unknown> }>(`/platform/tickets/${id}/resolve`, {
    method: "POST",
    body: {},
  });
}

export async function fetchPlatformInvoices(params: { search?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query}` : "";
  return apiRequest<{
    summary: Record<string, number | string>;
    data: Array<Record<string, unknown>>;
    meta: { total: number };
  }>(`/platform/invoices${suffix}`);
}

export async function generatePlatformInvoices() {
  return apiRequest<{ created: number }>("/platform/invoices/generate", {
    method: "POST",
    body: {},
  });
}

export async function markPlatformInvoicePaid(id: string) {
  return apiRequest<{ invoice: Record<string, unknown> }>(`/platform/invoices/${id}/mark-paid`, {
    method: "POST",
    body: {},
  });
}

export async function remindPlatformInvoice(id: string) {
  return apiRequest<{ invoice: Record<string, unknown>; message: string }>(
    `/platform/invoices/${id}/remind`,
    { method: "POST", body: {} },
  );
}

export async function fetchPlatformBroadcasts() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/platform/broadcasts");
}

export async function createPlatformBroadcast(input: {
  title: string;
  body: string;
  channel?: string;
  audience?: string;
  publish?: boolean;
}) {
  return apiRequest<{ broadcast: Record<string, unknown> }>("/platform/broadcasts", {
    method: "POST",
    body: input,
  });
}

export async function fetchPlatformBackups() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/platform/backups");
}

export async function createPlatformBackup() {
  return apiRequest<{ backup: Record<string, unknown> }>("/platform/backups", {
    method: "POST",
    body: {},
  });
}

export async function fetchPlatformApiCredentials() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/platform/api-credentials");
}

export async function rotatePlatformApiCredential(id: string) {
  return apiRequest<{ credential: Record<string, unknown>; message: string }>(
    `/platform/api-credentials/${id}/rotate`,
    { method: "POST", body: {} },
  );
}

export async function createSchoolInvite(input: {
  email: string;
  role: string;
  name?: string;
}) {
  return apiRequest<{
    invite: Record<string, unknown>;
    registrationLink: string;
    token: string;
    schoolCode: string;
  }>("/invites", {
    method: "POST",
    body: input,
  });
}

export async function listSchoolInvites() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/invites");
}
