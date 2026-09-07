import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  MailCheck,
  Search,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, DataTable, Drawer, FormField, Input, Modal, Select, StatusBadge, type Column } from '../../components/ui';
import { buildRoute } from '../../routing/builders';
import { getAdmissionApplication } from './api';
import type {
  AdmissionApplication,
  AdmissionApplicationInput,
  AdmissionConversionSummary,
  AdmissionFilters,
  AdmissionMetric,
  AdmissionPipelineStage,
  AdmissionsOverview,
  AdmissionsRequestState,
  AdmissionsSection,
} from './types';

const NAV_ITEMS: { section: AdmissionsSection; label: string; routeId: string }[] = [
  { section: 'overview', label: 'Overview', routeId: 'school.admissions' },
  { section: 'applications', label: 'Applications', routeId: 'school.admissions.applications' },
  { section: 'screening', label: 'Screening', routeId: 'school.admissions.screening' },
  { section: 'decisions', label: 'Decisions & Offers', routeId: 'school.admissions.decisions' },
  { section: 'enrolment', label: 'Enrolment', routeId: 'school.admissions.enrolment' },
  { section: 'settings', label: 'Settings', routeId: 'school.admissions.settings' },
];

export const AdmissionsContextNav: React.FC = () => (
  <nav aria-label="Admissions sections" className="overflow-x-auto border-b border-[var(--color-border-default)]">
    <ul className="flex min-w-max gap-1">
      {NAV_ITEMS.map((item) => (
        <li key={item.section}>
          <NavLink
            end={item.section === 'overview'}
            to={buildRoute(item.routeId)}
            className={({ isActive }) => `ds-focus-ring relative block rounded-t-[var(--radius-control)] px-3 py-3 text-sm font-semibold ${
              isActive ? 'text-[var(--color-action-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {({ isActive }) => <>{item.label}{isActive && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 bg-[var(--color-action-primary)]" />}</>}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export const admissionsStatusLabel = (status?: string) => {
  if (!status) return 'Unknown';
  return status.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
};

const METRIC_TONES = {
  information: 'bg-[var(--color-status-information-bg)] text-[var(--color-status-information-text)]',
  attention: 'bg-[var(--color-status-attention-bg)] text-[var(--color-status-attention-text)]',
  positive: 'bg-[var(--color-status-positive-bg)] text-[var(--color-status-positive-text)]',
} as const;

const MetricTile: React.FC<{
  label: string;
  metric?: AdmissionMetric;
  icon: React.ReactNode;
  state: AdmissionsRequestState;
  tone?: keyof typeof METRIC_TONES;
}> = ({ label, metric, icon, state, tone = 'information' }) => (
  <article className="min-h-24 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-text-primary)]">{state === 'loading' ? '—' : metric?.value ?? 0}</p>
      </div>
      <span className={`grid h-9 w-9 place-items-center rounded-[var(--radius-control)] ${METRIC_TONES[tone]}`} aria-hidden="true">{icon}</span>
    </div>
    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
      {state === 'error' ? 'Currently unavailable' : metric?.context || (metric?.changePercent != null ? `${metric.changePercent >= 0 ? '+' : ''}${metric.changePercent}% from prior period` : 'Current admissions cycle')}
    </p>
  </article>
);

export const AdmissionsMetrics: React.FC<{ metrics?: AdmissionsOverview['metrics']; state: AdmissionsRequestState }> = ({ metrics, state }) => (
  <section aria-label="Admissions metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <MetricTile label="Total Applications" metric={metrics?.totalApplications} icon={<FileText className="h-5 w-5" />} state={state} />
    <MetricTile label="Pending Screening" metric={metrics?.pendingScreening} icon={<ClipboardCheck className="h-5 w-5" />} state={state} tone="attention" />
    <MetricTile label="Offers Sent" metric={metrics?.offersSent} icon={<MailCheck className="h-5 w-5" />} state={state} />
    <MetricTile label="Enrolled" metric={metrics?.enrolled} icon={<GraduationCap className="h-5 w-5" />} state={state} tone="positive" />
  </section>
);

const PIPELINE_ROUTES: Record<string, string> = {
  applications: 'school.admissions.applications',
  screening: 'school.admissions.screening',
  decision: 'school.admissions.decisions',
  offer: 'school.admissions.decisions',
  enrolment: 'school.admissions.enrolment',
};

const PIPELINE_ICONS: Record<string, React.ReactNode> = {
  applications: <FileText className="h-4 w-4" />,
  screening: <ClipboardCheck className="h-4 w-4" />,
  decision: <Search className="h-4 w-4" />,
  offer: <MailCheck className="h-4 w-4" />,
  enrolment: <GraduationCap className="h-4 w-4" />,
};

export const AdmissionsPipeline: React.FC<{ stages: AdmissionPipelineStage[] }> = ({ stages }) => (
  <section className="rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]" aria-labelledby="admissions-pipeline-title">
    <h2 id="admissions-pipeline-title" className="text-sm font-bold text-[var(--color-text-primary)]">Admissions pipeline</h2>
    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Track applications through each lifecycle stage.</p>
    <ol className="mt-3 flex overflow-x-auto pb-1">
      {stages.map((stage, index) => {
        const routeId = PIPELINE_ROUTES[stage.key];
        const content = (
          <>
            <span className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
              <span className="grid h-7 w-7 place-items-center rounded-[var(--radius-control)] bg-[var(--color-surface-muted)] text-[var(--color-action-primary)]" aria-hidden="true">{PIPELINE_ICONS[stage.key]}</span>
              {stage.label}
            </span>
            <strong className="mt-2 block text-xl tabular-nums text-[var(--color-text-primary)]">{stage.count}</strong>
            {stage.context && <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{stage.context}</span>}
          </>
        );
        return <li key={`${stage.key}-${index}`} className="flex min-w-40 flex-1 items-center">
          {routeId ? <NavLink to={buildRoute(routeId)} className="ds-focus-ring block w-full rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-3 hover:bg-[var(--color-surface-muted)]">{content}</NavLink> : <div className="w-full rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-3">{content}</div>}
          {index < stages.length - 1 && <ChevronRight aria-hidden="true" className="mx-2 h-4 w-4 shrink-0 text-[var(--color-text-disabled)]" />}
        </li>;
      })}
    </ol>
  </section>
);

export const ApplicationsTrend: React.FC<{ points: AdmissionsOverview['trend'] }> = ({ points }) => (
  <section className="h-52 rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]" aria-labelledby="applications-trend-title">
    <h2 id="applications-trend-title" className="text-sm font-bold">Applications trend</h2>
    {points.length === 0 ? <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">No application trend is available for this period.</p> : (
      <div className="mt-3 h-36" role="img" aria-label="Applications received by month">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs><linearGradient id="admissionsTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-action-primary)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--color-action-primary)" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid stroke="var(--color-border-default)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip />
            <Area type="monotone" dataKey="applications" stroke="var(--color-action-primary)" fill="url(#admissionsTrendFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </section>
);

export const AdmissionsTasks: React.FC<{ tasks: AdmissionsOverview['tasks'] }> = ({ tasks }) => (
  <section className="rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]" aria-labelledby="admissions-tasks-title">
    <h2 id="admissions-tasks-title" className="text-sm font-bold">Upcoming tasks</h2>
    {tasks.length === 0 ? <p className="mt-4 text-sm text-[var(--color-text-secondary)]">There are no outstanding admissions tasks.</p> : <ul className="mt-3 divide-y divide-[var(--color-border-default)]">{tasks.map((task) => <li key={task.id} className="flex items-center gap-3 py-3"><CalendarClock className="h-4 w-4 text-[var(--color-action-primary)]" aria-hidden="true" /><span className="min-w-0 flex-1 text-sm">{task.label}</span><span className="text-xs text-[var(--color-text-secondary)]">{task.dueLabel || task.count}</span></li>)}</ul>}
  </section>
);

export const ConversionSummary: React.FC<{ conversion: AdmissionConversionSummary }> = ({ conversion }) => {
  const rows = [
    ['Applications received', conversion.applicationsReceived],
    ['Progressed to screening', conversion.progressedToScreening],
    ['Offers sent', conversion.offersSent],
    ['Enrolled', conversion.enrolled],
  ] as const;
  return <section className="rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]" aria-labelledby="conversion-title">
    <h2 id="conversion-title" className="text-sm font-bold">Conversion summary</h2>
    <dl className="mt-3 space-y-2">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-sm"><dt className="text-[var(--color-text-secondary)]">{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>)}</dl>
    <div className="mt-4 rounded-[var(--radius-control)] bg-[var(--color-status-positive-bg)] p-3 text-[var(--color-status-positive-text)]"><strong className="text-sm">{conversion.conversionRate}% conversion rate</strong>{conversion.changePercent != null && <span className="ml-2 text-xs">{conversion.changePercent >= 0 ? '+' : ''}{conversion.changePercent}%</span>}</div>
  </section>;
};

export const AdmissionsFilters: React.FC<{
  filters: AdmissionFilters;
  statuses: string[];
  classes: { id: string; name: string }[];
  onChange: (next: AdmissionFilters) => void;
}> = ({ filters, statuses, classes, onChange }) => (
  <div className="flex flex-col gap-3 border-b border-[var(--color-border-default)] p-4 lg:flex-row">
    <label className="relative min-w-60 flex-1">
      <span className="sr-only">Search applications</span>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input className="ds-field-control pl-9" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value, page: 1 })} placeholder="Search applicant or application number" />
    </label>
    <Select aria-label="Filter by status" className="lg:w-48" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value, page: 1 })}>
      <option value="ALL">All statuses</option>
      {statuses.map((status) => <option key={status} value={status}>{admissionsStatusLabel(status)}</option>)}
    </Select>
    <Select aria-label="Filter by class" className="lg:w-48" value={filters.classId} onChange={(event) => onChange({ ...filters, classId: event.target.value, page: 1 })}>
      <option value="ALL">All classes</option>
      {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
    </Select>
  </div>
);

export const QueueSummary: React.FC<{
  kind: 'screening' | 'decisions' | 'enrolment';
  applications: AdmissionApplication[];
  total: number;
}> = ({ kind, applications, total }) => {
  const definitions = kind === 'screening'
    ? [['Queue', total], ['Submitted on this page', applications.filter((item) => item.status === 'submitted').length], ['In screening on this page', applications.filter((item) => item.status === 'screening').length]]
    : kind === 'decisions'
      ? [['Decision queue', total], ['Offers on this page', applications.filter((item) => item.status === 'offered').length], ['Accepted on this page', applications.filter((item) => item.status === 'accepted').length]]
      : [['Awaiting on this page', applications.filter((item) => item.status === 'accepted').length], ['Enrolled on this page', applications.filter((item) => item.status === 'enrolled').length], ['Queue total', total]];
  return <section aria-label={`${kind} summary`} className="grid gap-3 sm:grid-cols-3">
    {definitions.map(([label, value]) => <article key={String(label)} className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4"><p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p></article>)}
  </section>;
};

export const ApplicationsTable: React.FC<{
  applications: AdmissionApplication[];
  state?: AdmissionsRequestState;
  error?: string | null;
  onRetry?: () => void;
  onOpen: (application: AdmissionApplication) => void;
  page?: number;
  total?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  filtered?: boolean;
  variant?: 'overview' | 'full';
  action?: (application: AdmissionApplication) => React.ReactNode;
}> = ({ applications, state = 'ready', error, onRetry, onOpen, page, total, perPage = 10, onPageChange, filtered, variant = 'full', action }) => {
  const columns = useMemo<Column<AdmissionApplication>[]>(() => [
    { key: 'applicant', header: 'Applicant', sortable: true, sortValue: (row) => row.applicantName, accessor: (row) => <span><strong className="block text-[var(--color-text-primary)]">{row.applicantName}</strong><span className="text-xs text-[var(--color-text-muted)]">{row.gender || 'Applicant'}</span></span> },
    { key: 'number', header: 'Application No.', accessor: (row) => row.applicationNumber || '—' },
    { key: 'class', header: 'Class Applied', sortable: true, sortValue: (row) => row.classApplied || '', accessor: (row) => row.classApplied || '—' },
    ...(variant === 'full' ? [
      { key: 'guardian', header: 'Guardian / Contact', accessor: (row: AdmissionApplication) => <span><span className="block">{row.guardianName || '—'}</span><span className="text-xs text-[var(--color-text-muted)]">{row.guardianPhone || row.guardianEmail || ''}</span></span> },
    ] : []),
    { key: 'stage', header: 'Stage', accessor: (row) => <StatusBadge status={admissionsStatusLabel(row.screeningStage || row.status)} /> },
    ...(variant === 'full' ? [
      { key: 'score', header: 'Score', accessor: (row: AdmissionApplication) => row.screeningScore == null ? '—' : `${row.screeningScore}%` },
    ] : []),
    { key: 'status', header: 'Status', sortable: true, sortValue: (row) => row.status, accessor: (row) => <StatusBadge status={admissionsStatusLabel(row.status)} /> },
    { key: 'submitted', header: 'Submitted', accessor: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '—' },
    ...(action ? [{ key: 'action', header: <span className="sr-only">Actions</span>, align: 'right' as const, accessor: action }] : []),
  ], [action, variant]);
  return <DataTable<AdmissionApplication> columns={columns} data={applications} keyExtractor={(row) => row.id} isLoading={state === 'loading'} error={state === 'error' ? error || 'Unable to load admissions records.' : undefined} onRetry={onRetry} page={page} totalItems={total} pageSize={perPage} onPageChange={onPageChange} onRowClick={onOpen} cardBreakpoint="lg" caption="Admissions applications matching the current filters" emptyTitle={filtered ? 'No matching applications' : 'No applications yet'} emptyDescription={filtered ? 'Try adjusting your search or filters.' : 'Applications will appear here once submitted.'} mobileRenderer={(row) => <button type="button" className="ds-focus-ring w-full p-4 text-left" onClick={() => onOpen(row)}><span className="flex items-start justify-between gap-3"><span className="min-w-0"><strong className="block truncate">{row.applicantName}</strong><span className="text-xs text-[var(--color-text-secondary)]">{row.applicationNumber || 'No application number'} · {row.classApplied || 'Class pending'}</span></span><StatusBadge status={admissionsStatusLabel(row.status)} /></span><span className="mt-3 block text-xs text-[var(--color-text-secondary)]">{admissionsStatusLabel(row.screeningStage) || 'No screening stage recorded'}{row.submittedAt ? ` · ${new Date(row.submittedAt).toLocaleDateString()}` : ''}</span></button>} />;
};

export const ApplicantDetails: React.FC<{ application: AdmissionApplication | null; onClose: () => void }> = ({ application, onClose }) => {
  const [details, setDetails] = useState<AdmissionApplication | null>(application);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setDetails(application);
    if (!application) return;
    const controller = new AbortController();
    setLoading(true);
    void getAdmissionApplication(application.id, controller.signal)
      .then((response) => setDetails(response.data))
      .catch(() => { /* Preserve the list projection when detail hydration fails. */ })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [application]);
  const record = details || application;
  return <Drawer isOpen={Boolean(application)} onClose={onClose} title={record?.applicantName} description={record?.applicationNumber || 'Admission application'}>
    {record && <div className="space-y-4 text-sm">
      {loading && <p role="status" className="text-xs text-[var(--color-text-secondary)]">Loading complete application…</p>}
      <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-4"><span className="text-[var(--color-text-secondary)]">Application status</span><StatusBadge status={admissionsStatusLabel(record.status)} /></div>
      <DetailGroup title="Application summary" rows={[['Class applied', record.classApplied], ['Submitted', record.submittedAt ? new Date(record.submittedAt).toLocaleString() : undefined], ['Date of birth', record.dateOfBirth], ['Gender', record.gender]]} />
      <DetailGroup title="Guardian and contact" rows={[['Guardian', record.guardianName], ['Phone', record.guardianPhone], ['Email', record.guardianEmail]]} />
      <DetailGroup title="Screening and decision" rows={[['Stage', record.screeningStage], ['Score', record.screeningScore == null ? undefined : `${record.screeningScore}%`], ['Decision', record.decision ? admissionsStatusLabel(record.decision) : undefined]]} />
      <DetailGroup title="Documents and enrolment" rows={[['Documents', record.documentCount == null ? undefined : String(record.documentCount)], ['Student profile', record.convertedStudentId || undefined]]} />
      {record.history && record.history.length > 0 && <section className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-4"><h3 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Activity</h3><ol className="mt-3 space-y-3">{record.history.map((item) => <li key={item.id} className="border-l-2 border-[var(--color-border-default)] pl-3"><p className="font-medium">{admissionsStatusLabel(item.toStatus)}</p><p className="text-xs text-[var(--color-text-secondary)]">{item.reason || 'Application status updated'}{item.changedAt ? ` · ${new Date(item.changedAt).toLocaleString()}` : ''}</p></li>)}</ol></section>}
    </div>}
  </Drawer>;
};

const DetailGroup: React.FC<{ title: string; rows: [string, string | undefined][] }> = ({ title, rows }) => <section className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-4"><h3 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{title}</h3><dl className="mt-3 space-y-2">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-[var(--color-text-muted)]">{label}</dt><dd className="text-right font-medium">{value || '—'}</dd></div>)}</dl></section>;

const EMPTY_APPLICATION: AdmissionApplicationInput = { firstName: '', lastName: '', requestedClassId: '', status: 'submitted', guardianName: '', guardianPhone: '', guardianEmail: '' };

export const ApplicationFormModal: React.FC<{ open: boolean; busy: boolean; classes: { id: string; name: string }[]; onClose: () => void; onSubmit: (input: AdmissionApplicationInput) => Promise<void> }> = ({ open, busy, classes, onClose, onSubmit }) => {
  const [form, setForm] = useState(EMPTY_APPLICATION);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(form);
    setForm(EMPTY_APPLICATION);
  };
  return <Modal isOpen={open} onClose={onClose} title="New Application" description="Create an application in the active school workspace."><form className="space-y-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><FormField label="First name" required><Input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></FormField><FormField label="Last name" required><Input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></FormField></div><FormField label="Class applied"><Select value={form.requestedClassId || ''} onChange={(event) => setForm({ ...form, requestedClassId: event.target.value || undefined })}><option value="">Select class</option>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}</Select></FormField><div className="grid gap-4 sm:grid-cols-2"><FormField label="Date of birth"><Input type="date" value={form.dateOfBirth || ''} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></FormField><FormField label="Gender"><Select value={form.gender || ''} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></Select></FormField></div><FormField label="Guardian name"><Input value={form.guardianName} onChange={(event) => setForm({ ...form, guardianName: event.target.value })} /></FormField><div className="grid gap-4 sm:grid-cols-2"><FormField label="Guardian phone"><Input type="tel" value={form.guardianPhone || ''} onChange={(event) => setForm({ ...form, guardianPhone: event.target.value })} /></FormField><FormField label="Guardian email"><Input type="email" value={form.guardianEmail || ''} onChange={(event) => setForm({ ...form, guardianEmail: event.target.value })} /></FormField></div><div className="flex justify-end gap-2 border-t border-[var(--color-border-default)] pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy}>Create Application</Button></div></form></Modal>;
};

export const QueueActionButton: React.FC<{ label: string; application: AdmissionApplication; onSelect: (application: AdmissionApplication) => void }> = ({ label, application, onSelect }) => <Button size="xs" variant="outline" onClick={(event) => { event.stopPropagation(); onSelect(application); }}>{label}</Button>;

