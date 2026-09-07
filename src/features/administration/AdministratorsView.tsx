import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

interface MembershipRow {
  id: number;
  status: string;
  role: string;
  roleLabel: string;
  privileged: boolean;
  user: { id: string; name: string; email: string; status: string };
}

export const AdministratorsView: React.FC = () => {
  const { showToast, currentUser } = useApp();
  const canManageRoles = (currentUser.permissions ?? []).includes('roles.manage');
  const [rows, setRows] = useState<MembershipRow[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    apiRequest<{ success: true; data: { data: MembershipRow[] } }>('/school/memberships', { suppressErrorNotification: true })
      .then((response) => setRows(response.data.data))
      .catch((error) => showToast('Administrators', describeApiError(error), 'error'));
  };

  useEffect(() => {
    load();
  }, []);

  const createOfficer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageRoles) return;
    setBusy(true);
    try {
      await apiMutation('/school/memberships', 'POST', {
        name,
        email,
        password,
        role: 'school_admin',
      });
      setName('');
      setEmail('');
      setPassword('');
      showToast('School Admin created', 'The officer can sign in with the email and password you set.', 'success');
      load();
    } catch (error) {
      showToast('Could not create admin', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const suspend = async (row: MembershipRow) => {
    if (!canManageRoles || row.role === 'school_super_admin') return;
    try {
      await apiMutation(`/school/memberships/${row.id}`, 'PATCH', { status: row.status === 'active' ? 'suspended' : 'active' });
      load();
    } catch (error) {
      showToast('Update failed', describeApiError(error), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h1 className="font-display font-extrabold text-xl text-slate-900">Administrators</h1>
        <p className="text-xs text-slate-500 mt-1">
          Super Admin governs this school tenant. School Admin officers receive only delegated day-to-day permissions.
        </p>
      </div>

      {canManageRoles && (
        <form onSubmit={createOfficer} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
          <h2 className="font-display font-bold text-sm text-slate-900">Create School Admin officer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input required minLength={8} type="password" name="new-admin-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password" className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
          <button type="submit" disabled={busy} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
            {busy ? 'Saving…' : 'Create School Admin'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">Role</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-800">{row.user.name}</td>
                <td className="px-4 py-3">{row.user.email}</td>
                <td className="px-4 py-3">{row.roleLabel}</td>
                <td className="px-4 py-3 capitalize">{row.status}</td>
                <td className="px-4 py-3 text-right">
                  {canManageRoles && row.role !== 'school_super_admin' && (
                    <button type="button" onClick={() => void suspend(row)} className="text-indigo-700 font-bold">
                      {row.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
