import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, StatusBadge } from '../../components/ui';
import { buildRoute } from '../../routing/builders';
import { queryString, useAssessmentQuery } from './api';
import { assessmentHref, Panel, Pagination, QueryState, shortDate } from './components';
import type { Assessment, Page } from './types';
import { label } from './types';

function windowLabel(a: Assessment): string {
  if (!a.availableFrom || !a.availableUntil) {
    return a.metadata.startTime ? `${shortDate(a.date)} · ${a.metadata.startTime}` : shortDate(a.date);
  }
  const from = new Date(a.availableFrom);
  const until = new Date(a.availableUntil);
  if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) return shortDate(a.date);
  const fmt = new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `${fmt.format(from)} – ${fmt.format(until)}`;
}

function windowState(a: Assessment): 'upcoming' | 'open' | 'closed' | 'unscheduled' {
  if (!a.availableFrom || !a.availableUntil) return 'unscheduled';
  const now = Date.now();
  const from = Date.parse(a.availableFrom);
  const until = Date.parse(a.availableUntil);
  if (Number.isNaN(from) || Number.isNaN(until)) return 'unscheduled';
  if (now < from) return 'upcoming';
  if (now > until) return 'closed';
  return 'open';
}

/**
 * CBT assessments are Assessment records with delivery=cbt.
 * Legacy /cbt/quizzes remain available for reconciliation but are no longer the staff source of truth.
 * Student timed player / attempt ingestion is deferred.
 */
export default function OnlineAssessments() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const query = useAssessmentQuery<Page<Assessment>>(`/assessments?${queryString({ delivery: 'cbt', page, perPage: 10 })}`);

  return (
    <Panel
      title="Online Assessments"
      action={<Link className="assessment-link" to={buildRoute('school.assessment.create')}>Create CBT assessment</Link>}
    >
      <p className="assessment-muted">
        Staff monitor for Assessment CBT delivery. Students take exams at My CBT Assessments.
        Scores submitted by students land in the normal marking and moderation workflow.
      </p>
      <QueryState query={query} name="online assessments" />
      {query.data && (
        <>
          {query.data.data.length === 0 && (
            <EmptyState
              title="No CBT assessments yet."
              description="Create an assessment with Computer-Based Test delivery, attach questions, then schedule it."
            />
          )}
          <ul className="assessment-work-list">
            {query.data.data.map(a => {
              const state = windowState(a);
              return (
                <li key={a.id}>
                  <div className="assessment-actions" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Link to={assessmentHref(a.id)} style={{ flex: 1, minWidth: 0 }}>
                      <div>
                        <strong>{a.title}</strong>
                        <small>{a.className} · {a.subject} · {label(a.type)}</small>
                        <small>{windowLabel(a)} · {a.metadata.duration || '—'} min · roster {a.expected}</small>
                        <small>
                          Window: {state === 'open' ? 'Open now' : state === 'upcoming' ? 'Upcoming' : state === 'closed' ? 'Closed' : 'Not scheduled'}
                        </small>
                      </div>
                    </Link>
                    <span>
                      <StatusBadge status={a.status} />
                      <small>{a.marked}/{a.expected} marked</small>
                    </span>
                    <Button variant="outline" onClick={() => navigate(assessmentHref(a.id, 'questions'))}>Questions</Button>
                    <Button variant="outline" onClick={() => navigate(assessmentHref(a.id))}>Open</Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination meta={query.data.meta} onPage={setPage} />
        </>
      )}
    </Panel>
  );
}
