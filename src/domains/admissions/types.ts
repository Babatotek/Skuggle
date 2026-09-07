export type AdmissionsSection = 'overview' | 'applications' | 'screening' | 'decisions' | 'enrolment' | 'settings';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'received'
  | 'screening'
  | 'under_review'
  | 'shortlisted'
  | 'offered'
  | 'accepted'
  | 'declined'
  | 'rejected'
  | 'waitlisted'
  | 'enrolled'
  | 'withdrawn';

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  applicantName: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  classApplied?: string;
  requestedClassId?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  screeningStage?: string;
  screeningScore?: number | null;
  decision?: string | null;
  documentCount?: number;
  convertedStudentId?: string | null;
  history?: AdmissionHistoryItem[];
  status: ApplicationStatus | string;
  submittedAt?: string | null;
  updatedAt?: string | null;
}

export interface AdmissionHistoryItem {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  reason?: string | null;
  changedAt?: string | null;
}

export interface AdmissionMetric {
  value: number;
  changePercent?: number | null;
  context?: string | null;
}

export interface AdmissionPipelineStage {
  key: 'applications' | 'screening' | 'decision' | 'offer' | 'enrolment' | string;
  label: string;
  count: number;
  context?: string | null;
}

export interface AdmissionTrendPoint {
  month: string;
  applications: number;
}

export interface AdmissionTask {
  id: string;
  label: string;
  count: number;
  dueLabel?: string | null;
  routeId?: string | null;
}

export interface AdmissionConversionSummary {
  applicationsReceived: number;
  progressedToScreening: number;
  offersSent: number;
  enrolled: number;
  conversionRate: number;
  changePercent?: number | null;
}

export interface AdmissionsOverview {
  metrics: {
    totalApplications: AdmissionMetric;
    pendingScreening: AdmissionMetric;
    offersSent: AdmissionMetric;
    enrolled: AdmissionMetric;
  };
  pipeline: AdmissionPipelineStage[];
  recentApplications: AdmissionApplication[];
  trend: AdmissionTrendPoint[];
  tasks: AdmissionTask[];
  conversion: AdmissionConversionSummary;
}

export interface AdmissionsPagination {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export interface AdmissionApplicationList {
  items: AdmissionApplication[];
  pagination: AdmissionsPagination;
  availableStatuses?: string[];
}

export interface AdmissionFilters {
  query: string;
  status: string;
  classId: string;
  page: number;
  perPage: number;
}

export interface AdmissionApplicationInput {
  firstName: string;
  lastName: string;
  requestedClassId?: string;
  cycleId?: string;
  status?: 'draft' | 'submitted';
  dateOfBirth?: string;
  gender?: string;
  guardianName: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

export interface AdmissionsSettings {
  cycles: AdmissionCycle[];
  applicationForm?: unknown;
}

export interface AdmissionCycle {
  id?: string;
  name: string;
  status: 'draft' | 'active' | 'closed';
  opensAt?: string | null;
  closesAt?: string | null;
  currency: string;
  applicationFeeMinor: number;
  settings?: Record<string, unknown>;
}

export type AdmissionsRequestState = 'loading' | 'ready' | 'error';
