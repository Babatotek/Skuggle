import React, { useEffect, useState } from 'react';
import { apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

interface AuditRow {
  id: number;
  action: string;
  resource?: string;
  occurredAt?: string;
}

export const AuditLogsView: React.FC = () => {
  const { showToast } = useApp();
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    apiRequest<{ success: true; data: { data: AuditRow[] } }>('/audit-logs', { suppressErrorNotification: true })
      .then((response) => setRows(response.data.data))
      .catch((error) => showToast('Audit logs', describeApiError(error), 'error'));
  }, [showToast]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h1 className="font-display font-extrabold text-xl text-slate-900">Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">Immutable tenant activity. Records cannot be deleted from this screen.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-3 font-bold">When</th>
              <th className="p-3 font-bold">Action</th>
              <th className="p-3 font-bold">Resource</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="p-4 text-slate-500">No audited activity yet.</td></tr>}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="p-3">{row.occurredAt ? new Date(row.occurredAt).toLocaleString() : '—'}</td>
                <td className="p-3 font-semibold">{row.action}</td>
                <td className="p-3">{row.resource || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
