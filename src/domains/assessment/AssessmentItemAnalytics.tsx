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
  skippedRate?: number | null;
  averageTime?: number | null;
  discrimination?: number | null;
  distractors?: Record<string, number>;
};

export default function AssessmentItemAnalytics({ id }: { id: string }) {
  const query = useAssessmentQuery<{
    assessmentId: string;
    attemptCount: number;
    scoreDistribution?: Record<string, number>;
    items: ItemRow[];
  }>(`/assessments/${id}/item-analytics`);
  const { hasCapability } = useAccess();
  const canExport = hasCapability('assessment.score.enter') || hasCapability('assessment.score.moderate') || hasCapability('scores.edit');

  return (
    <Panel
      title="Item analytics"
      action={canExport ? (
        <div className="assessment-actions">
          <a className="assessment-link" href={`${API_BASE_URL}/assessments/${id}/export?kind=scores`} target="_blank" rel="noreferrer">Scores CSV</a>
          <a className="assessment-link" href={`${API_BASE_URL}/assessments/${id}/export?kind=moderation`} target="_blank" rel="noreferrer">Moderation sheet</a>
          <a className="assessment-link" href={`${API_BASE_URL}/assessments/${id}/export?kind=completion`} target="_blank" rel="noreferrer">Marking completion</a>
          <a className="assessment-link" href={`${API_BASE_URL}/assessments/${id}/export?kind=questions`} target="_blank" rel="noreferrer">Question bank subset</a>
        </div>
      ) : undefined}
    >
      <QueryState query={query} name="item analytics" />
      {query.data && (
        <>
          <p className="assessment-muted">{query.data.attemptCount} submitted attempt(s). Facility is % correct among answered objective items. Discrimination uses upper/lower 27%.</p>
          {query.data.scoreDistribution && (
            <div className="assessment-metrics">
              {Object.entries(query.data.scoreDistribution).map(([bucket, count]) => (
                <div className="assessment-metric" key={bucket}>
                  <div>
                    <p>{bucket}%</p>
                    <strong>{count}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
          {query.data.items.length === 0 ? <EmptyState title="No questions to analyse." /> : (
            <div className="assessment-table-wrap">
              <table className="assessment-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Prompt</th>
                    <th>Type</th>
                    <th>Answered</th>
                    <th>Correct</th>
                    <th>Facility</th>
                    <th>Omit</th>
                    <th>Disc.</th>
                    <th>Avg time</th>
                    <th>Distractors</th>
                  </tr>
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
                      <td>{item.discrimination == null ? '—' : item.discrimination.toFixed(2)}</td>
                      <td>{item.averageTime == null ? '—' : `${item.averageTime}s`}</td>
                      <td>
                        {item.distractors && Object.keys(item.distractors).length
                          ? Object.entries(item.distractors).map(([k, v]) => `${k}:${v}`).join(' · ')
                          : '—'}
                      </td>
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
