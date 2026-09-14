import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiRequest, describeApiError } from '../../lib/apiClient';

interface PermissionRow {
  name: string;
  description?: string | null;
}

interface AccessRoleRow {
  label: string;
  type: string;
  permissions?: string[];
}

/** Read-only permission inventory for delegable school capabilities. */
export const PermissionsCatalogView: React.FC = () => {
  const { showToast } = useApp();
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [roles, setRoles] = useState<AccessRoleRow[]>([]);

  useEffect(() => {
    apiRequest<{ success: true; data: { permissions: PermissionRow[]; roles: AccessRoleRow[] } }>('/school/access-catalog', { suppressErrorNotification: true })
      .then((response) => {
        setPermissions(response.data.permissions);
        setRoles(response.data.roles);
      })
      .catch((error) => showToast('Permissions', describeApiError(error), 'error'));
  }, []);

  const roleCoverage = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const role of roles) {
      for (const permission of role.permissions ?? []) {
        const current = map.get(permission) ?? [];
        current.push(role.label);
        map.set(permission, current);
      }
    }
    return map;
  }, [roles]);

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--color-text-secondary)]">
        Permissions you can grant on school roles. Assigned roles shows which of this school’s roles currently include each permission.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-bold">Permission</th>
              <th className="px-4 py-3 font-bold">Description</th>
              <th className="px-4 py-3 font-bold">Assigned Roles</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.name} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-800">{permission.name}</td>
                <td className="px-4 py-3 text-slate-600">{permission.description || '—'}</td>
                <td className="px-4 py-3">{(roleCoverage.get(permission.name) ?? []).join(', ') || '—'}</td>
              </tr>
            ))}
            {permissions.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No permissions loaded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
