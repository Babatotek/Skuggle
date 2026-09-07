import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ClipboardList, FileText, Lock, PenLine, Play, Users, CheckCircle2 } from 'lucide-react';
import { Button, EmptyState, StatusBadge } from '../../components/ui';
import { buildRoute } from '../../routing/builders';
import type { Assessment, Overview, Page } from './types';
import { label } from './types';

export const assessmentHref = (id: string, view = 'detail') => buildRoute(`school.assessment.${view}`, { assessmentPublicId: id });
export const shortDate = (date: string | null) => date && !Number.isNaN(Date.parse(date)) ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)) : 'Not scheduled';
export function Panel({ title, children, action, className = '' }: React.PropsWithChildren<{ title: string; action?: React.ReactNode; className?: string }>) {
  return <section className={`assessment-panel ${className}`}><div className="assessment-panel-heading"><h2>{title}</h2>{action}</div>{children}</section>;
}
export function ViewAll({ to, children = 'View all' }: React.PropsWithChildren<{ to: string }>) { return <Link className="assessment-link" to={to}>{children}<ArrowRight size={14} aria-hidden="true" /></Link>; }
export function QueryState({ query, name }: { query: { loading: boolean; error: string; reload: () => void }; name: string }) {
  if (query.loading) return <div className="assessment-skeleton" role="status" aria-label={`Loading ${name}`}><div /><div /><div /></div>;
  if (query.error) return <div role="alert" className="assessment-error"><p>Unable to load {name}.</p><p>{query.error}</p><Button variant="outline" onClick={query.reload}>Retry</Button></div>;
  return null;
}
export function Pagination({ meta, onPage }: { meta: Page<unknown>['meta']; onPage: (page: number) => void }) {
  return <nav className="assessment-pagination" aria-label="Pagination"><span>{meta.total} records · Page {meta.currentPage} of {Math.max(1, meta.lastPage)}</span><div><Button variant="outline" disabled={meta.currentPage <= 1} onClick={() => onPage(meta.currentPage - 1)}>Previous</Button><Button variant="outline" disabled={meta.currentPage >= meta.lastPage} onClick={() => onPage(meta.currentPage + 1)}>Next</Button></div></nav>;
}
export function AssessmentTable({ items, compact = false }: { items: Assessment[]; compact?: boolean }) {
  if (!items.length) return <EmptyState title="No assessments yet." description="Create an assessment or adjust the current filters." />;
  return <><div className="assessment-table-wrap"><table className="assessment-table"><caption className="sr-only">Assessments in the selected academic context</caption><thead><tr>{['Assessment', 'Class', 'Subject', 'Type', 'Date', ...(!compact ? ['Maximum score', 'Delivery'] : []), 'Status', 'Marking progress', 'Actions'].map(x => <th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{items.map(a => <tr key={a.id}><td><Link to={assessmentHref(a.id)}>{a.title}</Link></td><td>{a.className}</td><td>{a.subject}</td><td>{label(a.type)}</td><td>{shortDate(a.date)}</td>{!compact && <><td>{a.maxScore}</td><td>{label(a.delivery)}</td></>}<td><StatusBadge status={a.status} /></td><td>{a.marked}/{a.expected}</td><td><Link className="assessment-link" to={assessmentHref(a.id)} aria-label={`Open ${a.title}`}>Open</Link></td></tr>)}</tbody></table></div><div className="assessment-mobile-list">{items.map(a => <Link to={assessmentHref(a.id)} className="assessment-mobile-row" key={a.id}><strong>{a.title}</strong><span>{a.className} · {a.subject} · {label(a.type)}</span><span>{shortDate(a.date)} · {a.marked}/{a.expected} marked</span><StatusBadge status={a.status} /></Link>)}</div></>;
}
export function Metrics({ data }: { data: Overview['metrics'] }) {
  const cards = [{ label: 'Active Assessments', value: data.active, Icon: FileText, tone: 'information' }, { label: 'Awaiting Marking', value: data.marking, Icon: CheckCircle2, tone: 'attention' }, { label: 'Scheduled', value: data.scheduled, Icon: CalendarDays, tone: 'information' }, { label: 'Moderation Required', value: data.moderation, Icon: Users, tone: 'restricted' }];
  return <div className="assessment-metrics">{cards.map(({ label: title, value, Icon, tone }) => <div className={`assessment-metric tone-${tone}`} key={title}><span className="assessment-icon"><Icon aria-hidden="true" size={24} /></span><div><p>{title}</p><strong>{value}</strong><small>Selected academic period</small></div></div>)}</div>;
}
export function Workflow({ data }: { data: Overview['workflow'] }) {
  const icons = [ClipboardList, CalendarDays, Play, PenLine, Users, Lock];
  return <ol className="assessment-workflow">{['Planned', 'Scheduled', 'Delivered', 'Marking', 'Moderation', 'Locked'].map((name, i) => { const Icon = icons[i]; return <li key={name}><span className={`assessment-icon tone-${['restricted', 'information', 'positive', 'attention', 'restricted', 'neutral'][i]}`}><Icon size={21} aria-hidden="true" /></span><span>{name}</span><strong>{data[name] ?? 0}</strong><small>{['Draft / Ready', 'Upcoming', 'In progress', 'Awaiting completion', 'Under review', 'Finalized'][i]}</small></li>; })}</ol>;
}
export function WorkList({ items }: { items: Assessment[] }) {
  if (!items.length) return <EmptyState title="No assessment tasks assigned to you." />;
  return <ul className="assessment-work-list">{items.map(a => <li key={a.id}><Link to={assessmentHref(a.id, ['moderation', 'under_review'].includes(a.status) ? 'moderation' : 'score-entry')}><span className="assessment-icon tone-attention"><PenLine size={20} /></span><div><strong>{['moderation', 'under_review'].includes(a.status) ? 'Moderate' : 'Mark'} {a.title}</strong><small>{a.className} · {a.subject}</small></div><span><StatusBadge status={a.status} /><small>{a.marked}/{a.expected} marked</small></span></Link></li>)}</ul>;
}
export function Trend({ data }: { data: Overview['trend'] }) {
  const max = Math.max(1, ...data.flatMap(x => [x.assessments, x.completed]));
  return <figure className="assessment-trend"><div className="assessment-chart" role="img" aria-label={data.map(x => `${x.month}: ${x.assessments} assessments, ${x.completed} completed`).join('; ')}>{data.map((x, i) => <div className="assessment-chart-month" key={`${x.month}-${i}`}><div className="assessment-chart-bars"><span style={{ height: `${x.assessments / max * 100}%` }} title={`${x.assessments} assessments`} /><span style={{ height: `${x.completed / max * 100}%` }} title={`${x.completed} completed`} /></div><small>{x.month}</small></div>)}</div><figcaption><span>Assessments</span><span>Completed</span></figcaption>{data.every(x => x.assessments === 0) && <p className="assessment-muted">No assessment activity in the last six months.</p>}</figure>;
}
export function Coverage({ items }: { items: Overview['coverage'] }) {
  if (!items.length) return <EmptyState title="No class or subject coverage yet." />;
  return <div className="assessment-coverage-scroll"><table className="assessment-table"><caption>By class and subject</caption><thead><tr>{['Class', 'Subject', 'Planned', 'Completed', 'Marked', '%'].map(x => <th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{items.map(x => <tr key={x.id}><td>{x.className}</td><td>{x.subject}</td><td>{x.planned}</td><td>{x.completed}</td><td>{x.marked}</td><td>{x.planned ? Math.round(x.completed / x.planned * 100) : 0}%</td></tr>)}</tbody></table></div>;
}
export function Upcoming({ items }: { items: Assessment[] }) {
  if (!items.length) return <EmptyState title="No upcoming assessments." />;
  return <ul className="assessment-upcoming">{items.map(a => <li key={a.id}><Link to={assessmentHref(a.id)}><span className="assessment-date"><small>{a.date ? new Date(a.date).toLocaleString('en', { month: 'short' }) : '—'}</small><strong>{a.date ? new Date(a.date).getDate() : '—'}</strong></span><div><strong>{a.title}</strong><small>{a.className} · {a.subject} · {label(a.type)}</small></div><small>{a.metadata.startTime || 'Time not set'}<br />{a.metadata.venue || 'Venue not set'}</small></Link></li>)}</ul>;
}
