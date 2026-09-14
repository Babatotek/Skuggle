import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudentServicesPage } from './StudentServicesPage';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({ showToast: api.toast }),
}));

vi.mock('./api', () => ({
  listServiceRecords: (...args: unknown[]) => api.list(...args),
  createServiceRecord: (...args: unknown[]) => api.create(...args),
  updateServiceRecord: (...args: unknown[]) => api.update(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Student Services v2', () => {
  beforeEach(() => {
    api.list.mockResolvedValue({
      success: true,
      data: {
        definition: {
          label: 'Behaviour',
          statuses: ['recorded', 'reviewed'],
          fields: [
            { key: 'student', label: 'Student', type: 'text', required: true },
            { key: 'incident', label: 'Incident', type: 'text' },
            { key: 'points', label: 'Points', type: 'text' },
          ],
        },
        data: [{
          id: 'rec-1',
          title: 'Late to assembly',
          status: 'recorded',
          payload: { student: 'Ada Lovelace', incident: 'Late', points: '2' },
          createdAt: '2026-09-09T10:00:00Z',
        }],
        meta: { total: 1 },
      },
    });
  });

  it('renders context navigation and record table actions', async () => {
    render(<MemoryRouter><StudentServicesPage sectionId="behaviour" /></MemoryRouter>);
    await waitFor(() => expect(api.list).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Late to assembly')).toBeTruthy());
    expect(screen.getByRole('navigation', { name: /Student services sections/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Discipline' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add record/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Actions for Late to assembly/i }));
    expect(screen.getByRole('menuitem', { name: /^View$/i })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /^Edit$/i })).toBeTruthy();
  });
});
