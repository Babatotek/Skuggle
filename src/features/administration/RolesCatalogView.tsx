import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';
import { Button, ConfirmDialog, EmptyState, FormField, Input, Modal, Select } from '../../components/ui';

interface AccessRoleRow {
  id: string;
  name: string;
  label: string;
  description?: string | null;
  category?: string | null;
  type?: string;
  memberCount: number;
  permissions?: string[];
  templateKey?: string | null;
}

interface RoleTemplate {
  id: string;
  name: string;
  label: string;
  description?: string | null;
  category?: string | null;
}

interface CatalogPermission {
  name: string;
  description: string;
  domain?: string;
  delegable?: boolean;
}

const CATEGORIES = ['Administration', 'Academic Leadership', 'Teaching', 'Finance', 'Student Services', 'Operations', 'Custom'];

/** School-owned access roles — full CRUD for the tenant Super Admin. */
export const RolesCatalogView: React.FC = () => {
  const { showToast, currentRole } = useApp();
  const canManage = currentRole === 'Super Admin';
  const [rows, setRows] = useState<AccessRoleRow[]>([]);
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [permissions, setPermissions] = useState<CatalogPermission[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [open, setOpen] = useState(false);
  const [viewRole, setViewRole] = useState<AccessRoleRow | null>(null);
  const [editRole, setEditRole] = useState<AccessRoleRow | null>(null);
  const [deleteRole, setDeleteRole] = useState<AccessRoleRow | null>(null);
  const [menuRoleId, setMenuRoleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'Custom', templateKey: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '', category: 'Custom' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionFilter, setPermissionFilter] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  const load = () => {
    apiRequest<{
      success: true;
      data: {
        roles: AccessRoleRow[];
        templates?: RoleTemplate[];
        categories?: string[];
        permissions?: CatalogPermission[];
      };
    }>('/school/access-catalog', { suppressErrorNotification: true })
      .then((response) => {
        setRows((response.data.roles ?? []).filter((role) => Boolean(role.id)));
        setTemplates(response.data.templates ?? []);
        if (response.data.categories?.length) setCategories(response.data.categories);
        setPermissions(response.data.permissions ?? []);
      })
      .catch((error) => showToast('Roles', describeApiError(error), 'error'));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!menuRoleId) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuRoleId(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuRoleId(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuRoleId]);

  const createRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    setBusy(true);
    try {
      await apiMutation('/school/access-roles', 'POST', {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        templateKey: form.templateKey || null,
      });
      showToast('Role created', `${form.name} is ready for this school.`, 'success');
      setOpen(false);
      setForm({ name: '', description: '', category: 'Custom', templateKey: '' });
      load();
    } catch (error) {
      showToast('Could not create role', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const openViewer = (role: AccessRoleRow) => {
    setMenuRoleId(null);
    setViewRole(role);
  };

  const openEditor = (role: AccessRoleRow) => {
    setMenuRoleId(null);
    if (!canManage) {
      showToast('Cannot edit role', 'Only the school Super Admin can edit roles.', 'error');
      return;
    }
    setEditRole(role);
    setEditForm({
      name: role.label || role.name,
      description: role.description ?? '',
      category: role.category || 'Custom',
    });
    setSelectedPermissions([...(role.permissions ?? [])]);
    setPermissionFilter('');
  };

  const openDelete = (role: AccessRoleRow) => {
    setMenuRoleId(null);
    if (!canManage) {
      showToast('Cannot delete role', 'Only the school Super Admin can delete roles.', 'error');
      return;
    }
    setDeleteRole(role);
  };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || !editRole) return;
    setBusy(true);
    try {
      await apiMutation(`/school/access-roles/${encodeURIComponent(editRole.id)}`, 'PATCH', {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        category: editForm.category,
        permissions: selectedPermissions,
      });
      showToast('Role updated', `${editForm.name.trim()} was saved for this school.`, 'success');
      setEditRole(null);
      load();
    } catch (error) {
      showToast('Could not update role', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!canManage || !deleteRole) return;
    setBusy(true);
    try {
      await apiMutation(`/school/access-roles/${encodeURIComponent(deleteRole.id)}`, 'DELETE');
      showToast('Role deleted', `${deleteRole.label} was removed from this school.`, 'success');
      setDeleteRole(null);
      load();
    } catch (error) {
      showToast('Could not delete role', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const togglePermission = (name: string) => {
    setSelectedPermissions((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  };

  const permissionLabel = (name: string) => permissions.find((item) => item.name === name)?.description || name;

  const sorted = useMemo(() => [...rows].sort((a, b) => a.label.localeCompare(b.label)), [rows]);
  const filteredPermissions = useMemo(() => {
    const query = permissionFilter.trim().toLowerCase();
    if (!query) return permissions;
    return permissions.filter((item) => `${item.name} ${item.description} ${item.domain ?? ''}`.toLowerCase().includes(query));
  }, [permissions, permissionFilter]);
  const grouped = useMemo(() => {
    const groups = new Map<string, CatalogPermission[]>();
    filteredPermissions.forEach((item) => {
      const key = item.domain || 'general';
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPermissions]);
  const createTemplates = useMemo(
    () => templates.filter((item) => !['school_super_admin', 'student', 'parent'].includes(item.name)),
    [templates],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm text-[var(--color-text-secondary)]">
          Every school starts with the shared default roles (Teacher, Principal, and more). They belong to your tenant — edit or delete them, or create additional roles.
        </p>
        {canManage && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Create Role
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-bold">Role Name</th>
              <th className="px-4 py-3 font-bold">Description</th>
              <th className="px-4 py-3 font-bold">Members</th>
              <th className="px-4 py-3 font-bold">Permissions</th>
              <th className="px-4 py-3 font-bold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const menuOpen = menuRoleId === row.id;

              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{row.label}</td>
                  <td className="px-4 py-3 text-slate-600">{row.description || '—'}</td>
                  <td className="px-4 py-3">{row.memberCount}</td>
                  <td className="px-4 py-3">{row.permissions?.length ?? 0}</td>
                  <td className="relative px-4 py-3 text-right">
                    <div className="inline-flex" ref={menuOpen ? menuRef : undefined}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${row.label}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuRoleId(menuOpen ? null : row.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {menuOpen && (
                        <div
                          role="menu"
                          aria-label={`${row.label} actions`}
                          className="absolute right-4 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => openViewer(row)}
                          >
                            View
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => openEditor(row)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                onClick={() => openDelete(row)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <EmptyState
                    title="No school roles yet"
                    description="Create roles for this school — for example Academic Approver or Exam Coordinator — then assign them to users."
                    action={canManage ? {
                      label: 'Create Role',
                      onClick: () => setOpen(true),
                      icon: <Plus className="h-4 w-4" />,
                    } : undefined}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Role"
        description="This role belongs only to your school. Optionally start from a starter permission set."
      >
        <form onSubmit={createRole} className="space-y-4">
          <FormField label="Role Name" required>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Academic Approver" />
          </FormField>
          <FormField label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this access role is for" />
          </FormField>
          <FormField label="Role Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </Select>
          </FormField>
          <FormField label="Start from template">
            <Select value={form.templateKey} onChange={(e) => setForm({ ...form, templateKey: e.target.value })}>
              <option value="">Blank role</option>
              {createTemplates.map((template) => (
                <option key={template.name} value={template.name}>{template.label}</option>
              ))}
            </Select>
          </FormField>
          <p className="text-xs text-slate-500">Creating a role does not create a staff member. Assign it to users from Users after you set permissions.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create Role'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewRole)}
        onClose={() => setViewRole(null)}
        title={viewRole?.label ?? 'Role'}
        description="School access role details."
      >
        {viewRole && (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-400">Description</dt>
                <dd className="mt-1 text-slate-800">{viewRole.description || '—'}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-400">Members</dt>
                <dd className="mt-1 text-slate-800">{viewRole.memberCount}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-400">Category</dt>
                <dd className="mt-1 text-slate-800">{viewRole.category || '—'}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-400">Permissions</dt>
                <dd className="mt-1 text-slate-800">{viewRole.permissions?.length ?? 0}</dd>
              </div>
            </dl>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {(viewRole.permissions ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No permissions listed for this role.</p>
              ) : (
                (viewRole.permissions ?? []).map((name) => (
                  <div key={name} className="text-xs">
                    <p className="font-semibold text-slate-800">{name}</p>
                    <p className="text-slate-500">{permissionLabel(name)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2">
              {canManage && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setViewRole(null);
                    openEditor(viewRole);
                  }}
                >
                  Edit
                </Button>
              )}
              <Button type="button" onClick={() => setViewRole(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editRole)}
        onClose={() => setEditRole(null)}
        title={`Edit role — ${editRole?.label ?? ''}`}
        description="Update this school’s role details and permissions."
        size="lg"
      >
        {editRole && (
          <form onSubmit={saveRole} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Role Name" required>
                <Input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </FormField>
              <FormField label="Category">
                <Select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </Select>
              </FormField>
            </div>
            <FormField label="Description">
              <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </FormField>
            <FormField label="Filter permissions">
              <Input value={permissionFilter} onChange={(e) => setPermissionFilter(e.target.value)} placeholder="Search by name or domain" />
            </FormField>
            <p className="text-xs text-slate-500">{selectedPermissions.length} selected</p>
            <div className="max-h-80 space-y-4 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {grouped.map(([domain, items]) => (
                <div key={domain}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{domain}</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <label key={item.name} className="flex cursor-pointer items-start gap-2 text-xs">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={selectedPermissions.includes(item.name)}
                          onChange={() => togglePermission(item.name)}
                        />
                        <span>
                          <span className="block font-semibold text-slate-800">{item.name}</span>
                          <span className="block text-slate-500">{item.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {grouped.length === 0 && <p className="text-sm text-slate-500">No permissions match this filter.</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditRole(null)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save role'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteRole)}
        onClose={() => setDeleteRole(null)}
        onConfirm={confirmDelete}
        isLoading={busy}
        variant="danger"
        title="Delete role"
        confirmLabel="Delete role"
        message={
          deleteRole
            ? `Delete “${deleteRole.label}” from this school? Remove it from all users first if anyone is still assigned.`
            : null
        }
      />
    </div>
  );
};
