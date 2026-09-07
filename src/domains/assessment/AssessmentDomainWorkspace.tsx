import React, { lazy, Suspense, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, ClipboardList, FileText, LayoutDashboard, PenLine, Plus, Settings, Upload } from 'lucide-react';
import { Button, EmptyState, StatusBadge } from '../../components/ui';
import { WorkspaceLandingLayout } from '../../layouts/WorkspaceLandingLayout';
import { buildRoute } from '../../routing/builders';
import type { CanonicalRouteDefinition } from '../../routing/types';
import { useAccess, useAcademicContext, useWorkspace } from '../../state/ApplicationStateProviders';
import { get, mutate, queryString, useAssessmentQuery } from './api';
import { AssessmentTable, Coverage, Metrics, Pagination, Panel, QueryState, Trend, Upcoming, ViewAll, Workflow, WorkList, assessmentHref, shortDate } from './components';
import type { Assessment, Lookups, Overview, Page } from './types';
import { ASSESSMENT_TYPES, label } from './types';
import './assessment.css';

const AssessmentForm = lazy(() => import('./AssessmentForm'));
const QuestionBank = lazy(() => import('./QuestionBank'));
const AssessmentDetail = lazy(() => import('./AssessmentDetail'));
const SmartMarkReview = lazy(() => import('./SmartMarkReview'));
const OnlineAssessments = lazy(() => import('./OnlineAssessments'));
const destinations = [
  ['school.assessment', 'Overview', LayoutDashboard], ['school.assessment.assessments', 'Assessments', FileText],
  ['school.assessment.question-bank', 'Question Bank', ClipboardList], ['school.assessment.exam-schedule', 'Exam Schedule', CalendarDays],
  ['school.assessment.marking', 'Marking & Moderation', PenLine], ['school.assessment.settings', 'Settings', Settings],
] as const;

export default function AssessmentDomainWorkspace({ route, assessmentPublicId }: { route: CanonicalRouteDefinition; assessmentPublicId?: string }) {
  const { hasCapability } = useAccess();
  const academic = useAcademicContext();
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const view = route.pageContext?.tab || 'overview';
  const title = view === 'create' ? 'Create Assessment' : view === 'edit' ? 'Edit Assessment' : 'Assessment';
  const nav = <nav className="assessment-nav" aria-label="Assessment sections">{destinations.map(([id, name, Icon]) => <NavLink key={id} end={id === 'school.assessment'} to={buildRoute(id)} className="ds-focus-ring"><Icon size={16} aria-hidden="true" />{name}</NavLink>)}</nav>;
  const key = `${workspace.generation}:${academic.workspaceGeneration}:${academic.session?.id}:${academic.term?.id}:${academic.campus?.id}:${route.id}:${assessmentPublicId || ''}`;
  const surface = assessmentPublicId && view !== 'edit' ? <AssessmentDetail id={assessmentPublicId} view={view} />
    : view === 'create' || view === 'edit' ? <AssessmentForm id={assessmentPublicId} />
    : view === 'questions' ? <QuestionBank />
    : view === 'schedule' ? <Schedule />
    : view === 'marking' ? <Marking />
    : view === 'settings' ? <AssessmentSettings />
    : route.id === 'school.assessment.cbt' ? <OnlineAssessments />
    : view === 'assessments' ? <Registry initialDelivery={route.pageContext?.delivery} /> : <AssessmentOverview />;
  return <WorkspaceLandingLayout className="assessment-domain" title={title} description="Plan, deliver, mark and moderate student assessments."
    breadcrumb={[{ label: 'Home', href: buildRoute(route.workspace === 'personal' ? 'personal.home' : 'school.home') }, { label: 'Assessment', ...(view !== 'overview' ? { href: buildRoute('school.assessment') } : {}) }, ...(view !== 'overview' ? [{ label: route.title }] : [])]}
    nav={nav} action={hasCapability('assessment.assessment.create') && !['create', 'edit'].includes(view) ? <div className="assessment-actions"><Button variant="outline" leftIcon={<Upload size={16} />} onClick={() => navigate(buildRoute('school.assessment.import'))}>Import</Button><Button leftIcon={<Plus size={18} />} onClick={() => navigate(buildRoute('school.assessment.create'))}>Create Assessment</Button></div> : undefined}>
    <Suspense fallback={<QueryState name="assessment" query={{ loading: true, error: '', reload: () => {} }} />}><div key={key}>{view === 'import' ? <AssessmentImport /> : surface}</div></Suspense>
  </WorkspaceLandingLayout>;
}

function AssessmentOverview() {
  const query = useAssessmentQuery<Overview>('/assessments/overview');
  if (!query.data) return <QueryState query={query} name="Assessment overview" />;
  const data = query.data;
  return <><Metrics data={data.metrics} /><div className="assessment-overview-grid">
    <Panel title="Assessment Workflow" className="assessment-workflow-panel"><Workflow data={data.workflow} /></Panel>
    <Panel title="My Work" className="assessment-my-work" action={<ViewAll to={buildRoute('school.assessment.marking')} />}><WorkList items={data.myWork} /></Panel>
    <Panel title="Assessment Trend" action={<small>Last 6 months</small>}><Trend data={data.trend} /></Panel>
    <Panel title="Assessment Coverage" action={<ViewAll to={buildRoute('school.assessment.assessments')}>View details</ViewAll>}><Coverage items={data.coverage} /></Panel>
  </div><div className="assessment-bottom-grid"><Panel title="Recent Assessments" action={<ViewAll to={buildRoute('school.assessment.assessments')} />}><AssessmentTable items={data.recent} compact /></Panel><Panel title="Upcoming Assessments" action={<ViewAll to={buildRoute('school.assessment.exam-schedule')} />}><Upcoming items={data.upcoming} /></Panel></div></>;
}

export const Registry: React.FC<{ queue?: string; initialDelivery?: string }> = ({ queue = '', initialDelivery = '' }) => {
  const [search] = useSearchParams();
  const type = search.get('type') || '';
  const legacyTypes: Record<string, string> = { continuous: 'continuous-assessment', tests: 'test', examinations: 'exam' };
  const [filters, setFilters] = useState({ search: '', type: legacyTypes[type] || type, classId: '', subjectId: '', status: '', delivery: initialDelivery, from: '', to: '', page: 1 });
  const [more, setMore] = useState(false);
  const lookups = useAssessmentQuery<Lookups>('/lookups/assessment-creation');
  const query = useAssessmentQuery<Page<Assessment>>(`/assessments?${queryString({ ...filters, queue, perPage: 10 })}`);
  const change = (key: string, value: string) => setFilters(old => ({ ...old, [key]: value, page: 1 }));
  return <Panel title={queue ? 'Assessment queue' : 'Assessments'}><div className="assessment-filters"><label>Search<input value={filters.search} onChange={e => change('search', e.target.value)} placeholder="Search assessments" /></label>
    <label>Type<select value={filters.type} onChange={e => change('type', e.target.value)}><option value="">All types</option>{ASSESSMENT_TYPES.map(x => <option key={x} value={x}>{label(x)}</option>)}</select></label>
    <label>Class<select value={filters.classId} onChange={e => change('classId', e.target.value)}><option value="">All classes</option>{lookups.data?.classes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>Subject<select value={filters.subjectId} onChange={e => change('subjectId', e.target.value)}><option value="">All subjects</option>{lookups.data?.subjects.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>Status<select value={filters.status} onChange={e => change('status', e.target.value)}><option value="">All statuses</option>{['draft', 'ready', 'scheduled', 'active', 'completed', 'marking', 'moderation', 'validated', 'locked', 'reopened', 'cancelled'].map(x => <option key={x}>{x}</option>)}</select></label><Button variant="outline" aria-expanded={more} onClick={() => setMore(!more)}>More Filters</Button>
    {more && <><label>Delivery<select value={filters.delivery} onChange={e => change('delivery', e.target.value)}><option value="">All delivery methods</option>{['manual', 'paper', 'smartmark', 'cbt', 'project', 'oral'].map(x => <option key={x}>{x}</option>)}</select></label><label>From<input type="date" value={filters.from} onChange={e => change('from', e.target.value)} /></label><label>To<input type="date" value={filters.to} onChange={e => change('to', e.target.value)} /></label></>}
  </div>{lookups.data && <p className="assessment-muted">{lookups.data.session.name} · {lookups.data.term.name}</p>}<QueryState query={query} name="assessments" />{query.data && <><AssessmentTable items={query.data.data} /><Pagination meta={query.data.meta} onPage={page => setFilters(old => ({ ...old, page }))} /></>}</Panel>;
}

function scheduleGaps(a: Assessment): string[] {
  const gaps: string[] = [];
  if (!a.metadata.startTime) gaps.push('time');
  if (!a.metadata.duration) gaps.push('duration');
  if (!a.metadata.venue?.trim()) gaps.push('venue');
  if (!a.metadata.invigilator?.trim()) gaps.push('invigilator');
  return gaps;
}

function Schedule() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const last = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const query = useAssessmentQuery<Page<Assessment>>(`/assessments?${queryString({ from: `${month}-01`, to: `${month}-${last}`, page, perPage: 31 })}`);
  const incomplete = query.data?.data.filter(a => ['draft', 'ready'].includes(a.status) && scheduleGaps(a).length > 0).length ?? 0;
  return <Panel title="Exam Schedule"><div className="assessment-filters"><label>Month<input type="month" required value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setPage(1); } }} /></label><label>View<select value={view} onChange={e => setView(e.target.value)}><option value="list">List</option><option value="calendar">Calendar</option></select></label></div>{incomplete > 0 && <p className="assessment-error" role="status">{incomplete} assessment{incomplete === 1 ? '' : 's'} still need venue, invigilator, time or duration before scheduling.</p>}<QueryState query={query} name="exam schedule" />{query.data && <>{view === 'list' ? <ul className="assessment-upcoming">{query.data.data.map(a => { const gaps = scheduleGaps(a); return <li key={a.id} className={gaps.length ? 'assessment-schedule-incomplete' : undefined}><Link to={assessmentHref(a.id)}><div><strong>{a.title}</strong><small>{a.className} · {a.subject}</small><small>{shortDate(a.date)} · {a.metadata.startTime || 'Time not set'} · {a.metadata.duration || '—'} minutes</small><small>{a.metadata.venue || 'Venue not set'} · {a.metadata.invigilator || 'Invigilator not set'}</small>{gaps.length > 0 && <small className="assessment-schedule-gap">Missing: {gaps.join(', ')}</small>}</div><StatusBadge status={a.status} /></Link></li>; })}</ul> : <div className="assessment-calendar">{Array.from({ length: last }, (_, i) => <div key={i}><strong>{i + 1}</strong>{query.data.data.filter(a => Number(a.date?.slice(-2)) === i + 1).map(a => <Link key={a.id} to={assessmentHref(a.id)} className={scheduleGaps(a).length ? 'assessment-schedule-incomplete' : undefined}>{a.metadata.startTime || '—'} {a.title}<small>{a.className} · {a.metadata.venue || 'No venue'}</small></Link>)}</div>)}</div>}{query.data.data.length === 0 && <EmptyState title="No assessments scheduled this month." />}<Pagination meta={query.data.meta} onPage={setPage} /></>}</Panel>;
}
function Marking() {
  const [queue, setQueue] = useState('mine');
  return <><div className="assessment-filters"><label>Marking & Moderation view<select value={queue} onChange={e => setQueue(e.target.value)}>{[['mine', 'My Queue'], ['marking', 'Needs Marking'], ['moderation', 'Needs Moderation'], ['exceptions', 'Exceptions'], ['locked', 'Locked']].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div>{queue === 'exceptions' ? <SmartMarkReview /> : <Registry key={queue} queue={queue} />}</>;
}
function AssessmentSettings() {
  const query = useAssessmentQuery<{ moderationRequired: boolean; defaultDuration: number }>('/assessments/settings');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = new FormData(e.currentTarget); setBusy(true); setError(''); try { await mutate('/assessments/settings', 'PUT', { moderationRequired: form.get('moderationRequired') === 'true', defaultDuration: Number(form.get('defaultDuration')) }); setSaved(true); query.reload(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save settings.'); } finally { setBusy(false); } };
  return <Panel title="Assessment Settings"><QueryState query={query} name="assessment settings" />{error && <p role="alert">{error}</p>}{saved && <p role="status">Assessment settings saved.</p>}{query.data && <form onSubmit={save} className="assessment-form-grid"><label>Moderation workflow<select name="moderationRequired" defaultValue={String(query.data.moderationRequired)}><option value="true">Mark → Moderate → Lock</option><option value="false">Mark → Lock</option></select></label><label>Default duration (minutes)<input required name="defaultDuration" type="number" min={1} max={600} defaultValue={query.data.defaultDuration} /></label><div className="span-full"><Button type="submit" isLoading={busy}>Save Settings</Button></div></form>}</Panel>;
}

function AssessmentImport() {
  const [text, setText] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); setMessage(''); try { const records: unknown = JSON.parse(text); if (!Array.isArray(records) || !records.length || records.length > 100) throw new Error('Provide an array of 1–100 assessment records.'); const response = await mutate<{ imported: number }>('/assessments/import', 'POST', { records }); setMessage(`${response.data.imported} draft assessments imported.`); setText(''); } catch (e) { setMessage(e instanceof Error ? e.message : 'Import failed.'); } finally { setBusy(false); } };
  return <Panel title="Import Assessments"><p className="assessment-muted">Paste a JSON array of assessment records using the same fields as the creation form. All records are validated before any are imported. Class and subject public IDs must belong to your assigned academic context.</p><label>Assessment records<textarea rows={12} value={text} onChange={e => setText(e.target.value)} /></label><details><summary>Required fields</summary><p>title, classId, subjectId, assessmentTypeId, date (YYYY-MM-DD), maxScore, participantMode (class or selected), contentMode (score-only or questions), delivery (manual, paper, smartmark, cbt, project or oral). Selected participants require studentIds.</p></details><Button disabled={!text || busy} onClick={submit}>Import Drafts</Button>{message && <p role="status">{message}</p>}</Panel>;
}
