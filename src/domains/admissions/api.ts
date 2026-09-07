import { apiMutation, apiRequest } from '../../lib/apiClient';
import type {
  AdmissionApplication,
  AdmissionApplicationInput,
  AdmissionApplicationList,
  AdmissionCycle,
  AdmissionFilters,
  AdmissionsOverview,
  AdmissionsSettings,
} from './types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

const queryString = (values: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export function getAdmissionsOverview(signal?: AbortSignal): Promise<ApiEnvelope<AdmissionsOverview>> {
  return apiRequest<ApiEnvelope<OverviewWire>>('/admissions/overview', { signal, suppressErrorNotification: true })
    .then((response) => ({ ...response, data: mapOverview(response.data) }));
}

export function getAdmissionApplications(filters: AdmissionFilters, signal?: AbortSignal): Promise<ApiEnvelope<AdmissionApplicationList>> {
  return apiRequest<ApiEnvelope<ApplicationListWire>>(`/admissions/applications${queryString({
    search: filters.query.trim() || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    classId: filters.classId === 'ALL' ? undefined : filters.classId,
    page: filters.page,
    perPage: filters.perPage,
  })}`, { signal, suppressErrorNotification: true })
    .then((response) => ({ ...response, data: mapApplicationList(response.data) }));
}

export function getAdmissionApplication(applicationId: string, signal?: AbortSignal): Promise<ApiEnvelope<AdmissionApplication>> {
  return apiRequest<ApiEnvelope<ApplicationWire>>(
    `/admissions/applications/${encodeURIComponent(applicationId)}`,
    { signal, suppressErrorNotification: true },
  ).then((response) => ({ ...response, data: mapApplication(response.data) }));
}

export function getAdmissionsQueue(
  queue: 'screening' | 'decisions' | 'enrolment',
  filters: AdmissionFilters,
  signal?: AbortSignal,
): Promise<ApiEnvelope<AdmissionApplicationList>> {
  return apiRequest<ApiEnvelope<ApplicationListWire>>(`/admissions/${queue}${queryString({
    search: filters.query.trim() || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    classId: filters.classId === 'ALL' ? undefined : filters.classId,
    page: filters.page,
    perPage: filters.perPage,
  })}`, { signal, suppressErrorNotification: true })
    .then((response) => ({ ...response, data: mapApplicationList(response.data) }));
}

export function getAdmissionsSettings(signal?: AbortSignal): Promise<ApiEnvelope<AdmissionsSettings>> {
  return apiRequest('/admissions/settings', { signal, suppressErrorNotification: true });
}

export function createAdmissionApplication(input: AdmissionApplicationInput): Promise<ApiEnvelope<AdmissionApplication>> {
  return apiMutation<ApiEnvelope<ApplicationWire>>('/admissions/applications', 'POST', input)
    .then((response) => ({ ...response, data: mapApplication(response.data) }));
}

export function importAdmissionApplications(file: File): Promise<ApiEnvelope<{ imported: number; applicationIds: string[] }>> {
  const form = new FormData();
  form.append('file', file);
  return apiMutation('/admissions/applications/import', 'POST', form);
}

export function recordAdmissionScreening(applicationId: string, input: { status: string; score?: number; notes?: string }): Promise<ApiEnvelope<unknown>> {
  return apiMutation(`/admissions/applications/${encodeURIComponent(applicationId)}/screenings`, 'POST', input);
}

export function recordAdmissionDecision(applicationId: string, input: { decision: string; offeredClassId?: string; notes?: string }): Promise<ApiEnvelope<unknown>> {
  return apiMutation(`/admissions/applications/${encodeURIComponent(applicationId)}/decision`, 'POST', input);
}

export function transitionAdmissionApplication(applicationId: string, status: 'accepted' | 'declined' | 'withdrawn'): Promise<ApiEnvelope<AdmissionApplication>> {
  return apiMutation<ApiEnvelope<ApplicationWire>>(
    `/admissions/applications/${encodeURIComponent(applicationId)}/transitions`,
    'POST',
    { status },
  ).then((response) => ({ ...response, data: mapApplication(response.data) }));
}

export function convertAdmissionApplication(applicationId: string, input: { academicSessionId?: string; termId?: string }): Promise<ApiEnvelope<{ studentId: string }>> {
  return apiMutation(`/admissions/applications/${encodeURIComponent(applicationId)}/convert`, 'POST', input);
}

export function updateAdmissionCycle(input: AdmissionCycle): Promise<ApiEnvelope<AdmissionCycle>> {
  return apiMutation('/admissions/settings/cycle', 'PUT', input);
}

interface ApplicationWire {
  id: string;
  reference: string;
  status: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  requestedClass?: { id: string; name: string } | null;
  screenings?: { id: string; status: string; score?: number | null; completedAt?: string | null }[];
  decision?: { decision: string } | null;
  documentCount?: number;
  convertedStudentId?: string | null;
  history?: { id: string; fromStatus?: string | null; toStatus: string; reason?: string | null; changedAt?: string | null }[];
  submittedAt?: string | null;
  updatedAt?: string | null;
}

interface ApplicationListWire {
  data: ApplicationWire[];
  meta: { currentPage: number; perPage: number; total: number; lastPage: number };
}

interface OverviewWire {
  metrics: { id: string; label: string; value: number }[];
  pipeline: { status: string; count: number }[];
  recentApplications: ApplicationWire[];
  trend: { label: string; applications: number }[];
  tasks: { id: string; label: string; count: number }[];
  conversion: { converted: number; decided: number; rate: number };
}

function mapApplication(application: ApplicationWire): AdmissionApplication {
  const latestScreening = application.screenings?.at(-1);
  return {
    id: application.id,
    applicationNumber: application.reference,
    applicantName: application.fullName,
    firstName: application.firstName,
    lastName: application.lastName,
    gender: application.gender,
    dateOfBirth: application.dateOfBirth,
    classApplied: application.requestedClass?.name,
    requestedClassId: application.requestedClass?.id,
    guardianName: application.guardianName,
    guardianPhone: application.guardianPhone,
    guardianEmail: application.guardianEmail,
    screeningStage: latestScreening?.status,
    screeningScore: latestScreening?.score,
    decision: application.decision?.decision,
    documentCount: application.documentCount,
    convertedStudentId: application.convertedStudentId,
    history: application.history,
    status: application.status,
    submittedAt: application.submittedAt,
    updatedAt: application.updatedAt,
  };
}

function mapApplicationList(list: ApplicationListWire): AdmissionApplicationList {
  return {
    items: list.data.map(mapApplication),
    pagination: {
      page: list.meta.currentPage,
      perPage: list.meta.perPage,
      total: list.meta.total,
      lastPage: list.meta.lastPage,
    },
  };
}

function mapOverview(overview: OverviewWire): AdmissionsOverview {
  const metrics = new Map(overview.metrics.map((metric) => [metric.id, metric]));
  const statuses = new Map(overview.pipeline.map((stage) => [stage.status, stage.count]));
  const value = (id: string) => metrics.get(id)?.value ?? 0;
  const count = (...keys: string[]) => keys.reduce((total, key) => total + (statuses.get(key) ?? 0), 0);
  const total = value('totalApplications');
  const pending = value('awaitingScreening');
  const offers = value('offersAndAcceptances');
  const enrolled = overview.conversion.converted;
  const shareOfTotal = (amount: number) => (total > 0 ? `${Math.round((amount / total) * 100)}% of total applications` : 'Current admissions cycle');
  return {
    metrics: {
      totalApplications: { value: total, context: 'Current admissions cycle' },
      pendingScreening: { value: pending, context: shareOfTotal(pending) },
      offersSent: { value: offers, context: shareOfTotal(offers) },
      enrolled: { value: enrolled, context: `${overview.conversion.rate}% conversion rate` },
    },
    pipeline: [
      { key: 'applications', label: 'Application Received', count: total, context: 'Total applications' },
      { key: 'screening', label: 'Screening', count: pending, context: 'Under review' },
      { key: 'decision', label: 'Decision', count: count('screened', 'waitlisted', 'offered', 'accepted', 'declined', 'rejected'), context: 'Decisions made' },
      { key: 'offer', label: 'Offer', count: offers, context: 'Offers sent' },
      { key: 'enrolment', label: 'Enrolment', count: enrolled, context: 'Successfully enrolled' },
    ],
    recentApplications: overview.recentApplications.map(mapApplication),
    trend: overview.trend.map((point) => ({ month: point.label, applications: point.applications })),
    tasks: overview.tasks,
    conversion: {
      applicationsReceived: total,
      progressedToScreening: count('screening', 'screened', 'waitlisted', 'offered', 'accepted', 'declined', 'rejected', 'enrolled'),
      offersSent: offers,
      enrolled,
      conversionRate: overview.conversion.rate,
    },
  };
}
