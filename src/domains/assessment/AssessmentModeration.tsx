import React, { useState } from 'react';
import { Button, StatusBadge } from '../../components/ui';
import { useAccess } from '../../state/ApplicationStateProviders';
import { mutate, useAssessmentQuery } from './api';
import { Panel, QueryState } from './components';
import ScoreEntryGrid from './ScoreEntryGrid';

type ModerationCheck = {
  id: string;
  label: string;
  severity: string;
  status: string;
  count: number;
  message: string;
};

type ModerationReview = {
  summary: {
    roster: number;
    entered: number;
    absent: number;
    exempt: number;
    missing: number;
    mean: number | null;
    minimum: number | null;
    maximumEntered: number | null;
    maximumScore: number;
    status: string;
    moderationRequired: boolean;
    moderationStage?: string | null;
    multiStageModeration?: boolean;
  };
  checks: ModerationCheck[];
  unlockImpact: {
    performanceExposed: boolean;
    publishedResults: number;
    lockVersion: number;
    lockedAt: string | null;
    requiresAcknowledgement: boolean;
    warnings: string[];
  };
  canModerate: boolean;
  canSubjectHeadApprove?: boolean;
  canEoApprove?: boolean;
  canLock: boolean;
};

export default function AssessmentModeration({
  id,
  revision,
  status,
  onChanged,
}: {
  id: string;
  revision: number;
  status: string;
  onChanged: () => void;
}) {
  const query = useAssessmentQuery<ModerationReview>(`/assessments/${id}/moderation`);
  const { hasCapability } = useAccess();
  const [ackWarnings, setAckWarnings] = useState(false);
  const [ackImpact, setAckImpact] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setError('');
    try {
      await mutate(`/assessments/${id}/transition`, 'POST', { action, revision, ...extra });
      onChanged();
      query.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!query.data) return <QueryState query={query} name="moderation review" />;
  const review = query.data;
  const warnings = review.checks.filter(c => c.status === 'warn');
  const blockers = review.checks.filter(c => c.status === 'fail');

  return (
    <div className="space-y-4">
      <Panel title="Moderation Checks">
        <div className="assessment-actions">
          <StatusBadge status={review.summary.status} />
          <span role="status">
            {review.summary.entered}/{review.summary.roster} entered · {review.summary.absent} absent · {review.summary.exempt} exempt · {review.summary.missing} missing
            {review.summary.mean !== null ? ` · mean ${review.summary.mean}` : ''}
          </span>
        </div>
        <ul className="assessment-moderation-checks">
          {review.checks.map(check => (
            <li key={check.id} data-status={check.status}>
              <strong>{check.label}</strong>
              <span className={`assessment-check-pill status-${check.status}`}>{check.status}</span>
              <p>{check.message}</p>
            </li>
          ))}
        </ul>
        {error && <p className="assessment-error" role="alert">{error}</p>}
        {warnings.length > 0 && (
          <label className="assessment-actions">
            <input type="checkbox" checked={ackWarnings} onChange={e => setAckWarnings(e.target.checked)} />
            I have reviewed the warning checks and still want to continue.
          </label>
        )}
        <div className="assessment-actions">
          {hasCapability('assessment.score.moderate') && status === 'moderation' && (
            <Button
              disabled={busy || blockers.length > 0 || (warnings.length > 0 && !ackWarnings)}
              onClick={() => void run('moderate', { acknowledgeWarnings: ackWarnings || warnings.length === 0 })}
            >
              {review.summary.multiStageModeration ? 'Subject Head approve' : 'Validate Scores'}
            </Button>
          )}
          {hasCapability('assessment.score.moderate') && status === 'under_review' && (
            <Button
              disabled={busy || blockers.length > 0 || (warnings.length > 0 && !ackWarnings)}
              onClick={() => void run('moderate', { acknowledgeWarnings: ackWarnings || warnings.length === 0 })}
            >
              Examination Officer validate
            </Button>
          )}
          {hasCapability('assessment.score.moderate') && !['moderation', 'under_review'].includes(status) && review.canModerate && (
            <Button
              disabled={busy || blockers.length > 0 || (warnings.length > 0 && !ackWarnings)}
              onClick={() => void run('moderate', { acknowledgeWarnings: ackWarnings || warnings.length === 0 })}
            >
              Validate Scores
            </Button>
          )}
          {hasCapability('assessment.score.lock') && (
            (review.summary.moderationRequired ? ['validated', 'approved'].includes(status) : ['validated', 'approved', 'completed', 'marking', 'reopened'].includes(status)) && (
              <Button
                disabled={busy || blockers.length > 0 || (warnings.length > 0 && !ackWarnings)}
                onClick={() => void run('lock', { acknowledgeWarnings: ackWarnings || warnings.length === 0 })}
              >
                Lock Scores
              </Button>
            )
          )}
        </div>
      </Panel>

      {status === 'locked' && hasCapability('assessment.score.unlock') && (
        <Panel title="Unlock Impact">
          <ul className="assessment-moderation-checks">
            {review.unlockImpact.warnings.map(warning => (
              <li key={warning} data-status={review.unlockImpact.requiresAcknowledgement ? 'warn' : 'pass'}>
                <p>{warning}</p>
              </li>
            ))}
          </ul>
          <label>Reason for reopening<textarea required value={reason} onChange={e => setReason(e.target.value)} /></label>
          {review.unlockImpact.requiresAcknowledgement && (
            <label className="assessment-actions">
              <input type="checkbox" checked={ackImpact} onChange={e => setAckImpact(e.target.checked)} />
              I understand Performance and related results may need regeneration after unlocking.
            </label>
          )}
          <Button
            variant="outline"
            disabled={busy || !reason.trim() || (review.unlockImpact.requiresAcknowledgement && !ackImpact)}
            onClick={() => void run('reopen', { reason, acknowledgeImpact: ackImpact || !review.unlockImpact.requiresAcknowledgement })}
          >
            Reopen Scores
          </Button>
        </Panel>
      )}

      <ScoreEntryGrid key={`${id}:${status}`} id={id} />
    </div>
  );
}
