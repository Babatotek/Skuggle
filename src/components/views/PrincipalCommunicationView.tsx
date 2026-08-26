import React, { useState } from 'react';
import {
  Bell,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  ShieldAlert,
  Users,
  Building,
  FileText,
  Sparkles,
  Check,
  X,
  Radio,
  Share2
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface PrincipalCommunicationViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface BroadcastMessage {
  id: string;
  title: string;
  recipientGroup: string;
  channels: string[];
  sentAt: string;
  sentBy: string;
  deliveryRate: number;
  openRate: number;
  status: 'Delivered' | 'Scheduled' | 'Failed';
}

const PAST_BROADCASTS: BroadcastMessage[] = [
  {
    id: 'bc_1',
    title: 'Mid-Term Break & Remedial Clinic Schedule Announcement',
    recipientGroup: 'All Parents & Guardians (1,248)',
    channels: ['SMS', 'WhatsApp', 'Parent Portal'],
    sentAt: '18 Oct 2026, 09:00 AM',
    sentBy: 'Mrs. Adeyemi (Principal)',
    deliveryRate: 99.4,
    openRate: 94.8,
    status: 'Delivered'
  },
  {
    id: 'bc_2',
    title: 'PTA General Assembly & Infrastructure Development Levy Notice',
    recipientGroup: 'All Parents & Guardians',
    channels: ['Email', 'SMS', 'Portal'],
    sentAt: '14 Oct 2026, 04:30 PM',
    sentBy: 'Principal Office / PTA Exco',
    deliveryRate: 98.8,
    openRate: 91.2,
    status: 'Delivered'
  },
  {
    id: 'bc_3',
    title: 'Mandatory Staff Briefing: Examination Timetable & Invigilation Roster',
    recipientGroup: 'All Faculty & Academic Staff (58)',
    channels: ['Internal Memo', 'Email', 'SMS'],
    sentAt: '12 Oct 2026, 02:15 PM',
    sentBy: 'Principal & Vice Principal (Academics)',
    deliveryRate: 100.0,
    openRate: 100.0,
    status: 'Delivered'
  },
  {
    id: 'bc_4',
    title: 'Urgent Weather Advisory: Heavy Rainfall Dismissal Guidelines',
    recipientGroup: 'All Parents & School Bus Drivers',
    channels: ['SMS Broadcast', 'WhatsApp'],
    sentAt: '08 Oct 2026, 01:15 PM',
    sentBy: 'Principal Security Command',
    deliveryRate: 99.8,
    openRate: 98.5,
    status: 'Delivered'
  }
];

const TEMPLATES = [
  {
    title: 'Terminal Examination Commencement Notice',
    content: 'Dear Parents, First Term examinations commence on Monday, 24th November 2026. Please ensure all student clearance cards are retrieved from the Bursary desk. - Principal, Royal Gateway Academy.'
  },
  {
    title: 'PTA General Meeting Notice',
    content: 'Dear Valued Parents, The Termly PTA General Meeting is scheduled for Saturday, 15th November at 10:00 AM in the School Auditorium. Your presence is highly appreciated. - Management.'
  },
  {
    title: 'Outstanding Fee Arrears Reminder',
    content: 'Notice: This is a polite reminder to settle outstanding First Term school fees before Friday to avoid student exclusion from terminal exams. Thank you for your cooperation.'
  },
  {
    title: 'Inter-House Sports & Valedictory Announcement',
    content: 'Royal Gateway Academy invites all parents and esteemed alumni to our Annual Inter-House Sports Fiesta on Saturday, 5th December at the Main Sports Complex.'
  }
];

export const PrincipalCommunicationView: React.FC<PrincipalCommunicationViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'broadcast' | 'pta' | 'staff_memos' | 'sms_logs'>('broadcast');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Parents (1,248)');
  const [selectedChannels, setSelectedChannels] = useState<{ sms: boolean; whatsapp: boolean; email: boolean; portal: boolean }>({
    sms: true,
    whatsapp: true,
    email: true,
    portal: true
  });
const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) {
      feedbackBus.error('Please provide both a broadcast title and message body.');
      return;
    }
    feedbackBus.success(`Official broadcast "${broadcastTitle}" dispatched to ${targetAudience} across selected channels!`);
    setBroadcastTitle('');
    setBroadcastBody('');
  };

  const handleApplyTemplate = (tmpl: { title: string; content: string }) => {
    setBroadcastTitle(tmpl.title);
    setBroadcastBody(tmpl.content);
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Communication Centre</h1>
          <p className="text-sm text-slate-500 mt-1">Broadcast history, parent engagement metrics, and staff memos will appear once the school is launched and communication is sent.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Send className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No messages sent yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Complete school setup and launch the parent portal to start sending SMS broadcasts and announcements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px] uppercase tracking-wide">
              Executive Communication & Multi-Channel Broadcast
            </span>
            <span className="text-xs text-slate-400 font-medium">SMS Gateway Sender ID: ROYAL_GATE</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Communication Command, Broadcast Hub & PTA Liaison
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Instant multi-channel notifications (SMS, WhatsApp, Email, Mobile App), PTA feedback tickets, and faculty circulars.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              feedbackBus.success('EMERGENCY BROADCAST TRIGGERED: High-priority SMS & siren alert dispatched to all parents and staff.');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-200 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency Alert (1-Click)</span>
          </button>

          <button
            onClick={() => onOpenModal('onboarding_wizard')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose Direct Circular</span>
          </button>
        </div>
      </div>

      {/* 6 Executive Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Total Messages */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Messages Dispatched</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">32.6K</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              14.2k SMS • 18.4k Emails
            </p>
          </div>
        </div>

        {/* Card 2: Parent Portal Active */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Parent Engagement</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">94.8%</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              1,183 app active parents
            </p>
          </div>
        </div>

        {/* Card 3: Delivery Rate */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Delivery Rate</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">99.4%</p>
            <p className="text-[10.5px] text-purple-600 font-semibold mt-0.5">
              Telco gateway verified
            </p>
          </div>
        </div>

        {/* Card 4: SMS Units Balance */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">SMS Credit Balance</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-0.5">12,450</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              ₦3.20 per SMS unit
            </p>
          </div>
        </div>

        {/* Card 5: Open Rate */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Mean Read Rate</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">96.2%</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              Read within 2 hours
            </p>
          </div>
        </div>

        {/* Card 6: PTA Inquiries */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">PTA Tickets Resolved</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">48 / 52</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              92.3% resolution rate
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          id="tab-principal-comm-broadcast"
          onClick={() => setActiveSubTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'broadcast'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Multi-Channel Broadcast Hub</span>
        </button>

        <button
          id="tab-principal-comm-pta"
          onClick={() => setActiveSubTab('pta')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'pta'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>PTA Liaison & Parent Feedback</span>
        </button>

        <button
          id="tab-principal-comm-memos"
          onClick={() => setActiveSubTab('staff_memos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'staff_memos'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Internal Faculty & Staff Circulars</span>
        </button>

        <button
          id="tab-principal-comm-sms-logs"
          onClick={() => setActiveSubTab('sms_logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sms_logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Telco Gateway Delivery Logs</span>
        </button>
      </div>

      {/* SUB-TAB 1: MULTI-CHANNEL BROADCAST */}
      {activeSubTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Broadcast Composer */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Compose Executive School Broadcast</h3>
              <p className="text-xs text-slate-500">Dispatches instantly across SMS, WhatsApp Business API, Email, and Parent Portal Push.</p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Recipient Cohort</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All Parents (1,248)">All Parents & Guardians (1,248 Families)</option>
                  <option value="Senior Secondary Parents (SSS 1-3)">Senior Secondary Parents (SSS 1-3 • 636 Families)</option>
                  <option value="Junior Secondary Parents (JSS 1-3)">Junior Secondary Parents (JSS 1-3 • 612 Families)</option>
                  <option value="All Faculty & Staff (78)">All Faculty & Support Staff (78 Members)</option>
                  <option value="Fee Defaulters Watchlist">Fee Defaulters Watchlist (94 Accounts)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Broadcast Title / Subject</label>
                <input
                  type="text"
                  placeholder="e.g. End of First Term Valedictory Service & Result Portal Access"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Broadcast Message Body</label>
                  <span className="text-[11px] text-slate-400 font-medium">{broadcastBody.length} chars (~{Math.ceil((broadcastBody.length || 1) / 160)} SMS units)</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Type your official announcement here or choose a template from the right panel..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Delivery Channels Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Simultaneous Delivery Channels</label>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedChannels.sms}
                      onChange={(e) => setSelectedChannels({ ...selectedChannels, sms: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>SMS (Telco)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedChannels.whatsapp}
                      onChange={(e) => setSelectedChannels({ ...selectedChannels, whatsapp: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>WhatsApp API</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedChannels.email}
                      onChange={(e) => setSelectedChannels({ ...selectedChannels, email: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Official Email</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedChannels.portal}
                      onChange={(e) => setSelectedChannels({ ...selectedChannels, portal: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span>Parent Portal App Push</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastTitle('');
                    setBroadcastBody('');
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Mass Broadcast</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Pre-configured Templates */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Circular Templates</h3>
              <p className="text-xs text-slate-500">1-click insert for routine school communications.</p>
            </div>

            <div className="space-y-2.5">
              {TEMPLATES.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all cursor-pointer space-y-1 text-xs"
                >
                  <h4 className="font-bold text-slate-900">{tmpl.title}</h4>
                  <p className="text-slate-500 line-clamp-2 text-[11px]">{tmpl.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: PTA & PARENT FEEDBACK */}
      {activeSubTab === 'pta' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">PTA Executive Committee & Parent Suggestion Channel</h3>
              <p className="text-xs text-slate-500">Feedback and inquiry tickets submitted through Parent Portal app.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Request for Additional Mathematics Clinics for JSS 3 BECE Candidates</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">
                  Resolved & Implemented
                </span>
              </div>
              <p className="text-slate-600">Submitted by Engr. & Mrs. Okeke • Responded by Principal Office on 15 Oct 2026</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Enquiry regarding School Bus Route Extension to Ajah Phase 2</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10.5px]">
                  Under Logistics Review
                </span>
              </div>
              <p className="text-slate-600">Submitted by Dr. Fatima Bello • Assigned to Transport Officer</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INTERNAL STAFF MEMOS */}
      {activeSubTab === 'staff_memos' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Principal Memorandums & Faculty Circulars</h3>
              <p className="text-xs text-slate-500">Internal directives with automated digital acknowledgment and read receipts.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">MEMO/2026/042: Submission of First Term Continuous Assessment Ledgers</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">
                  58 / 58 Acknowledged (100%)
                </span>
              </div>
              <p className="text-slate-600">All subject tutors must ensure raw CA scores are finalized on SmartMark OMR by Friday, 31st October 2026.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">MEMO/2026/043: Mid-Term Staff Development Workshop on Digital Pedagogy</h4>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10.5px]">
                  56 / 58 Acknowledged (96.5%)
                </span>
              </div>
              <p className="text-slate-600">Attendance is mandatory for all teaching faculty at the Main ICT Suite.</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SMS LOGS */}
      {activeSubTab === 'sms_logs' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Telco SMS Delivery Ledger & Past Broadcasts</h3>
              <p className="text-xs text-slate-500">Live delivery reports across MTN, Airtel, Glo, and 9mobile gateways.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Broadcast Title</th>
                  <th className="py-3 px-3">Audience</th>
                  <th className="py-3 px-3">Channels</th>
                  <th className="py-3 px-3">Sent Timestamp</th>
                  <th className="py-3 px-3 text-center">Delivery Rate</th>
                  <th className="py-3 px-3 text-center">Open Rate</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {PAST_BROADCASTS.map((bc) => (
                  <tr key={bc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                      {bc.title}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {bc.recipientGroup}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {bc.channels.map((ch, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      {bc.sentAt}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      {bc.deliveryRate}%
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-purple-600">
                      {bc.openRate}%
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                        {bc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
