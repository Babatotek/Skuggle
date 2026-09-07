import React, { useEffect, useState } from 'react';
import { apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

interface LibraryRow {
  id?: string;
  public_id?: string;
  title?: string;
  name?: string;
  status?: string;
  resourceType?: string;
}

export const LearningResourcesView: React.FC<{ title?: string }> = ({ title = 'Learning Resources' }) => {
  const { showToast } = useApp();
  const [rows, setRows] = useState<LibraryRow[]>([]);

  useEffect(() => {
    apiRequest<{ success: true; data: { data?: LibraryRow[] } | LibraryRow[] }>('/library/resources', { suppressErrorNotification: true })
      .then((response) => {
        const payload = response.data;
        setRows(Array.isArray(payload) ? payload : payload.data ?? []);
      })
      .catch((error) => showToast(title, describeApiError(error), 'error'));
  }, [title, showToast]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-3 font-bold">Title</th>
              <th className="p-3 font-bold">Type</th>
              <th className="p-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="p-4 text-slate-500">No library resources yet.</td></tr>}
            {rows.map((row) => (
              <tr key={row.id || row.public_id || row.title} className="border-t border-slate-100">
                <td className="p-3 font-semibold">{row.title || row.name || 'Untitled'}</td>
                <td className="p-3">{row.resourceType || '—'}</td>
                <td className="p-3">{row.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
