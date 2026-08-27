import { apiRequest } from '@/shared/api/client';

export interface PersonalPlanDto {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const personalPlanService = {
  list: (signal?: AbortSignal) => apiRequest<PersonalPlanDto[]>('/personal/plans', signal ? { signal } : {}),
  create: (input: { title: string; dueDate: string | null }) => apiRequest<PersonalPlanDto>('/personal/plans', { method: 'POST', body: input }),
  update: (id: string, input: Partial<Pick<PersonalPlanDto, 'title' | 'dueDate' | 'completed'>>) => apiRequest<PersonalPlanDto>(`/personal/plans/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => apiRequest<null>(`/personal/plans/${id}`, { method: 'DELETE' }),
};
