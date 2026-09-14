import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, FormField, Input, Modal, Select } from '../../../components/ui';
import { useApp } from '../../../context/AppContext';
import { ListPageLayout } from '../../../layouts/ListPageLayout';
import { apiMutation, apiRequest, describeApiError } from '../../../lib/apiClient';
import { buildRoute } from '../../../routing/builders';
import type { StaffMember } from '../../../types';
import { mapEmployeeRow } from './employmentStatus';

interface LookupOption { id: string; name: string; category?: string }
interface Lookups {
  positions: LookupOption[];
  departments: LookupOption[];
  campuses: LookupOption[];
  accessRoles: string[];
}

interface EmployeeDocumentRow {
  public_id?: string;
  id?: string;
  document_type?: string;
  documentType?: string;
  original_name?: string;
  originalName?: string;
}

type AccessMode = 'create_account' | 'send_invitation';

export const EmployeeProfilePage: React.FC<{ employeePublicId: string }> = ({ employeePublicId }) => {
  const navigate = useNavigate();
  const { staff, updateStaff, showToast, currentUser, currentRole } = useApp();
  const permissions = currentUser.permissions ?? [];
  const canManage = permissions.includes('users.manage');
  const canManageAccess = currentRole === 'Super Admin' && permissions.includes('roles.manage');

  const [member, setMember] = useState<StaffMember | null>(staff.find((item) => item.id === employeePublicId) ?? null);
  const [lookups, setLookups] = useState<Lookups>({ positions: [], departments: [], campuses: [], accessRoles: [] });
  const [loading, setLoading] = useState(!member);
  const [busy, setBusy] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [positionForm, setPositionForm] = useState({ name: '', category: 'teaching' as 'teaching' | 'non_teaching' });
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    staffCategory: '' as '' | 'teaching' | 'non_teaching',
    positionId: '',
    departmentId: '',
    campusId: '',
  });
  const [accessForm, setAccessForm] = useState({
    mode: 'send_invitation' as AccessMode,
    email: '',
    role: 'teacher',
    temporaryPassword: '',
  });
  const [documents, setDocuments] = useState<EmployeeDocumentRow[]>([]);
  const [docType, setDocType] = useState('qualification');
  const [docFile, setDocFile] = useState<File | null>(null);

  useEffect(() => {
    if (!canManage) return;
    apiRequest<{ success: true; data: Lookups }>('/employees/lookups', { suppressErrorNotification: true })
      .then((response) => setLookups(response.data))
      .catch(() => undefined);
  }, [canManage]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<{ success: true; data: Record<string, unknown> }>(`/employees/${encodeURIComponent(employeePublicId)}`, { suppressErrorNotification: true })
      .then((response) => {
        if (!active) return;
        const mapped = mapEmployeeRow(response.data) as StaffMember;
        setMember(mapped);
        updateStaff(mapped.id, mapped, { persist: false });
      })
      .catch((error) => {
        if (!active) return;
        showToast('Employee not found', describeApiError(error), 'error');
        navigate(buildRoute('school.people.workforce'), { replace: true });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employeePublicId]);

  useEffect(() => {
    if (!member) return;
    setEditForm({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      staffCategory: member.staffCategory ?? '',
      positionId: member.positionId ?? '',
      departmentId: member.departmentId ?? '',
      campusId: member.campusId ?? '',
    });
    setAccessForm({
      mode: canManageAccess ? 'create_account' : 'send_invitation',
      email: member.email,
      role: lookups.accessRoles[0] || 'teacher',
      temporaryPassword: '',
    });
    if (!canManage) {
      setDocuments([]);
      return;
    }
    apiRequest<{ success: true; data: { data?: EmployeeDocumentRow[] } | EmployeeDocumentRow[] }>(
      `/employees/${encodeURIComponent(member.id)}/documents`,
      { suppressErrorNotification: true },
    )
      .then((response) => {
        const payload = response.data;
        setDocuments(Array.isArray(payload) ? payload : (payload.data ?? []));
      })
      .catch(() => setDocuments([]));
  }, [member?.id, canManage, canManageAccess, lookups.accessRoles.join('|')]);

  const createPosition = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || !positionForm.name.trim()) return;
    setBusy(true);
    try {
      const created = await apiMutation<{ success: true; data: { id: string; name: string; category: string } }>(
        '/workforce/positions',
        'POST',
        { name: positionForm.name.trim(), category: positionForm.category },
      );
      const option = { id: String(created.data.id), name: created.data.name, category: created.data.category };
      setLookups((current) => ({ ...current, positions: [...current.positions.filter((p) => p.id !== option.id), option] }));
      setEditForm((current) => ({ ...current, positionId: option.id, staffCategory: option.category as 'teaching' | 'non_teaching' }));
      setPositionModalOpen(false);
      setPositionForm({ name: '', category: 'teaching' });
      showToast('Position created', `${option.name} is available for workforce records.`, 'success');
    } catch (error) {
      showToast('Could not create position', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveEmployment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!member || !canManage) return;
    const positionName = lookups.positions.find((p) => p.id === editForm.positionId)?.name || member.position;
    const departmentName = lookups.departments.find((p) => p.id === editForm.departmentId)?.name;
    const campusName = lookups.campuses.find((p) => p.id === editForm.campusId)?.name || '';
    const updates: Partial<StaffMember> = {
      fullName: editForm.fullName.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      position: positionName,
      positionId: editForm.positionId || null,
      department: departmentName,
      departmentId: editForm.departmentId || null,
      campus: campusName,
      campusId: editForm.campusId || null,
      staffCategory: editForm.staffCategory || null,
    };
    updateStaff(member.id, updates);
    setMember({ ...member, ...updates, role: positionName });
  };

  const grantAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!member || member.linkedUserId || !canManage) return;
    if (accessForm.mode === 'create_account' && !canManageAccess) {
      showToast('Access linking unavailable', 'Creating a login account requires roles.manage (Super Admin).', 'error');
      return;
    }
    setBusy(true);
    try {
      if (accessForm.mode === 'create_account') {
        await apiMutation(`/employees/${encodeURIComponent(member.id)}/access`, 'POST', {
          email: accessForm.email.trim(),
          password: accessForm.temporaryPassword,
          role: accessForm.role,
        });
        updateStaff(member.id, { linkedUserId: 'linked' }, { persist: false });
        setMember({ ...member, linkedUserId: 'linked' });
        showToast('Account linked', `${member.fullName} can now sign in.`, 'success');
      } else {
        await apiMutation('/invites', 'POST', {
          name: member.fullName,
          email: accessForm.email.trim(),
          role: accessForm.role,
          expiresInDays: 7,
          employeeId: member.id,
        });
        showToast('Invitation sent', `Access invitation emailed to ${accessForm.email.trim()}.`, 'success');
      }
    } catch (error) {
      showToast('Could not grant access', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const uploadDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!member || !canManage || !docFile) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append('documentType', docType);
      body.append('file', docFile);
      await apiMutation(`/employees/${encodeURIComponent(member.id)}/documents`, 'POST', body);
      const refreshed = await apiRequest<{ success: true; data: { data?: EmployeeDocumentRow[] } | EmployeeDocumentRow[] }>(
        `/employees/${encodeURIComponent(member.id)}/documents`,
        { suppressErrorNotification: true },
      );
      const payload = refreshed.data;
      setDocuments(Array.isArray(payload) ? payload : (payload.data ?? []));
      setDocFile(null);
      showToast('Document uploaded', 'The file was attached to this employment record.', 'success');
    } catch (error) {
      showToast('Upload failed', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const accessRoles = lookups.accessRoles.length ? lookups.accessRoles : ['teacher', 'principal', 'bursar', 'school_admin'];

  return (
    <>
      <ListPageLayout
        breadcrumb={[
          { label: 'People' },
          { label: 'Workforce', href: buildRoute('school.people.workforce') },
          { label: member?.fullName || 'Employee' },
        ]}
        title={member?.fullName || 'Employee profile'}
        description={member ? `${member.position || 'Staff'} · ${member.staffNo || 'No staff number'}` : 'Loading employment record…'}
        action={(
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(buildRoute('school.people.workforce'))}>
            Back to Workforce
          </Button>
        )}
      >
        {loading && <p className="p-6 text-sm text-[var(--color-text-secondary)]">Loading employee…</p>}
        {!loading && member && (
          <div className="grid gap-6 p-4 lg:grid-cols-2">
            <form onSubmit={saveEmployment} className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Employment</p>
              <FormField label="Full name"><Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} disabled={!canManage} /></FormField>
              <FormField label="Personal email"><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} disabled={!canManage} /></FormField>
              <FormField label="Phone"><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} disabled={!canManage} /></FormField>
              <p className="text-sm"><span className="font-semibold">Staff No.:</span> {member.staffNo || '—'}</p>
              <p className="text-sm"><span className="font-semibold">Employment Status:</span> {member.status}</p>
              <FormField label="Staff Category">
                <Select value={editForm.staffCategory} onChange={(e) => setEditForm({ ...editForm, staffCategory: e.target.value as '' | 'teaching' | 'non_teaching', positionId: '' })} disabled={!canManage}>
                  <option value="">—</option>
                  <option value="teaching">Teaching</option>
                  <option value="non_teaching">Non-Teaching</option>
                </Select>
              </FormField>
              <FormField label="Position">
                <div className="flex gap-2">
                  <Select className="flex-1" value={editForm.positionId} onChange={(e) => setEditForm({ ...editForm, positionId: e.target.value })} disabled={!canManage}>
                    <option value="">—</option>
                    {lookups.positions.filter((p) => !editForm.staffCategory || !p.category || p.category === editForm.staffCategory).map((position) => (
                      <option key={position.id} value={position.id}>{position.name}</option>
                    ))}
                  </Select>
                  {canManage && <Button type="button" variant="outline" onClick={() => setPositionModalOpen(true)}>New</Button>}
                </div>
              </FormField>
              <FormField label="Department">
                <Select value={editForm.departmentId} onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })} disabled={!canManage}>
                  <option value="">—</option>
                  {lookups.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Campus">
                <Select value={editForm.campusId} onChange={(e) => setEditForm({ ...editForm, campusId: e.target.value })} disabled={!canManage}>
                  <option value="">—</option>
                  {lookups.campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
                </Select>
              </FormField>
              {canManage && <Button type="submit">Save employment</Button>}
            </form>

            <div className="space-y-6">
              <div className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Login access</p>
                {member.linkedUserId ? (
                  <p className="text-sm">
                    Linked account on file.{' '}
                    <Link className="font-semibold text-[var(--color-action-primary)]" to={buildRoute('school.administration.users-access')}>Manage in Users</Link>
                  </p>
                ) : canManage ? (
                  <form onSubmit={grantAccess} className="space-y-3">
                    <FormField label="Method">
                      <Select value={accessForm.mode} onChange={(e) => setAccessForm({ ...accessForm, mode: e.target.value as AccessMode })}>
                        {canManageAccess && <option value="create_account">Create account now</option>}
                        <option value="send_invitation">Send invitation</option>
                      </Select>
                    </FormField>
                    <FormField label="Account email" required>
                      <Input required type="email" value={accessForm.email} onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })} />
                    </FormField>
                    <FormField label="Access role">
                      <Select value={accessForm.role} onChange={(e) => setAccessForm({ ...accessForm, role: e.target.value })}>
                        {accessRoles.map((role) => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
                      </Select>
                    </FormField>
                    {accessForm.mode === 'create_account' && (
                      <FormField label="Temporary password" required>
                        <Input required minLength={10} type="password" autoComplete="new-password" value={accessForm.temporaryPassword} onChange={(e) => setAccessForm({ ...accessForm, temporaryPassword: e.target.value })} />
                      </FormField>
                    )}
                    <Button type="submit" disabled={busy}>{busy ? 'Working…' : accessForm.mode === 'create_account' ? 'Link account' : 'Send invitation'}</Button>
                  </form>
                ) : (
                  <p className="text-sm">None</p>
                )}
              </div>

              {canManage && (
                <div className="space-y-3 rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Documents</p>
                  {documents.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">No documents uploaded yet.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {documents.map((doc) => (
                        <li key={String(doc.public_id ?? doc.id)}>
                          {(doc.documentType ?? doc.document_type) || 'Document'}: {(doc.originalName ?? doc.original_name) || 'file'}
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={uploadDocument} className="space-y-3">
                    <FormField label="Document type">
                      <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                        <option value="photo">Photo</option>
                        <option value="identity">Identity</option>
                        <option value="qualification">Qualification</option>
                        <option value="employment">Employment</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormField>
                    <FormField label="File">
                      <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                    </FormField>
                    <Button type="submit" disabled={busy || !docFile}>{busy ? 'Uploading…' : 'Upload document'}</Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </ListPageLayout>

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
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create position'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
