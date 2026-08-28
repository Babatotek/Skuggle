import React, { useEffect, useState } from 'react';
import {
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Plus,
  Filter,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BroadcastMessage } from '../../types';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

export const BroadcastCenterView: React.FC = () => {
  const { branding, students, staff, showToast } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);

  // Hydrated from the tenant-scoped announcements endpoint.
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  /*
    {
      id: 'bc-1',
      title: 'First Term Midterm Break & Open Day Advisory',
      content:
        'Dear Parents and Guardians, please be informed that Midterm Break begins on Thursday 29th Oct. Open Day for student assessment review holds between 9:00 AM - 1:00 PM.',
      channels: ['sms', 'whatsapp', 'email', 'portal'],
      recipients: 'all_parents',
      recipientCount: 145,
      sentBy: 'Principal Office',
      sentAt: '2026-08-25 14:30',
      status: 'sent',
      category: 'PTA & Events',
      deliveredCount: 144,
    },
    {
      id: 'bc-2',
      title: 'Tuition Fee Clearance Notice for Terminal Examination',
      content:
        'Final reminder: All students must present an official digital clearance receipt before commencement of terminal exams on Monday. Kindly settle outstanding balances via the portal.',
      channels: ['whatsapp', 'sms'],
      recipients: 'debtors',
      recipientCount: 28,
      sentBy: 'Bursary Department',
      sentAt: '2026-08-24 10:15',
      status: 'sent',
      category: 'Fee Reminder',
      deliveredCount: 28,
    },
    {
      id: 'bc-3',
      title: 'Senior Secondary STEM Inter-School Robotics Competition',
      content:
        'Congratulations to the STEM Club for advancing to the state semi-finals! Special coaching resumes tomorrow at the ICT Innovation Lab by 3:30 PM.',
      channels: ['portal', 'email'],
      recipients: 'sss_parents',
      recipientCount: 65,
      sentBy: 'Mr. Emmanuel Okafor (Head of STEM)',
      sentAt: '2026-08-22 16:00',
      status: 'sent',
      category: 'Academic Notice',
      deliveredCount: 65,
    },
  */

  useEffect(() => {
    let active = true;
    apiRequest<{ success: true; data: { data: Array<Record<string, unknown>> } }>('/announcements?perPage=100', { suppressErrorNotification: true }).then((response) => {
      if (!active) return;
      setMessages(response.data.data.map((row) => ({ id: String(row.id), title: String(row.title), content: String(row.body), channels: ['portal'], recipients: 'all_parents', recipientCount: 0, sentBy: 'School', sentAt: String(row.publishedAt ?? row.createdAt ?? '').replace('T', ' ').slice(0, 16), status: String(row.status) === 'published' ? 'sent' : 'scheduled', category: 'Academic Notice', deliveredCount: 0 })));
    }).catch(() => { if (active) setMessages([]); });
    return () => { active = false; };
  }, []);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channels, setChannels] = useState<('sms' | 'whatsapp' | 'email' | 'portal')[]>([
    'sms',
    'whatsapp',
    'portal',
  ]);
  const [recipients, setRecipients] = useState<BroadcastMessage['recipients']>('all_parents');
  const [category, setCategory] = useState<BroadcastMessage['category']>('Academic Notice');

  const toggleChannel = (ch: 'sms' | 'whatsapp' | 'email' | 'portal') => {
    if (channels.includes(ch)) {
      if (channels.length > 1) {
        setChannels(channels.filter((c) => c !== ch));
      }
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const count =
      recipients === 'all_parents'
        ? students.length
        : recipients === 'all_staff'
        ? staff.length
        : 45;

    const newMsg: BroadcastMessage = {
      id: `bc-${Date.now()}`,
      title,
      content,
      channels,
      recipients,
      recipientCount: count,
      sentBy: 'School Administrator',
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'sent',
      category,
      deliveredCount: count,
    };

    try {
      const response = await apiMutation<{ success: true; data: Record<string, unknown> }>('/announcements', 'POST', { title, body: content, audience: [recipients], channels, status: 'published' });
      setMessages([{ ...newMsg, id: String(response.data.id) }, ...messages]);
      setShowComposeModal(false); setTitle(''); setContent('');
      showToast('Broadcast queued', `${Number(response.data.externalDeliveriesQueued || 0)} external delivery attempt(s) were queued alongside the portal announcement.`, 'success');
    } catch (error) { showToast('Broadcast failed', describeApiError(error), 'failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-slate-900">
              Parent & Staff Broadcast Center
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-100 text-sky-800">
              Multi-Channel Omnipresence
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Instant bulk messaging through WhatsApp, SMS gateway, email newsletters, and direct parent portal alerts.
          </p>
        </div>

        <button
          onClick={() => setShowComposeModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all self-start md:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>Compose New Broadcast</span>
        </button>
      </div>

      {/* Stats Pill Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">SMS / WhatsApp</div>
            <div className="text-xl font-display font-black text-slate-900">
              Multi-channel <span className="text-xs text-emerald-600 font-semibold">(Active)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">Registered Guardians</div>
            <div className="text-xl font-display font-black text-slate-900">
              {students.length} Verified Contacts
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">Total Broadcasts Sent</div>
            <div className="text-xl font-display font-black text-slate-900">
              {messages.length} Campaign{messages.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-display font-bold text-slate-900 text-base">
            Broadcast Activity History
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {messages.length} Dispatched Campaigns
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {messages.map((msg) => (
            <div key={msg.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      msg.category === 'Fee Reminder'
                        ? 'bg-amber-100 text-amber-800'
                        : msg.category === 'PTA & Events'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {msg.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{msg.title}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{msg.sentAt}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{msg.content}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-bold uppercase">Channels:</span>
                  <div className="flex items-center gap-1">
                    {msg.channels.map((ch) => (
                      <span
                        key={ch}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-500">
                  <span>Sent by: <strong className="text-slate-800">{msg.sentBy}</strong></span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {msg.deliveredCount} Delivered
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Compose Multi-Channel Broadcast
              </h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Announcement Subject</label>
                <input
                  type="text"
                  placeholder="e.g. End of Term Resumption & PTA General Assembly"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Audience</label>
                <select
                  value={recipients}
                  onChange={(e: any) => setRecipients(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                >
                  <option value="all_parents">All School Parents & Guardians ({students.length} contacts)</option>
                  <option value="all_staff">All Academic & Admin Staff ({staff.length} staff)</option>
                  <option value="jss_parents">Junior Secondary School Parents (JSS 1-3)</option>
                  <option value="sss_parents">Senior Secondary School Parents (SSS 1-3)</option>
                  <option value="debtors">Parents with Pending Fee Balances</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Message Content</label>
                <textarea
                  rows={4}
                  placeholder="Type your official announcement here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium leading-relaxed"
                />
                <div className="text-[11px] text-slate-400 text-right mt-1">
                  {content.length} characters • ~{Math.ceil((content.length || 1) / 160)} SMS pages
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Dispatch Channels</label>
                <div className="flex flex-wrap gap-2">
                  {(['sms', 'whatsapp', 'email', 'portal'] as const).map((ch) => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[11px] transition-all ${
                        channels.includes(ch)
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black shadow-md"
                >
                  Dispatch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
