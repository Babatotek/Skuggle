import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

export type StudentCbtListItem = {
  id: string;
  title: string;
  className: string;
  subject: string | null;
  status: string;
  maxScore: number;
  questionCount: number;
  submitted: boolean;
  inProgress?: boolean;
  canAttempt: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  durationMinutes: number;
  windowState: string;
};

export type StudentCbtQuestion = {
  id: string;
  number: number;
  prompt: string;
  questionType: string;
  options: string[];
  marks: number;
  section?: string | null;
  autoMarkable?: boolean;
};

export type StudentCbtPlayer = {
  id: string;
  title: string;
  className: string;
  subject: string | null;
  status: string;
  maxScore: number;
  instructions?: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  durationMinutes: number;
  submitted: boolean;
  canAttempt: boolean;
  answers?: Record<string, string>;
  attemptStatus?: string | null;
  startedAt?: string | null;
  questions: StudentCbtQuestion[];
};

export const listStudentCbt = () => apiRequest<{ data: { data: StudentCbtListItem[] } }>('/student/cbt/assessments', { suppressErrorNotification: true });
export const getStudentCbt = (id: string) => apiRequest<{ data: StudentCbtPlayer }>(`/student/cbt/assessments/${id}`, { suppressErrorNotification: true });
export const saveStudentCbt = (id: string, answers: Record<string, string>) => apiMutation<{ data: { answers: Record<string, string>; status: string } }>(`/student/cbt/assessments/${id}/attempts`, 'PUT', { answers });
export const submitStudentCbt = (id: string, answers: Record<string, string>) => apiMutation<{ data: { score: number; maxScore: number; percentage: number; submissionId: string; autoMarked?: boolean; needsMarking?: boolean } }>(`/student/cbt/assessments/${id}/attempts`, 'POST', { answers });
export { describeApiError };
