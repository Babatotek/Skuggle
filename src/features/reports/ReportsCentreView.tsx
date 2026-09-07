import React, { useEffect, useState } from 'react';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

interface ReportDef {
  id: string;
  title: string;
  description: string;
  group: string;
  formats: string[];
}

interface ReportsCentreViewProps {
  group?: string;
  title: string;
}

export const ReportsCentreView: React.FC<ReportsCentreViewProps> = ({ group, title }) => {
  const { showToast } = useApp();
  const [reports, setReports] = useState<ReportDef[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ success: true; data: ReportDef[] }>('/reports', { suppressErrorNotification: true })
      .then((response) => setReports(response.data))
      .catch((error) => showToast(title, describeApiError(error), 'error'));
  }, [title, showToast]);

  const visible = reports.filter((report) => !group || group === 'export' || group === 'custom' || report.group === group || (group === 'admissions' && report.group === 'student') || (group === 'operations' && report.group === 'academic') || (group === 'finance' && report.group === 'student') || (group === 'attendance' && report.id.includes('attendance')) || (group === 'staff' && report.group === 'student'));

  const run = async (report: ReportDef, format: string) => {
    setBusy(`${report.id}-${format}`);
    try {
      await apiMutation('/reports/jobs', 'POST', { reportId: report.id, format, filters: {} });
      showToast('Report queued', `${report.title} is generating.`, 'success');
    } catch (error) {
      showToast('Report failed', describeApiError(error), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visible.length === 0 && <p className="text-sm text-slate-500">No report templates in this group yet.</p>}
        {visible.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-display font-bold text-sm text-slate-900">{report.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{report.description}</p>
            <div className="flex gap-2 mt-3">
              {report.formats.map((format) => (
                <button
                  key={format}
                  type="button"
                  disabled={busy === `${report.id}-${format}`}
                  onClick={() => run(report, format)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 text-[11px] font-bold uppercase"
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
