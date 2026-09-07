import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdmissionApplication, AdmissionsOverview } from './types';
import {
  AdmissionsApplicationsPage,
  AdmissionsDecisionsPage,
  AdmissionsEnrolmentPage,
  AdmissionsOverviewPage,
  AdmissionsScreeningPage,
  AdmissionsSettingsPage,
} from './AdmissionsPages';
import { ApplicationsTable } from './components';

const showToast = vi.fn();
let canManage = true;

vi.mock('../../context/AppContext', () => ({ useApp: () => ({ showToast, classes: [{ id: 'class_public_1', name: 'JSS 1' }] }) }));
vi.mock('../../state/ApplicationStateProviders', () => ({
  useAccess: () => ({ hasCapability: () => canManage }),
  useAcademicContext: () => ({ session: { id: 'session_public_1' }, term: { id: 'term_public_1' } }),
}));

const application: AdmissionApplication = {
  id: 'app_public_1',
  applicationNumber: 'APP-001',
  applicantName: 'Amina Abdul',
  gender: 'Female',
  classApplied: 'JSS 1',
  status: 'screening',
  screeningStage: 'Interview',
  submittedAt: '2026-09-02T08:00:00Z',
};

const overview: AdmissionsOverview = {
  metrics: {
    totalApplications: { value: 48, context: 'Current cycle' },
    pendingScreening: { value: 12 },
    offersSent: { value: 18 },
    enrolled: { value: 15 },
  },
  pipeline: [
    { key: 'applications', label: 'Application Received', count: 48 },
    { key: 'screening', label: 'Screening', count: 12 },
    { key: 'decision', label: 'Decision', count: 20 },
    { key: 'offer', label: 'Offer', count: 18 },
    { key: 'enrolment', label: 'Enrolment', count: 15 },
  ],
  recentApplications: [application],
  trend: [{ month: 'Sep', applications: 48 }],
  tasks: [{ id: 'screen', label: 'Review pending applications', count: 12 }],
  conversion: { applicationsReceived: 48, progressedToScreening: 12, offersSent: 18, enrolled: 15, conversionRate: 31 },
};

const list = {
  items: [application],
  pagination: { page: 1, perPage: 10, total: 1, lastPage: 1 },
  availableStatuses: ['screening', 'offered'],
  availableClasses: ['JSS 1'],
};

vi.mock('./hooks', () => ({
  useAdmissionsQuery: (_request: unknown, dependencyKey: string) => ({
    data: dependencyKey === 'overview'
      ? overview
      : dependencyKey === 'settings'
        ? { cycles: [{ id: 'cycle_public_1', name: '2026 intake', status: 'active', currency: 'NGN', applicationFeeMinor: 0 }] }
        : list,
    state: 'ready',
    error: null,
    reload: vi.fn(),
  }),
}));

const renderRoute = (path: string, node: React.ReactNode) => render(<MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>);

describe('Admissions V2 routes', () => {
  beforeEach(() => { canManage = true; showToast.mockClear(); });

  it.each([
    ['/school/admissions', <AdmissionsOverviewPage />, 'Admissions'],
    ['/school/admissions/applications', <AdmissionsApplicationsPage />, 'Applications'],
    ['/school/admissions/screening', <AdmissionsScreeningPage />, 'Screening'],
    ['/school/admissions/decisions', <AdmissionsDecisionsPage />, 'Decisions & Offers'],
    ['/school/admissions/enrolment', <AdmissionsEnrolmentPage />, 'Enrolment'],
    ['/school/admissions/settings', <AdmissionsSettingsPage />, 'Settings'],
  ])('renders the native composition for %s', (path, page, heading) => {
    renderRoute(path, page);
    expect(screen.getAllByRole('heading', { name: heading })).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: 'Admissions sections' })).toBeTruthy();
  });

  it('renders real aggregate sections and connected pipeline links', () => {
    renderRoute('/school/admissions', <AdmissionsOverviewPage />);
    expect(screen.getByText('Total Applications').parentElement?.textContent).toContain('48');
    expect(screen.getByRole('link', { name: /Application Received 48/ }).getAttribute('href')).toBe('/school/admissions/applications');
    expect(screen.getByText('31% conversion rate')).toBeTruthy();
    expect(screen.getAllByText('Amina Abdul').length).toBeGreaterThan(0);
  });

  it('marks exactly one contextual route active', () => {
    renderRoute('/school/admissions/screening', <AdmissionsScreeningPage />);
    const active = screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toContain('Screening');
  });

  it('applies coherent search, status and class filters', () => {
    renderRoute('/school/admissions/applications', <AdmissionsApplicationsPage />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search applications' }), { target: { value: 'Amina' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by status' }), { target: { value: 'offered' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by class' }), { target: { value: 'class_public_1' } });
    expect(screen.getAllByText('Amina Abdul').length).toBeGreaterThan(0);
  });

  it('offers enrolment conversion only for accepted applicants', () => {
    renderRoute('/school/admissions/enrolment', <AdmissionsEnrolmentPage />);
    expect(screen.queryByRole('button', { name: 'Enrol' })).toBeNull();
  });

  it('hides consequential actions without capability', () => {
    canManage = false;
    renderRoute('/school/admissions/applications', <AdmissionsApplicationsPage />);
    expect(screen.queryByRole('button', { name: 'New Application' })).toBeNull();
  });

  it('opens the typed application form for authorized users', () => {
    renderRoute('/school/admissions/applications', <AdmissionsApplicationsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'New Application' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByLabelText(/First name/)).toBeTruthy();
    expect(screen.getByLabelText(/Guardian name/)).toBeTruthy();
  });
});

describe('Admissions application list states', () => {
  const base = { applications: [application], onOpen: vi.fn() };

  it('supports loading, error, true-empty and filtered-empty states', () => {
    const { rerender } = render(<ApplicationsTable {...base} state="loading" />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeTruthy();
    rerender(<ApplicationsTable {...base} state="error" error="Unable to load applications" />);
    expect(screen.getByRole('alert').textContent).toContain('Unable to load applications');
    rerender(<ApplicationsTable applications={[]} onOpen={base.onOpen} />);
    expect(screen.getByText('No applications yet')).toBeTruthy();
    rerender(<ApplicationsTable applications={[]} onOpen={base.onOpen} filtered />);
    expect(screen.getByText('No matching applications')).toBeTruthy();
  });

  it('provides a dedicated mobile card renderer and keyboard-operable rows', () => {
    render(<ApplicationsTable {...base} />);
    expect(screen.getAllByRole('button', { name: /Amina Abdul/ }).length).toBeGreaterThan(0);
    const tableRow = screen.getAllByRole('row').find((row) => row.textContent?.includes('Amina Abdul'));
    expect(tableRow?.getAttribute('tabindex')).toBe('0');
  });

  it('delegates server pagination changes', () => {
    const onPageChange = vi.fn();
    render(<ApplicationsTable {...base} page={1} total={20} perPage={10} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
