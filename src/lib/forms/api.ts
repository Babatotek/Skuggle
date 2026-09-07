import { apiMutation, apiRequest } from '../apiClient';
import type { FieldLibraryResponse, FormDefinition, FormGroup } from './types';

export async function fetchFormGroups(): Promise<FormGroup[]> {
  const response = await apiRequest<{ success: true; data: { groups: FormGroup[] } }>('/forms');
  return response.data.groups;
}

export async function fetchFormDefinition(formKey: string): Promise<FormDefinition> {
  const response = await apiRequest<{ success: true; data: { form: FormDefinition } }>(`/forms/${formKey}`);
  return response.data.form;
}

export async function saveFormDefinition(formKey: string, payload: Record<string, unknown>): Promise<FormDefinition> {
  const response = await apiMutation<{ success: true; data: { form: FormDefinition } }>(`/forms/${formKey}`, 'PUT', payload);
  return response.data.form;
}

export async function resetFormDefinition(formKey: string): Promise<FormDefinition> {
  const response = await apiMutation<{ success: true; data: { form: FormDefinition } }>(`/forms/${formKey}/reset`, 'POST', {});
  return response.data.form;
}

export async function fetchFieldLibrary(formKey: string, search?: string): Promise<FieldLibraryResponse> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await apiRequest<{ success: true; data: FieldLibraryResponse }>(`/forms/${formKey}/library${params}`);
  return response.data;
}

export async function addFormField(formKey: string, payload: Record<string, unknown>) {
  const response = await apiMutation<{ success: true; data: { field: Record<string, unknown> } }>(`/forms/${formKey}/fields`, 'POST', payload);
  return response.data.field;
}
