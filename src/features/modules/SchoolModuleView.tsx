import React, { useEffect, useMemo, useState } from 'react';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required?: boolean;
}

interface ModuleDefinition {
  label: string;
  statuses: string[];
  fields: FieldDef[];
}

interface RecordRow {
  id: string;
  title: string;
  status: string;
  payload: Record<string, string>;
  createdAt?: string;
}

interface SchoolModuleViewProps {
  moduleKey: string;
}

export const SchoolModuleView: React.FC<SchoolModuleViewProps> = ({ moduleKey }) => {
  const { showToast } = useApp();
  const [definition, setDefinition] = useState<ModuleDefinition | null>(null);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ title: '', status: '' });

  const load = () => {
    apiRequest<{ success: true; data: { definition: ModuleDefinition; data: RecordRow[]; meta: { total: number } } }>(
      `/school-modules/${encodeURIComponent(moduleKey)}`,
      { suppressErrorNotification: true },
    )
      .then((response) => {
        setDefinition(response.data.definition);
        setRows(response.data.data);
        setTotal(response.data.meta.total);
        setForm((current) => ({ ...current, status: current.status || response.data.definition.statuses[0] || 'active' }));
      })
      .catch((error) => showToast('Module', describeApiError(error), 'error'));
  };

  useEffect(() => {
    load();
  }, [moduleKey]);

  const titleField = definition?.fields[0]?.key;
  const canSubmit = useMemo(() => {
    const title = form.title || (titleField ? form[titleField] : '');
    return Boolean(title);
  }, [form, titleField]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!definition) return;
    setBusy(true);
    const payload: Record<string, string> = {};
    definition.fields.forEach((field) => {
      payload[field.key] = form[field.key] || '';
    });
    try {
      await apiMutation(`/school-modules/${encodeURIComponent(moduleKey)}`, 'POST', {
        title: form.title || payload[titleField || ''] || 'Untitled',
        status: form.status || definition.statuses[0],
        payload,
      });
      setForm({ title: '', status: definition.statuses[0] });
      showToast('Saved', `${definition.label} record created.`, 'success');
      load();
    } catch (error) {
      showToast('Could not save', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-slate-900">Add record</h2>
          <p className="text-[11px] text-slate-400">{total} on file</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            value={form.title || ''}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Title"
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
          {definition?.fields.map((field) => (
            field.type === 'textarea' ? (
              <textarea
                key={field.key}
                value={form[field.key] || ''}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                placeholder={field.label}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm sm:col-span-2"
              />
            ) : (
              <input
                key={field.key}
                type={field.type === 'date' ? 'date' : 'text'}
                value={form[field.key] || ''}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                placeholder={field.label}
                required={field.required}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            )
          ))}
          <select
            value={form.status || ''}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            {(definition?.statuses ?? ['active']).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={busy || !canSubmit} className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold disabled:opacity-50">
          {busy ? 'Saving…' : 'Save record'}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-3 font-bold">Title</th>
              <th className="p-3 font-bold">Status</th>
              <th className="p-3 font-bold">Details</th>
              <th className="p-3 font-bold">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-700">No records yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">Create the first record using the form above.</p>
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3 font-semibold text-slate-800">{row.title}</td>
                <td className="p-3">
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 capitalize text-[11px] font-semibold">{row.status}</span>
                </td>
                <td className="p-3 text-slate-600">{Object.values(row.payload || {}).filter(Boolean).slice(0, 4).join(' · ')}</td>
                <td className="p-3 text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
