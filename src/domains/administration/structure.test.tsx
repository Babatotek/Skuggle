import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { SchoolStructureView } from '../../features/school/SchoolStructureView';

const mock = vi.hoisted(() => ({ request: vi.fn(), toast: vi.fn() }));
vi.mock('../../lib/apiClient', () => ({ apiRequest: mock.request, apiMutation: vi.fn(), describeApiError: (error: Error) => error.message }));
vi.mock('../../context/AppContext', () => ({ useApp: () => ({ showToast: mock.toast }) }));
vi.mock('../../features/branding/BrandingStudio', () => ({ BrandingStudio: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Administration structure loading', () => {
  it('loads only the selected resource, including later pages', async () => {
    mock.request.mockImplementation(async (url: string) => ({ data: { data: [{ id: url, name: url.endsWith('page=1') ? 'First campus' : 'Second campus' }], meta: { lastPage: 2 } } }));
    render(<SchoolStructureView focused resource="campuses" title="Campuses" />);
    expect(await screen.findByText('Second campus')).toBeTruthy();
    expect(mock.request.mock.calls.map(call => call[0])).toEqual(['/school-structure/campuses?perPage=100&page=1', '/school-structure/campuses?perPage=100&page=2']);
    expect(screen.queryByRole('button', { name: 'Departments' })).toBeNull();
  });
  it('distinguishes loading failures from an empty configuration', async () => {
    mock.request.mockRejectedValue(new Error('Access denied'));
    render(<SchoolStructureView focused resource="subjects" title="Subjects" />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Access denied'));
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.queryByText('No subjects yet')).toBeNull();
  });
});
