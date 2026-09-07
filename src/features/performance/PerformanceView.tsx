import React, { useEffect, useState } from 'react';
import { apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

interface PerformanceViewProps {
  view: string;
  title: string;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ view, title }) => {
  const { showToast } = useApp();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    apiRequest<{ success: true; data: { rows?: Record<string, unknown>[]; summary?: Record<string, unknown> } }>(
      `/performance/${encodeURIComponent(view)}`,
      { suppressErrorNotification: true },
    )
      .then((response) => {
        setRows(response.data.rows ?? []);
        setSummary(response.data.summary ?? null);
      })
      .catch((error) => showToast(title, describeApiError(error), 'error'));
  }, [view, title, showToast]);

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{key}</p>
              <p className="font-display font-extrabold text-2xl text-slate-900 mt-1">{String(value ?? '—')}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              {Object.keys(rows[0] || { name: 'Name', averageScore: 'Average' }).map((key) => (
                <th key={key} className="p-3 font-bold capitalize">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td className="p-4 text-slate-500">No scored data yet.</td></tr>}
            {rows.map((row, index) => (
              <tr key={String(row.id || index)} className="border-t border-slate-100">
                {Object.values(row).map((value, valueIndex) => (
                  <td key={valueIndex} className="p-3 text-slate-700">{String(value ?? '—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
