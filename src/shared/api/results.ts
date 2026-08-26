import { apiRequest } from "./client";

export interface PublicResultCheckPayload {
  admissionNumber: string;
  session: string;
  term: string;
  pin: string;
}

export interface PublicResultCheckResponse {
  studentDisplayName: string;
  className: string;
  schoolName: string;
  session: string;
  term: string;
  viewToken: string;
  viewExpiresInSeconds: number;
}

export interface PublicReportCardSubject {
  subject: string;
  average: number;
  grade: string;
  scores: Array<{
    title: string;
    type: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
}

export interface PublicReportCard {
  publicationId: string;
  school: {
    name: string;
    motto?: string | null;
    logoUrl?: string | null;
    primaryColour?: string;
    contact?: Record<string, string>;
  };
  student: {
    displayName: string;
    admissionNumber: string;
    className: string;
  };
  session: string;
  term: string;
  termAverage: number | null;
  termGrade: string | null;
  subjects: PublicReportCardSubject[];
  attendance: {
    present: number;
    absent: number;
    late: number;
    rate: number | null;
  };
  publishedAt?: string | null;
}

export interface ResultSummary {
  id: string;
  title: string;
  admissionNumber: string;
  className: string;
  session: string;
  term: string;
  status: string;
  updatedAt: string;
  publishedAt?: string | null;
  allowedActions: string[];
  hasActivePin: boolean;
  issuedPin?: string;
  issuedPinMasked?: string;
}

export interface ResultDetail extends ResultSummary {
  reportPreview?: PublicReportCard | null;
}

export interface GenerateResultsResponse {
  created: number;
  existing: number;
  session: string;
  term: string;
}

export interface BulkPublishResponse {
  published: number;
  failed: number;
  items: ResultSummary[];
  errors: Array<{ id: string; title: string; message: string }>;
}

export const checkPublicResult = (payload: PublicResultCheckPayload) =>
  apiRequest<PublicResultCheckResponse>("/public/results/check", {
    method: "POST",
    body: payload,
  });

export const fetchPublicReportCard = (token: string) =>
  apiRequest<PublicReportCard>(`/public/results/view?token=${encodeURIComponent(token)}`);

export const resultService = {
  list: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<ResultSummary[]>(`/results${suffix}`);
  },

  show: (publicationId: string) =>
    apiRequest<ResultDetail>(`/results/${publicationId}`),

  generate: (classId?: string) =>
    apiRequest<GenerateResultsResponse>("/results/generate", {
      method: "POST",
      body: classId ? { classId } : {},
    }),

  bulkPublish: (ids?: string[]) =>
    apiRequest<BulkPublishResponse>("/results/bulk-publish", {
      method: "POST",
      body: ids?.length ? { ids } : {},
    }),

  transition: (publicationId: string, action: string) =>
    apiRequest<ResultSummary>(`/results/${publicationId}/actions/${action}`, {
      method: "POST",
      body: {},
    }),
};
