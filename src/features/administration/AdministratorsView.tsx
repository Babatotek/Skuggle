import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';
import { buildRoute } from '../../routing/builders';
import { Button, ConfirmDialog } from '../../components/ui';

interface LinkedProfile {
  id: string;
  type: 'workforce' | 'student' | 'guardian';
  label: string;
}

interface MembershipRow {
  id: number;
  status: string;
  role: string;
  roleLabel: string;
  privileged: boolean;
  accountType?: string;
  linkedProfile?: LinkedProfile | null;
  accessRoles?: Array<{ name?: string; label?: string }>;
  user: { id: string; name: string; email: string; status: string; lastAccess?: string | null };
}

const formatAccess = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

/** Users directory — login identities only. Employment belongs in Workforce. */
export const AdministratorsView: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { showToast, currentUser, currentRole } = useApp();
  const canManageAccess = currentRole === 'Super Admin' && (currentUser.permissions ?? []).includes('roles.manage');
  const [rows, setRows] = useState<MembershipRow[]>([]);
  const [pending, setPending] = useState<MembershipRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    apiRequest<{ success: true; data: { data: MembershipRow[] } }>('/school/memberships', { suppressErrorNotification: true })
      .then((response) => setRows(response.data.data))
      .catch((error) => showToast('Users', describeApiError(error), 'error'));
  };

  useEffect(() => {
    load();
  }, []);

  const confirmToggleAccess = async () => {
    if (!pending || !canManageAccess) return;
    setBusy(true);
    try {
      const next = pending.status === 'active' ? 'suspended' : 'active';
      await apiMutation(`/school/memberships/${pending.id}`, 'PATCH', { status: next });
      showToast(
        next === 'suspended' ? 'Account access suspended' : 'Account access restored',
        `${pending.user.name}'s login access is now ${next}. Employment status was not changed.`,
        'success',
      );
      setPending(null);
      load();
    } catch (error) {
      showToast('Update failed', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const assignedRoles = (row: MembershipRow) => {
    const labels = (row.accessRoles ?? []).map((item) => item.label || item.name).filter(Boolean);
    if (labels.length) return labels.join(', ');
    return row.roleLabel || row.role || '—';
  };

  const sorted = useMemo(() => [...rows].sort((a, b) => a.user.name.localeCompare(b.user.name)), [rows]);

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h1 className="font-display text-xl font-extrabold text-slate-900">Users</h1>
          <p className="mt-1 text-xs text-slate-500">Manage accounts that can access Skuggle. Employment records live under People → Workforce.</p>
        </div>
      )}

      {embedded && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Login identities for this school. Staff employment is managed in{' '}
          <Link className="font-semibold text-[var(--color-action-primary)]" to={buildRoute('school.people.workforce')}>Workforce</Link>.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-bold">User</th>
              <th className="px-4 py-3 font-bold">Account Type</th>
              <th className="px-4 py-3 font-bold">Linked Profile</th>
              <th className="px-4 py-3 font-bold">Assigned Role(s)</th>
              <th className="px-4 py-3 font-bold">Last Access</th>
              <th className="px-4 py-3 font-bold">Account Status</th>
              <th className="px-4 py-3 font-bold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <span className="block font-semibold text-slate-800">{row.user.name}</span>
                  <span className="block text-slate-500">{row.user.email}</span>
                </td>
                <td className="px-4 py-3">{row.accountType || 'School account'}</td>
                <td className="px-4 py-3">
                  {row.linkedProfile ? (
                    <span className="block">
                      <span className="block">{row.linkedProfile.label}</span>
                      {row.linkedProfile.type === 'workforce' && (
                        <Link
                          className="font-semibold text-indigo-700"
                          to={buildRoute('school.people.workforce.profile', { employeePublicId: row.linkedProfile.id })}
                        >
                          View Workforce Profile
                        </Link>
                      )}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">{assignedRoles(row)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatAccess(row.user.lastAccess)}</td>
                <td className="px-4 py-3 capitalize">{row.status}</td>
                <td className="px-4 py-3 text-right">
                  {canManageAccess && row.role !== 'school_super_admin' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPending(row)}
                    >
                      {row.status === 'active' ? 'Suspend access' : 'Restore access'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No login accounts found for this school.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={confirmToggleAccess}
        isLoading={busy}
        variant="warning"
        title={pending?.status === 'active' ? 'Suspend account access' : 'Restore account access'}
        confirmLabel={pending?.status === 'active' ? 'Suspend access' : 'Restore access'}
        message={
          pending?.status === 'active'
            ? `Suspend login access for ${pending.user.name}? This does not change their Workforce employment status.`
            : `Restore login access for ${pending?.user.name}? Employment status is unchanged.`
        }
      />
    </div>
  );
};
