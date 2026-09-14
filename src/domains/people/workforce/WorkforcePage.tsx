import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, UserPlus } from 'lucide-react';
import { Button, ConfirmDialog, DataTable, FormField, Input, Modal, Select, StatusBadge, type Column } from '../../../components/ui';
import { useApp } from '../../../context/AppContext';
import { ListPageLayout } from '../../../layouts/ListPageLayout';
import { apiMutation, apiRequest, describeApiError } from '../../../lib/apiClient';
import { buildRoute } from '../../../routing/builders';
import type { StaffMember } from '../../../types';
import {
  EMPLOYMENT_STATUS_OPTIONS,
  isConsequentialEmploymentStatus,
  toEmploymentStatusApi,
  toEmploymentStatusLabel,
} from './employmentStatus';
import { WorkforceImportModal } from './WorkforceImportModal';

interface LookupOption { id: string; name: string; category?: string }
interface Lookups {
  positions: LookupOption[];
  departments: LookupOption[];
  campuses: LookupOption[];
  accessRoles: string[];
  employmentStatuses: string[];
  nextEmployeeNumber?: string;
  schoolCode?: string;
}

type OnboardingStep = 1 | 2 | 3 | 4 | 5;
type AccessMode = 'not_now' | 'create_account' | 'send_invitation';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  staffNo: '',
  employmentType: 'full_time',
  staffCategory: 'teaching' as 'teaching' | 'non_teaching',
  positionId: '',
  departmentId: '',
  campusId: '',
  startedAt: new Date().toISOString().slice(0, 10),
  qualifications: '',
  accessMode: 'not_now' as AccessMode,
  accessEmail: '',
  accessRole: 'teacher',
  temporaryPassword: '',
};

const emptyPositionForm = { name: '', category: 'teaching' as 'teaching' | 'non_teaching' };
const emptyLookups = (): Lookups => ({ positions: [], departments: [], campuses: [], accessRoles: [], employmentStatuses: [] });

export const WorkforcePage: React.FC<{ view?: 'staff' | 'teachers'; employeePublicId?: string }> = ({ view = 'staff' }) => {
  const navigate = useNavigate();
  const { staff, addStaff, updateStaff, showToast, currentUser, currentRole, refreshStaff } = useApp();
  const permissions = currentUser.permissions ?? [];
  const canManage = permissions.includes('users.manage');
  const canManageAccess = currentRole === 'Super Admin' && permissions.includes('roles.manage');

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lookups, setLookups] = useState<Lookups>(emptyLookups);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ member: StaffMember; next: string } | null>(null);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [positionForm, setPositionForm] = useState(emptyPositionForm);
  const [positionBusy, setPositionBusy] = useState(false);

  useEffect(() => {
    if (!canManage) return;
    apiRequest<{ success: true; data: Lookups }>('/employees/lookups', { suppressErrorNotification: true })
      .then((response) => setLookups(response.data))
      .catch(() => undefined);
  }, [canManage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const staffId = params.get('staff');
    if (staffId) {
      navigate(buildRoute('school.people.workforce.profile', { employeePublicId: staffId }), { replace: true });
    }
  }, [navigate]);

  const openProfile = (id: string) => navigate(buildRoute('school.people.workforce.profile', { employeePublicId: id }));

  const workforce = useMemo(() => staff.filter((member) => {
    if (view !== 'teachers') return true;
    return member.staffCategory === 'teaching' || member.position.toLowerCase().includes('teacher') || member.role.toLowerCase().includes('teacher');
  }), [staff, view]);

  const filtered = useMemo(() => workforce.filter((member) => {
    const haystack = `${member.fullName} ${member.email} ${member.staffNo} ${member.position} ${member.department ?? ''}`.toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    if (categoryFilter !== 'ALL' && member.staffCategory !== categoryFilter) return false;
    if (departmentFilter !== 'ALL' && member.department !== departmentFilter) return false;
    if (positionFilter !== 'ALL' && member.position !== positionFilter) return false;
    if (campusFilter !== 'ALL' && member.campus !== campusFilter) return false;
    if (statusFilter !== 'ALL' && member.status !== statusFilter) return false;
    return true;
  }), [workforce, query, categoryFilter, departmentFilter, positionFilter, campusFilter, statusFilter]);

  const departments = [...new Set(workforce.map((m) => m.department).filter(Boolean))] as string[];
  const positions = [...new Set(workforce.map((m) => m.position).filter((p) => p && p !== '—'))];
  const campuses = [...new Set(workforce.map((m) => m.campus).filter(Boolean))];

  const applyStatus = async (member: StaffMember, nextApi: string) => {
    updateStaff(member.id, { status: toEmploymentStatusLabel(nextApi) });
  };

  const onStatusChange = (member: StaffMember, nextApi: string) => {
    if (!canManage) return;
    if (toEmploymentStatusApi(member.status) === nextApi) return;
    if (isConsequentialEmploymentStatus(nextApi)) {
      setPendingStatus({ member, next: nextApi });
      return;
    }
    void applyStatus(member, nextApi);
  };

  const createPosition = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || !positionForm.name.trim()) return;
    setPositionBusy(true);
    try {
      const created = await apiMutation<{ success: true; data: { id: string; name: string; category: string } }>(
        '/workforce/positions',
        'POST',
        { name: positionForm.name.trim(), category: positionForm.category },
      );
      const option = { id: String(created.data.id), name: created.data.name, category: created.data.category };
      setLookups((current) => ({ ...current, positions: [...current.positions.filter((p) => p.id !== option.id), option] }));
      setForm((current) => ({ ...current, positionId: option.id, staffCategory: option.category as 'teaching' | 'non_teaching' }));
      setPositionModalOpen(false);
      setPositionForm(emptyPositionForm);
      showToast('Position created', `${option.name} is available for workforce records.`, 'success');
    } catch (error) {
      showToast('Could not create position', describeApiError(error), 'error');
    } finally {
      setPositionBusy(false);
    }
  };

  const submitOnboarding = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || step < 5) return;
    if (form.accessMode === 'create_account' && !canManageAccess) {
      showToast('Access linking unavailable', 'Creating a login account requires roles.manage (Super Admin). Send an invitation instead.', 'error');
      return;
    }
    setBusy(true);
    try {
      const staffNo = form.staffNo.trim() || lookups.nextEmployeeNumber || '';
      const created = await apiMutation<{ success: true; data: Record<string, unknown> }>('/employees', 'POST', {
        employee_number: staffNo || null,
        name: form.fullName.trim(),
        employment_type: form.employmentType,
        status: 'active',
        started_at: form.startedAt || null,
        staff_category: form.staffCategory,
        position_id: form.positionId || null,
        department_id: form.departmentId || null,
        campus_id: form.campusId || null,
        personal: { email: form.email.trim() || null, phone: form.phone.trim() || null },
        professional: { qualifications: form.qualifications.trim() || null },
      });

      const resolvedStaffNo = String(created.data.employeeNumber ?? staffNo);
      const positionName = lookups.positions.find((p) => p.id === form.positionId)?.name || 'Staff';
      const departmentName = lookups.departments.find((p) => p.id === form.departmentId)?.name;
      const campusName = lookups.campuses.find((p) => p.id === form.campusId)?.name || '';
      let linkedUserId: string | null = null;
      const member: StaffMember = {
        id: String(created.data.id),
        staffNo: resolvedStaffNo,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: positionName,
        position: positionName,
        positionId: form.positionId || null,
        department: departmentName,
        departmentId: form.departmentId || null,
        staffCategory: form.staffCategory,
        campus: campusName,
        campusId: form.campusId || null,
        linkedUserId: null,
        assignedClasses: [],
        assignedSubjects: [],
        status: 'Active',
      };

      if (form.accessMode === 'create_account') {
        await apiMutation(`/employees/${encodeURIComponent(member.id)}/access`, 'POST', {
          email: form.accessEmail.trim() || form.email.trim(),
          password: form.temporaryPassword,
          role: form.accessRole,
        });
        linkedUserId = 'linked';
        showToast('Staff created with account', `${member.fullName} was saved and a login account was linked.`, 'success');
      } else if (form.accessMode === 'send_invitation') {
        await apiMutation('/invites', 'POST', {
          name: member.fullName,
          email: form.accessEmail.trim() || form.email.trim(),
          role: form.accessRole,
          expiresInDays: 7,
          employeeId: member.id,
        });
        showToast('Staff created and invited', `${member.fullName} was saved and an invitation was sent.`, 'success');
      } else {
        showToast('Staff created', `${member.fullName} was added to the workforce without a login account.`, 'success');
      }

      addStaff({ ...member, linkedUserId }, { persist: false });
      apiRequest<{ success: true; data: Lookups }>('/employees/lookups', { suppressErrorNotification: true })
        .then((response) => setLookups(response.data))
        .catch(() => undefined);
      setModalOpen(false);
      setStep(1);
      setForm(emptyForm);
      openProfile(member.id);
    } catch (error) {
      showToast('Could not create staff', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      sortable: true,
      sortValue: (member) => member.fullName,
      accessor: (member) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primitive-indigo-50)] text-xs font-semibold text-[var(--color-action-primary)]">
            {member.fullName.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <span className="block font-semibold text-[var(--color-text-primary)]">{member.fullName}</span>
            <span className="block text-xs text-[var(--color-text-muted)]">{member.email || 'No contact email'}</span>
          </span>
        </div>
      ),
    },
    { key: 'staffNo', header: 'Staff No.', accessor: (member) => member.staffNo || '—' },
    { key: 'department', header: 'Department', accessor: (member) => member.department || '—' },
    { key: 'position', header: 'Position', sortable: true, sortValue: (member) => member.position, accessor: (member) => member.position || '—' },
    {
      key: 'category',
      header: 'Staff Category',
      accessor: (member) => (member.staffCategory === 'teaching' ? 'Teaching' : member.staffCategory === 'non_teaching' ? 'Non-Teaching' : '—'),
    },
    { key: 'campus', header: 'Campus', accessor: (member) => member.campus || '—' },
    {
      key: 'status',
      header: 'Employment Status',
      accessor: (member) => (
        canManage ? (
          <Select
            aria-label={`Employment status for ${member.fullName}`}
            className="min-w-36"
            value={toEmploymentStatusApi(member.status)}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onStatusChange(member, event.target.value)}
          >
            {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        ) : <StatusBadge status={member.status === 'On Leave' ? 'Pending' : member.status} />
      ),
    },
  ];

  const title = view === 'teachers' ? 'Teachers' : 'Workforce';
  const accessRoles = lookups.accessRoles.length ? lookups.accessRoles : ['teacher', 'principal', 'bursar', 'school_admin'];

  return (
    <>
      <ListPageLayout
        breadcrumb={[{ label: 'People' }, { label: title }]}
        title={title}
        description={view === 'teachers' ? 'Teaching staff employment records.' : 'Manage employees and their school employment records. Login access is optional and managed separately.'}
        action={canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setImportOpen(true)}>Import</Button>
            <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => { setStep(1); setForm(emptyForm); setModalOpen(true); }}>Add Staff</Button>
          </div>
        ) : undefined}
        toolbar={(
          <div className="flex flex-col gap-3 border-b border-[var(--color-border-default)] p-4 lg:flex-row lg:flex-wrap lg:items-center">
            <label className="relative min-w-60 flex-1">
              <span className="sr-only">Search workforce</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input className="ds-field-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, staff no., or position" />
            </label>
            <Select className="lg:w-44" aria-label="Staff category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="ALL">All categories</option>
              <option value="teaching">Teaching</option>
              <option value="non_teaching">Non-Teaching</option>
            </Select>
            <Select className="lg:w-44" aria-label="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="ALL">All departments</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select className="lg:w-44" aria-label="Position" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
              <option value="ALL">All positions</option>
              {positions.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select className="lg:w-44" aria-label="Campus" value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)}>
              <option value="ALL">All campuses</option>
              {campuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select className="lg:w-44" aria-label="Employment status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All statuses</option>
              {EMPLOYMENT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.label}>{option.label}</option>)}
            </Select>
          </div>
        )}
      >
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(member) => member.id}
          pageSize={10}
          onRowClick={(member) => openProfile(member.id)}
          emptyTitle={filtered.length === 0 && workforce.length > 0 ? 'No matching staff' : 'No workforce members yet'}
          emptyDescription={filtered.length === 0 && workforce.length > 0 ? 'Try adjusting your filters.' : 'Add staff to begin the employment directory.'}
          mobileRenderer={(member) => (
            <button type="button" className="ds-focus-ring w-full p-4 text-left" onClick={() => openProfile(member.id)}>
              <span className="flex items-center justify-between gap-3">
                <strong>{member.fullName}</strong>
                <StatusBadge status={member.status === 'On Leave' ? 'Pending' : member.status} />
              </span>
              <span className="mt-2 block text-xs text-[var(--color-text-secondary)]">
                {member.position} · {member.staffNo || 'No staff number'}
              </span>
            </button>
          )}
        />
      </ListPageLayout>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff" description={`Step ${step} of 5 — employment first; login access is optional.`} size="lg">
        <form onSubmit={submitOnboarding} className="space-y-4">
          {step === 1 && (
            <>
              <FormField label="Full name" required><Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></FormField>
              <FormField label="Personal email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
              <FormField label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
            </>
          )}
          {step === 2 && (
            <>
              <FormField label="Staff No." hint={lookups.nextEmployeeNumber ? `Auto: ${lookups.nextEmployeeNumber} (from school name)` : 'Leave blank to auto-generate from school name'}>
                <Input value={form.staffNo} onChange={(e) => setForm({ ...form, staffNo: e.target.value })} placeholder={lookups.nextEmployeeNumber || 'Auto-generated from school name'} />
              </FormField>
              <FormField label="Staff Category" required>
                <Select value={form.staffCategory} onChange={(e) => setForm({ ...form, staffCategory: e.target.value as 'teaching' | 'non_teaching', positionId: '' })}>
                  <option value="teaching">Teaching</option>
                  <option value="non_teaching">Non-Teaching</option>
                </Select>
              </FormField>
              <FormField label="Position / Designation">
                <div className="flex gap-2">
                  <Select className="flex-1" value={form.positionId} onChange={(e) => setForm({ ...form, positionId: e.target.value })}>
                    <option value="">Select position</option>
                    {lookups.positions.filter((p) => !p.category || p.category === form.staffCategory).map((position) => (
                      <option key={position.id} value={position.id}>{position.name}</option>
                    ))}
                  </Select>
                  <Button type="button" variant="outline" onClick={() => { setPositionForm({ name: '', category: form.staffCategory }); setPositionModalOpen(true); }}>New</Button>
                </div>
              </FormField>
              <FormField label="Department">
                <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  <option value="">Select department</option>
                  {lookups.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Campus">
                <Select value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })}>
                  <option value="">Select campus</option>
                  {lookups.campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Date joined"><Input type="date" value={form.startedAt} onChange={(e) => setForm({ ...form, startedAt: e.target.value })} /></FormField>
            </>
          )}
          {step === 3 && (
            <FormField label="Qualifications / certifications">
              <Input value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} placeholder="Optional professional summary" />
            </FormField>
          )}
          {step === 4 && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Document uploads are available on the staff profile after creation. Continue to choose whether this person needs Skuggle login access.
            </p>
          )}
          {step === 5 && (
            <>
              <FormField label="Does this staff member need access to Skuggle?">
                <Select value={form.accessMode} onChange={(e) => setForm({ ...form, accessMode: e.target.value as AccessMode })}>
                  <option value="not_now">Not now</option>
                  {canManageAccess && <option value="create_account">Create account now</option>}
                  <option value="send_invitation">Send invitation</option>
                </Select>
              </FormField>
              {!canManageAccess && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Direct account creation requires Super Admin with roles.manage. You can still invite them, or manage accounts later under{' '}
                  <Link className="font-semibold text-[var(--color-action-primary)]" to={buildRoute('school.administration.users-access')}>Users</Link>.
                </p>
              )}
              {form.accessMode !== 'not_now' && (
                <>
                  <FormField label="Account email" required>
                    <Input required type="email" value={form.accessEmail || form.email} onChange={(e) => setForm({ ...form, accessEmail: e.target.value })} />
                  </FormField>
                  <FormField label="Access role">
                    <Select value={form.accessRole} onChange={(e) => setForm({ ...form, accessRole: e.target.value })}>
                      {accessRoles.map((role) => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
                    </Select>
                  </FormField>
                  {form.accessMode === 'create_account' && (
                    <FormField label="Temporary password" required>
                      <Input required minLength={10} type="password" autoComplete="new-password" value={form.temporaryPassword} onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })} />
                    </FormField>
                  )}
                </>
              )}
            </>
          )}
          <div className="flex justify-between gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => (step === 1 ? setModalOpen(false) : setStep((current) => (current - 1) as OnboardingStep))}>
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            {step < 5 ? (
              <Button type="button" onClick={() => setStep((current) => (current + 1) as OnboardingStep)} disabled={step === 1 && !form.fullName.trim()}>Continue</Button>
            ) : (
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create staff record'}</Button>
            )}
          </div>
        </form>
      </Modal>

      <Modal isOpen={positionModalOpen} onClose={() => setPositionModalOpen(false)} title="New job position" description="Positions are employment designations, not login access roles.">
        <form onSubmit={createPosition} className="space-y-4">
          <FormField label="Position name" required>
            <Input required value={positionForm.name} onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })} placeholder="e.g. Vice Principal" />
          </FormField>
          <FormField label="Category" required>
            <Select value={positionForm.category} onChange={(e) => setPositionForm({ ...positionForm, category: e.target.value as 'teaching' | 'non_teaching' })}>
              <option value="teaching">Teaching</option>
              <option value="non_teaching">Non-Teaching</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPositionModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={positionBusy}>{positionBusy ? 'Saving…' : 'Create position'}</Button>
          </div>
        </form>
      </Modal>

      <WorkforceImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        showToast={showToast}
        onImported={() => { void refreshStaff(); }}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        variant="danger"
        title={pendingStatus?.next === 'terminated' ? 'Terminate Employment' : 'Change Employment Status'}
        confirmLabel={pendingStatus?.next === 'terminated' ? 'Confirm Termination' : 'Confirm'}
        message={
          pendingStatus
            ? `You are changing ${pendingStatus.member.fullName}'s employment status to ${toEmploymentStatusLabel(pendingStatus.next)}. This does not delete the staff record${pendingStatus.next === 'terminated' || pendingStatus.next === 'suspended' ? ' and does not automatically disable their login account' : ''}.`
            : ''
        }
        onConfirm={async () => {
          if (!pendingStatus) return;
          await applyStatus(pendingStatus.member, pendingStatus.next);
          setPendingStatus(null);
        }}
      />
    </>
  );
};
