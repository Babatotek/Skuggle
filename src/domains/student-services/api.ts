import { apiMutation, apiRequest } from '../../lib/apiClient';
import type { ServiceRecordInput, ServiceRecordsResponse } from './types';

export function listServiceRecords(moduleKey: string, params: { page?: number; q?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.q) query.set('q', params.q);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  const suffix = query.toString() ? `?${query}` : '';
  return apiRequest<ServiceRecordsResponse>(`/school-modules/${encodeURIComponent(moduleKey)}${suffix}`, {
    suppressErrorNotification: true,
  });
}

export function createServiceRecord(moduleKey: string, input: ServiceRecordInput) {
  return apiMutation(`/school-modules/${encodeURIComponent(moduleKey)}`, 'POST', input);
}

export function updateServiceRecord(moduleKey: string, recordId: string, input: ServiceRecordInput) {
  return apiMutation(`/school-modules/${encodeURIComponent(moduleKey)}/${encodeURIComponent(recordId)}`, 'PATCH', input);
}
