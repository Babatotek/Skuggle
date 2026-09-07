import React, { useEffect, useState } from 'react';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

interface Ticket {
  id: string;
  title: string;
  status: string;
  payload?: { body?: string };
  createdAt?: string;
}

export const HelpSupportView: React.FC = () => {
  const { showToast } = useApp();
  const [rows, setRows] = useState<Ticket[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    apiRequest<{ success: true; data: { data: Ticket[] } }>('/help/tickets', { suppressErrorNotification: true })
      .then((response) => setRows(response.data.data))
      .catch((error) => showToast('Help', describeApiError(error), 'error'));
  };

  useEffect(() => { load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiMutation('/help/tickets', 'POST', { title, body });
      setTitle('');
      setBody('');
      showToast('Ticket sent', 'Support will see this from your tenant workspace.', 'success');
      load();
    } catch (error) {
      showToast('Could not send', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <p className="text-xs text-slate-500">Open a ticket for this workspace. Do not include passwords or payment secrets.</p>
        <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Subject" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        <textarea required value={body} onChange={(event) => setBody(event.target.value)} placeholder="Describe the issue" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm min-h-28" />
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold">Send ticket</button>
      </form>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-2">
        {rows.length === 0 && <p className="text-sm text-slate-500">No tickets yet.</p>}
        {rows.map((row) => (
          <div key={row.id} className="border border-slate-100 rounded-xl p-3">
            <p className="text-sm font-semibold text-slate-800">{row.title} <span className="text-[11px] uppercase text-slate-500">{row.status}</span></p>
            <p className="text-xs text-slate-500 mt-1">{row.payload?.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
