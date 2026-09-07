import React, { useEffect, useState } from 'react';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

interface MessageRow {
  id: string;
  body: string;
  createdAt?: string;
  sender?: { name?: string };
}

export const MessagesView: React.FC<{ title: string; audience?: string }> = ({ title, audience }) => {
  const { showToast } = useApp();
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<{ success: true; data: { data: MessageRow[] } }>('/messages', { suppressErrorNotification: true })
      .then((response) => setRows(response.data.data))
      .catch((error) => showToast(title, describeApiError(error), 'error'));
  }, [title, showToast, audience]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiMutation('/messages', 'POST', { recipient_id: recipientId, body });
      setBody('');
      showToast('Sent', 'Message delivered inside this tenant.', 'success');
    } catch (error) {
      showToast('Could not send', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <input required value={recipientId} onChange={(event) => setRecipientId(event.target.value)} placeholder="Recipient public id" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        <textarea required value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm min-h-24" />
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold">Send</button>
      </form>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-2">
        {rows.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
        {rows.map((row) => (
          <div key={row.id} className="border border-slate-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-800">{row.sender?.name || 'Unknown'}</p>
            <p className="text-sm text-slate-600 mt-1">{row.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
