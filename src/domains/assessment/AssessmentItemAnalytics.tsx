import React from 'react';
import { EmptyState } from '../../components/ui';
import { API_BASE_URL } from '../../lib/apiClient';
import { useAccess } from '../../state/ApplicationStateProviders';
import { useAssessmentQuery } from './api';
import { Panel, QueryState } from './components';

type ItemRow = {
  questionId: string;
  number: number;
  prompt: string;
  questionType: string;
  attempts: number;
  answered: number;
  correct: number;
  facility: number | null;
  omitRate: number | null;
};

export default function AssessmentItemAnalytics({ id }: { id: string }) {
  const query = useAssessmentQuery<{ assessmentId: string; attemptCount: number; items: ItemRow[] }>(`/assessments/${id}/item-analytics`);
  const { hasCapability } = useAccess();
  const canExport = hasCapability('assessment.score.enter') || hasCapability('assessment.score.moderate') || hasCapability('scores.edit');

  return (
    <Panel
      title="Item analytics"
      action={canExport ? <a className="assessment-link" href={`${API_BASE_URL}/assessments/${id}/export`} target="_blank" rel="noreferrer">Download score CSV</a> : undefined}
    >
      <QueryState query={query} name="item analytics" />
      {query.data && (
        <>
          <p className="assessment-muted">{query.data.attemptCount} submitted attempt(s). Facility is % correct among answered objective items.</p>
          {query.data.items.length === 0 ? <EmptyState title="No questions to analyse." /> : (
            <div className="assessment-table-wrap">
              <table className="assessment-table">
                <thead>
                  <tr><th>#</th><th>Prompt</th><th>Type</th><th>Answered</th><th>Correct</th><th>Facility</th><th>Omit rate</th></tr>
                </thead>
                <tbody>
                  {query.data.items.map(item => (
                    <tr key={item.questionId}>
                      <td>{item.number}</td>
                      <td>{item.prompt}</td>
                      <td>{item.questionType}</td>
                      <td>{item.answered}/{item.attempts}</td>
                      <td>{item.correct}</td>
                      <td>{item.facility === null ? '—' : `${Math.round(item.facility * 100)}%`}</td>
                      <td>{item.omitRate === null ? '—' : `${Math.round(item.omitRate * 100)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
