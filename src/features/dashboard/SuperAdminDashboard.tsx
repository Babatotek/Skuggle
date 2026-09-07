import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, BellRing, Building2, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, FilePlus2, GraduationCap, Mail, MapPin, Megaphone, MoreHorizontal, Phone, ReceiptText, Settings, ShieldAlert, TrendingDown, TrendingUp, Trophy, UserCheck, UserRoundPlus, UsersRound, UserX, WalletCards } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';
import { BrandMark } from '../../components/BrandMark';
import { DashboardLoading } from '../../components/dashboard/DashboardPrimitives';
import { Button, EmptyState, StatusBadge } from '../../components/ui';
import { apiRequest } from '../../lib/apiClient';

interface Props { onNavigateTab: (tab: string) => void; }
interface Metric { id: string; label: string; display: string; delta: number | null; deltaLabel: string; }
interface Payload {
  schoolName?: string;
  metrics: Metric[];
  alerts: Array<{ id: string; label: string; count: number; hint: string; tab: string; enabled: boolean }>;
  attendanceOverview: Array<{ label: string; rate: number | null }>;
  feeOverview: { collected: { display: string; percent: number }; outstanding: { display: string; percent: number }; overdue: { display: string; percent: number }; totalDisplay: string };
  topClasses: Array<{ id?: string; class: string; averageScore: number; rank: number }>;
  studentsAtRisk: Array<{ id: string; name: string; class: string; riskLevel: string; trend: string }>;
  calendar: { events: Array<{ id: string; title: string; startsAt?: string; endsAt?: string }> };
  announcements: Array<{ id: string; title: string; publishedAt?: string }>;
  activity: Array<{ action: string; occurredAt?: string; resource?: string }>;
}

const surface = 'rounded-2xl border border-slate-200/80 bg-white shadow-xs';
const pieColors = ['#4f46e5', '#f59e0b', '#e11d48'];
const metricMeta = {
  students: { icon: GraduationCap, tone: 'bg-indigo-50 text-indigo-600', tab: 'students', link: 'View students' },
  staff: { icon: UsersRound, tone: 'bg-sky-50 text-sky-600', tab: 'people', link: 'View staff' },
  attendance: { icon: UserCheck, tone: 'bg-emerald-50 text-emerald-600', tab: 'attendance', link: 'View attendance' },
  fees: { icon: WalletCards, tone: 'bg-violet-50 text-violet-600', tab: 'finance', link: 'View finance' },
};
const alertIcons = { absent: UserX, invoices: ReceiptText, results: ClipboardCheck, risk: UserRoundPlus, admissions: FilePlus2, security: ShieldAlert };

function CardHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</span><h2 className="text-sm font-bold text-slate-950">{title}</h2></div>{action}</div>;
}
function dateParts(value?: string) {
  if (!value) return { month: 'TBD', day: '—', full: 'Date to be confirmed' };
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { month: '', day: '', full: value };
  return { month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(), day: date.toLocaleDateString(undefined, { day: '2-digit' }), full: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) };
}
function activityLabel(action: string) { return action.replaceAll('.', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function routineAuth(action: string) { const value = action.toLowerCase(); return value.includes('authentication') || value.includes('login') || value.includes('logout'); }

export const SuperAdminDashboard: React.FC<Props> = ({ onNavigateTab }) => {
  const { branding } = useApp();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; apiRequest<{ success: true; data: Payload }>('/dashboards/superadmin', { suppressErrorNotification: true }).then((result) => { if (active) setPayload(result.data); }).catch(() => { if (active) setError('Dashboard summary could not be loaded.'); }); return () => { active = false; }; }, []);
  const activity = useMemo(() => (payload?.activity ?? []).filter((item) => !routineAuth(item.action)).slice(0, 4), [payload?.activity]);
  if (!payload && !error) return <DashboardLoading />;

  const metrics = payload?.metrics ?? [];
  const primaryMetrics = metrics.filter((metric) => metric.id in metricMeta).slice(0, 4);
  const performance = metrics.find((metric) => metric.id === 'performance');
  const attendance = (payload?.attendanceOverview ?? []).map((row) => ({ ...row, rate: row.rate ?? 0 }));
  const latestAttendance = attendance.at(-1);
  const fees = payload ? [{ name: 'Collected', value: payload.feeOverview.collected.percent, display: payload.feeOverview.collected.display }, { name: 'Outstanding', value: payload.feeOverview.outstanding.percent, display: payload.feeOverview.outstanding.display }, { name: 'Overdue', value: payload.feeOverview.overdue.percent, display: payload.feeOverview.overdue.display }] : [];
  const schoolName = payload?.schoolName || branding.schoolName;
  const openAlerts = (payload?.alerts ?? []).filter((alert) => alert.count > 0).length;

  return <div className="mx-auto w-full max-w-[1720px] space-y-4">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-medium text-indigo-600">Good day</p><h1 className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-slate-950">{schoolName} Super Admin</h1><p className="mt-1 text-sm text-slate-500">Here’s what’s happening across your school today.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => onNavigateTab('administrators')} leftIcon={<UsersRound className="h-4 w-4" />}>Manage administrators</Button><Button variant="outline" size="sm" onClick={() => onNavigateTab('school-settings')} leftIcon={<Settings className="h-4 w-4" />}>School settings</Button><Button aria-label="More dashboard actions" variant="outline" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button></div>
    </header>

    <SkuggleAIBuddy variant="inline" contextHint={`${openAlerts || 'No'} operational ${openAlerts === 1 ? 'exception' : 'exceptions'} need attention. Review attendance, fees and result approvals from this command centre.`} onActionClick={() => onNavigateTab('ai-performance')} />
    {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><BellRing className="h-4 w-4" />{error}</div>}

    <section aria-label="School metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {primaryMetrics.map((metric) => { const meta = metricMeta[metric.id as keyof typeof metricMeta]; const Icon = meta.icon; return <button key={metric.id} type="button" onClick={() => onNavigateTab(meta.tab)} className={`${surface} group min-h-36 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md`}><div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meta.tone}`}><Icon className="h-5 w-5" /></span><MoreHorizontal className="h-4 w-4 text-slate-300" /></div><div className="mt-3 flex items-end gap-3"><div><p className="text-xs font-semibold text-slate-600">{metric.label}</p><p className="font-display text-2xl font-extrabold text-slate-950">{metric.display}</p></div>{metric.delta !== null && <span className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${metric.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{metric.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(metric.delta)}%</span>}</div><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5"><span className="text-[11px] text-slate-400">{metric.deltaLabel}</span><span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">{meta.link}<ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span></div></button>; })}
    </section>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <section className={`${surface} overflow-hidden xl:col-span-7`}>
        <CardHeader icon={<BellRing className="h-4 w-4" />} title="Alerts & pending actions" action={<div className="flex items-center gap-2">{openAlerts > 0 && <StatusBadge variant="danger">{openAlerts}</StatusBadge>}<Button variant="ghost" size="xs" onClick={() => onNavigateTab('reports')}>View all</Button></div>} />
        <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {(payload?.alerts ?? []).map((alert) => { const Icon = alertIcons[alert.id as keyof typeof alertIcons] || BellRing; const active = alert.count > 0; return <button key={alert.id} type="button" disabled={!alert.enabled} onClick={() => alert.enabled && onNavigateTab(alert.tab)} className={`group flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition-colors ${active ? 'border-amber-200 bg-amber-50/60 hover:bg-amber-50' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-60`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-white text-amber-600' : 'bg-white text-slate-400'}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-medium text-slate-500">{alert.label}</span><span className="font-display text-lg font-bold text-slate-950">{alert.count}</span><span className={`block truncate text-[10px] ${active ? 'text-amber-700' : 'text-emerald-600'}`}>{alert.hint}</span></span><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" /></button>; })}
        </div>
      </section>

      <section className={`${surface} overflow-hidden xl:col-span-5`}>
        <CardHeader icon={<Building2 className="h-4 w-4" />} title="School overview" action={<Button variant="outline" size="xs" onClick={() => onNavigateTab('school-profile')}>Edit profile</Button>} />
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_.9fr]">
          <div className="flex min-w-0 gap-3"><BrandMark variant="tenant" tenantName={schoolName} tenantLogoUrl={branding.logoUrl} showText={false} size="xl" /><div className="min-w-0"><h3 className="truncate font-display text-base font-bold text-slate-950">{schoolName}</h3><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{branding.schoolCode}</p><div className="mt-3 space-y-1.5 text-[11px] text-slate-600">{(branding.city || branding.state) && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" />{[branding.city, branding.state].filter(Boolean).join(', ')}</p>}{branding.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />{branding.email}</p>}{branding.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{branding.phone}</p>}</div><div className="mt-3 flex items-center gap-3"><StatusBadge variant={branding.isPublished ? 'success' : 'neutral'}>{branding.isPublished ? 'Active' : 'Draft'}</StatusBadge><button className="text-[11px] font-semibold text-indigo-600" onClick={() => onNavigateTab('school-profile')}>View full profile →</button></div></div></div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3"><div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-700"><CalendarDays className="h-4 w-4" />Current academic session</div><p className="mt-3 font-display text-xl font-bold text-indigo-950">{branding.academicSession}</p><p className="mt-1 text-xs font-medium text-slate-700">{branding.currentTerm}</p><Button className="mt-4 w-full" variant="outline" size="xs" onClick={() => onNavigateTab('sessions')}>Manage academic year</Button></div>
        </div>
      </section>
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className={`${surface} overflow-hidden`}><CardHeader icon={<UserCheck className="h-4 w-4" />} title="Attendance trend" action={<span className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500">Last 6 days</span>} /><div className="p-4"><div className="flex items-baseline gap-2"><p className="font-display text-xl font-bold text-slate-950">{latestAttendance ? `${latestAttendance.rate}%` : '—'}</p><span className="text-[11px] text-slate-500">latest recorded rate</span></div><div className="mt-2 h-40"><ResponsiveContainer width="100%" height="100%"><AreaChart data={attendance} margin={{ left: -22, right: 4 }}><defs><linearGradient id="adminAttendance" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6366f1" stopOpacity={0.25} /><stop offset="1" stopColor="#6366f1" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} /><Tooltip /><Area dataKey="rate" type="monotone" stroke="#4f46e5" strokeWidth={2} fill="url(#adminAttendance)" /></AreaChart></ResponsiveContainer></div><Button variant="ghost" size="xs" onClick={() => onNavigateTab('attendance')} rightIcon={<ArrowRight className="h-3 w-3" />}>View details</Button></div></section>

      <section className={`${surface} overflow-hidden`}><CardHeader icon={<WalletCards className="h-4 w-4" />} title="Fee collection" action={<span className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500">All records</span>} /><div className="p-4"><p className="font-display text-xl font-bold text-slate-950">{payload?.feeOverview.collected.display ?? '₦0'}</p><p className="text-[11px] text-slate-500">Collected ({payload?.feeOverview.collected.percent ?? 0}% of recorded fees)</p><div className="mt-2 grid grid-cols-[145px_1fr] items-center"><div className="h-40"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={fees} dataKey="value" innerRadius={42} outerRadius={58} paddingAngle={2}>{fees.map((item, index) => <Cell key={item.name} fill={pieColors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="space-y-2">{fees.map((item, index) => <div key={item.name} className="flex items-center justify-between gap-3 text-[11px]"><span className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors[index] }} />{item.name}</span><span className="font-semibold text-slate-800">{item.display}</span></div>)}</div></div><Button variant="ghost" size="xs" onClick={() => onNavigateTab('finance')} rightIcon={<ArrowRight className="h-3 w-3" />}>View finance</Button></div></section>

      <section className={`${surface} overflow-hidden`}><CardHeader icon={<Trophy className="h-4 w-4" />} title="Top performing classes" action={<Button variant="ghost" size="xs" onClick={() => onNavigateTab('class-performance')}>View all</Button>} />{(payload?.topClasses ?? []).length === 0 ? <EmptyState title="No rankings yet" description="Class rankings appear after scored assessments." className="m-4 p-6 sm:p-6" /> : <div className="overflow-x-auto"><table className="w-full text-[11px]"><thead><tr className="bg-slate-50 text-left text-slate-500"><th className="px-4 py-2.5 font-semibold">Class</th><th className="px-4 py-2.5 font-semibold">Average</th><th className="px-4 py-2.5 text-center font-semibold">Rank</th></tr></thead><tbody>{payload?.topClasses.slice(0, 5).map((row) => <tr key={row.id || `${row.class}-${row.rank}`} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-slate-800">{row.class}</td><td className="px-4 py-3">{row.averageScore}%</td><td className="px-4 py-3 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 font-bold text-amber-700">{row.rank}</span></td></tr>)}</tbody></table></div>}{performance && <div className="border-t border-slate-100 bg-indigo-50/50 px-4 py-2.5 text-[11px] text-indigo-800">School average: <strong>{performance.display}</strong></div>}</section>
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className={`${surface} overflow-hidden`}><CardHeader icon={<CalendarDays className="h-4 w-4" />} title="Upcoming events" action={<Button variant="ghost" size="xs" onClick={() => onNavigateTab('academic-calendar')}>View calendar</Button>} /><div className="divide-y divide-slate-100 px-4">{(payload?.calendar.events ?? []).length === 0 && <p className="py-5 text-xs text-slate-500">No events scheduled.</p>}{payload?.calendar.events.slice(0, 3).map((event) => { const date = dateParts(event.startsAt); return <div key={event.id} className="flex items-center gap-3 py-3"><span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><span className="text-[8px] font-bold">{date.month}</span><span className="font-display text-sm font-bold leading-none">{date.day}</span></span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-900">{event.title}</span><span className="text-[10px] text-slate-400">{date.full}</span></span></div>; })}</div></section>
      <section className={`${surface} overflow-hidden`}><CardHeader icon={<Megaphone className="h-4 w-4" />} title="Recent announcements" action={<Button variant="ghost" size="xs" onClick={() => onNavigateTab('announcements')}>View all</Button>} /><div className="divide-y divide-slate-100 px-4">{(payload?.announcements ?? []).length === 0 && <p className="py-5 text-xs text-slate-500">No announcements yet.</p>}{payload?.announcements.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => onNavigateTab('announcements')} className="flex w-full items-center gap-3 py-3 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Megaphone className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-900">{item.title}</span>{item.publishedAt && <span className="text-[10px] text-slate-400">{dateParts(item.publishedAt).full}</span>}</span><StatusBadge variant="indigo" showDot={false}>New</StatusBadge></button>)}</div></section>
      <section className={`${surface} overflow-hidden`}><CardHeader icon={<CheckCircle2 className="h-4 w-4" />} title="Recent activity" action={<Button variant="ghost" size="xs" onClick={() => onNavigateTab('audit-logs')}>View all</Button>} /><div className="divide-y divide-slate-100 px-4">{activity.length === 0 && <p className="py-5 text-xs text-slate-500">No recent operational activity. Routine authentication events remain in Audit Logs.</p>}{activity.map((item, index) => <div key={`${item.action}-${index}`} className="flex items-center gap-3 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-700">{activityLabel(item.action)}</span>{item.resource && <span className="text-[10px] text-slate-400">{item.resource}</span>}</span>{item.occurredAt && <span className="text-[10px] text-slate-400">{new Date(item.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}</div>)}</div></section>
    </div>
  </div>;
};
