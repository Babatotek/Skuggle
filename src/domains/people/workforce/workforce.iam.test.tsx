import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RolesCatalogView } from '../../../features/administration/RolesCatalogView';
import { AdministratorsView } from '../../../features/administration/AdministratorsView';
import { WorkforcePage } from './WorkforcePage';

const api = vi.hoisted(() => ({
  request: vi.fn(),
  mutation: vi.fn(),
  toast: vi.fn(),
  staff: [] as Array<Record<string, unknown>>,
  updateStaff: vi.fn(),
  addStaff: vi.fn(),
}));

vi.mock('../../../context/AppContext', () => ({
  useApp: () => ({
    showToast: api.toast,
    currentUser: { permissions: ['users.manage', 'roles.manage'] },
    currentRole: 'Super Admin',
    staff: api.staff,
    updateStaff: api.updateStaff,
    addStaff: api.addStaff,
    refreshStaff: vi.fn(),
  }),
}));

vi.mock('../../../lib/apiClient', () => ({
  apiRequest: (...args: unknown[]) => api.request(...args),
  apiMutation: (...args: unknown[]) => api.mutation(...args),
  describeApiError: () => 'error',
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Workforce / IAM UI boundaries', () => {
  beforeEach(() => {
    api.staff = [{
      id: 'emp-1',
      staffNo: 'RGA-E-002',
      fullName: 'Mrs. Adeyemi',
      email: 'adeyemi@school.test',
      phone: '',
      role: 'Principal',
      position: 'Principal',
      department: 'Academics',
      staffCategory: 'teaching',
      campus: 'Main',
      assignedClasses: [],
      assignedSubjects: [],
      status: 'Active',
    }];
  });

  it('renders workforce employment columns without access role controls', () => {
    api.request.mockResolvedValue({ success: true, data: { positions: [], departments: [], campuses: [], accessRoles: [], employmentStatuses: [] } });
    render(<MemoryRouter><WorkforcePage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Workforce' })).toBeTruthy();
    expect(screen.getByText('Staff Member')).toBeTruthy();
    expect(screen.getByText('Position')).toBeTruthy();
    expect(screen.getByText('Employment Status')).toBeTruthy();
    expect(screen.queryByText('Create School Admin')).toBeNull();
    expect(screen.getByRole('button', { name: /Add Staff/i })).toBeTruthy();
  });

  it('creates a workforce position without treating it as an access role', async () => {
    api.request.mockResolvedValue({ success: true, data: { positions: [], departments: [], campuses: [], accessRoles: ['teacher'], employmentStatuses: [] } });
    api.mutation.mockResolvedValue({ success: true, data: { id: 'pos-1', name: 'Vice Principal', category: 'teaching' } });
    render(<MemoryRouter><WorkforcePage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Add Staff/i }));
    expect(screen.getByLabelText(/Full name/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Ada Lovelace' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /^New$/i }));
    expect(screen.getByText(/employment designations, not login access roles/i)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(/Vice Principal/i), { target: { value: 'Vice Principal' } });
    fireEvent.click(screen.getByRole('button', { name: /Create position/i }));
    await waitFor(() => expect(api.mutation).toHaveBeenCalledWith('/workforce/positions', 'POST', {
      name: 'Vice Principal',
      category: 'teaching',
    }));
  });

  it('roles catalog lists school-owned roles with full menu actions', async () => {
    api.request.mockResolvedValue({
      success: true,
      data: {
        roles: [
          { id: 'role-teacher', name: 'Teacher', label: 'Teacher', description: 'Default school access role', type: 'Default', memberCount: 2, permissions: [], templateKey: 'teacher' },
          { id: 'role-1', name: 'Academic Approver', label: 'Academic Approver', description: 'Reviews academic decisions', type: 'Custom', memberCount: 0, permissions: [] },
        ],
        templates: [
          { id: 'teacher', name: 'teacher', label: 'Teacher', description: 'Starter set' },
        ],
        categories: ['Administration'],
        permissions: [{ name: 'assessment.assessment.view', description: 'View assessments', domain: 'assessment', delegable: true }],
      },
    });
    render(<MemoryRouter><RolesCatalogView /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Academic Approver')).toBeTruthy());
    expect(screen.getByText('Teacher')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Create Role/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Actions for Teacher/i }));
    expect(screen.getByRole('menuitem', { name: /^View$/i })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /^Edit$/i })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /^Delete$/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Actions for Academic Approver/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^Edit$/i }));
    expect(screen.getByText(/Update this school/i)).toBeTruthy();
    expect(screen.getByText('assessment.assessment.view')).toBeTruthy();
  });

  it('users directory shows account fields and not employment statuses as workforce states', async () => {
    api.request.mockResolvedValue({
      success: true,
      data: {
        data: [{
          id: 1,
          status: 'active',
          role: 'teacher',
          roleLabel: 'Teacher',
          privileged: false,
          accountType: 'Staff',
          linkedProfile: { id: 'emp-1', type: 'workforce', label: 'Principal' },
          accessRoles: [{ label: 'Teacher' }],
          user: { id: 'u1', name: 'Mrs. Adeyemi', email: 'adeyemi@school.test', status: 'active', lastAccess: null },
        }],
      },
    });
    render(<MemoryRouter><AdministratorsView embedded /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Mrs. Adeyemi')).toBeTruthy());
    expect(screen.getByText('Account Type')).toBeTruthy();
    expect(screen.getByText('Linked Profile')).toBeTruthy();
    expect(screen.getByText('Assigned Role(s)')).toBeTruthy();
    expect(screen.queryByText('Create School Admin officer')).toBeNull();
    expect(screen.queryByText('Full name')).toBeNull();
    expect(screen.queryByText('Temporary password')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Suspend access/i }));
    expect(screen.getByText(/does not change their Workforce employment status/i)).toBeTruthy();
  });
});
