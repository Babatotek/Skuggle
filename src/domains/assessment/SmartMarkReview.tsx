import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, StatusBadge } from '../../components/ui';
import { useAccess } from '../../state/ApplicationStateProviders';
import { API_BASE_URL } from '../../lib/apiClient';
import { mutate, useAssessmentQuery } from './api';
import { assessmentHref, Panel, QueryState } from './components';

interface RosterOption { id: string; name: string; admissionNo: string | null }
interface Detection {
  id: string;
  position: number;
  expected: string;
  detected: string;
  confidence: number;
  marks: number;
  decision: string | null;
}
interface Sheet {
  id: string;
  studentId: string | null;
  studentName: string;
  admissionNo: string;
  detectedScore: number;
  confidence: number;
  confidenceBand: string;
  flagged: boolean;
  flagReason: string;
  reviewedAt: string | null;
  answers: string[];
  detections?: Detection[];
  scanUrl?: string;
}
interface BatchStats { processed: number; verified: number; needsReview: number; unmatched: number; failed: number }
interface Batch {
  id: string;
  assessmentId: string | null;
  assessmentTitle: string | null;
  state: string;
  filename: string;
  maxScore: number;
  error: string;
  stats: BatchStats;
  roster: RosterOption[];
  sheets: Sheet[];
}

const BAND_LABEL: Record<string, string> = {
  HIGH_CONFIDENCE: 'High',
  MEDIUM_CONFIDENCE: 'Medium',
  LOW_CONFIDENCE: 'Low',
  UNREADABLE: 'Unreadable',
  UNMATCHED: 'Unmatched',
};

function bandTone(band: string): string {
  if (band === 'HIGH_CONFIDENCE') return 'tone-positive';
  if (band === 'MEDIUM_CONFIDENCE') return 'tone-information';
  if (band === 'LOW_CONFIDENCE') return 'tone-attention';
  return 'tone-restricted';
}

export default function SmartMarkReview() {
  const query = useAssessmentQuery<Batch[]>('/smartmark/batches');
  const { hasCapability } = useAccess();
  const canProcess = hasCapability('assessment.smartmark.process') || hasCapability('assessment.score.enter') || hasCapability('scores.edit');
  const canReview = hasCapability('assessment.smartmark.review') || hasCapability('assessment.score.enter') || hasCapability('scores.edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'needs' | 'unmatched'>('needs');
  const [uploadMessage, setUploadMessage] = useState('');
  const [detectionEdits, setDetectionEdits] = useState<Record<string, Record<number, string>>>({});

  const processing = useMemo(() => (query.data || []).some(b => ['queued', 'processing'].includes(b.state)), [query.data]);
  useEffect(() => {
    if (!processing) return;
    const timer = window.setInterval(() => query.reload(), 2500);
    return () => window.clearInterval(timer);
  }, [processing, query]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      query.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SmartMark action failed.');
    } finally {
      setBusy(false);
    }
  };

  const totals = useMemo(() => {
    const batches = query.data || [];
    return batches.reduce((acc, batch) => ({
      processed: acc.processed + (batch.stats?.processed ?? batch.sheets.length),
      verified: acc.verified + (batch.stats?.verified ?? 0),
      needsReview: acc.needsReview + (batch.stats?.needsReview ?? 0),
      unmatched: acc.unmatched + (batch.stats?.unmatched ?? 0),
      failed: acc.failed + (batch.stats?.failed ?? (batch.state === 'failed' ? 1 : 0)),
    }), { processed: 0, verified: 0, needsReview: 0, unmatched: 0, failed: 0 });
  }, [query.data]);

  const visibleBatches = (query.data || []).filter(batch => {
    if (filter === 'all') return true;
    if (filter === 'unmatched') return (batch.stats?.unmatched ?? 0) > 0 || batch.sheets.some(s => !s.studentId || s.confidenceBand === 'UNMATCHED');
    return batch.state === 'failed' || batch.state === 'queued' || batch.state === 'processing' || (batch.stats?.needsReview ?? 0) > 0 || batch.sheets.some(s => s.flagged || !s.reviewedAt);
  });

  return (
    <Panel title="SmartMark Review">
      <p className="assessment-muted">Upload scanned bubble sheets, auto-mark high-confidence scripts, resolve per-question exceptions, then commit verified scores into Assessment.</p>
      <div className="assessment-metrics">
        {[
          ['Processed', totals.processed, 'tone-information'],
          ['Verified', totals.verified, 'tone-positive'],
          ['Needs review', totals.needsReview, 'tone-attention'],
          ['Unmatched', totals.unmatched, 'tone-restricted'],
        ].map(([label, value, tone]) => (
          <div className="assessment-metric" key={label as string}>
            <span className={`assessment-icon ${tone as string}`} aria-hidden />
            <div>
              <p>{label as string}</p>
              <strong>{value as number}</strong>
              {label === 'Needs review' && totals.failed > 0 && <small>{totals.failed} failed batch(es)</small>}
            </div>
          </div>
        ))}
      </div>
      {canProcess && (
        <details className="assessment-panel">
          <summary>Upload scan (QR can identify assessment)</summary>
          <p className="assessment-muted">Drop a multi-page PDF or image. If the scan includes an SM|assessmentId|admission code, the assessment is resolved automatically.</p>
          <form onSubmit={e => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const key = String(data.get('answerKey') || '').split(/[,\s]+/).filter(Boolean);
            data.delete('answerKey');
            key.forEach((answer, i) => data.append(`answerKey[${i}]`, answer.toUpperCase()));
            void run(async () => {
              await mutate('/smartmark/batches', 'POST', data);
              setUploadMessage('Scripts queued for OCR.');
              e.currentTarget.reset();
            });
          }}>
            <label>Student scripts<input required type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></label>
            <label>Assessment public ID (optional if QR present)<input name="assessmentId" maxLength={40} /></label>
            <label>Answer key (optional)<input name="answerKey" maxLength={600} placeholder="A,B,C,D" /></label>
            <Button type="submit" disabled={busy}>Upload & process</Button>
            {uploadMessage && <p role="status">{uploadMessage}</p>}
          </form>
        </details>
      )}
      <div className="assessment-filters">
        <label>Queue filter
          <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>
            <option value="needs">Needs attention</option>
            <option value="unmatched">Unmatched only</option>
            <option value="all">All batches</option>
          </select>
        </label>
      </div>
      <QueryState query={query} name="SmartMark batches" />
      {error && <p role="alert" className="assessment-error">{error}</p>}
      {query.data && (
        <>
          {visibleBatches.length === 0 && <EmptyState title="No SmartMark batches in this filter." description="Upload scripts from a SmartMark assessment detail page, or switch the filter to All batches." />}
          {visibleBatches.map(batch => (
            <section className="assessment-question" key={batch.id}>
              <div className="assessment-panel-heading">
                <div>
                  <h3>{batch.filename} <StatusBadge status={batch.state} /></h3>
                  <p className="assessment-muted">
                    {batch.assessmentTitle || 'Assessment'} · Processed {batch.stats?.processed ?? batch.sheets.length} · Verified {batch.stats?.verified ?? 0} · Needs review {batch.stats?.needsReview ?? 0} · Unmatched {batch.stats?.unmatched ?? 0}
                  </p>
                </div>
                <div className="assessment-actions">
                  {batch.assessmentId && <Link className="assessment-link" to={assessmentHref(batch.assessmentId)}>Open assessment</Link>}
                  <a className="assessment-link" href={`${API_BASE_URL}/smartmark/batches/${batch.id}/scan`} target="_blank" rel="noreferrer">Open scan</a>
                  <a className="assessment-link" href={`${API_BASE_URL}/smartmark/batches/${batch.id}/export`} target="_blank" rel="noreferrer">Export exceptions</a>
                </div>
              </div>
              {batch.error && <p role="alert" className="assessment-error">{batch.error}</p>}
              {['queued', 'processing'].includes(batch.state) && <p role="status" className="assessment-muted">OCR processing in progress…</p>}
              {batch.sheets.map(sheet => {
                const edits = detectionEdits[sheet.id] || {};
                const detections = sheet.detections || [];
                return (
                  <form
                    className="assessment-question smartmark-sheet"
                    key={sheet.id}
                    onSubmit={e => {
                      e.preventDefault();
                      if (!canReview) return;
                      const data = new FormData(e.currentTarget);
                      const studentId = String(data.get('studentId') || '') || undefined;
                      const detectionPayload = detections.map(d => ({
                        position: d.position,
                        detected: (edits[d.position] ?? d.detected ?? '').toUpperCase(),
                        decision: edits[d.position] && edits[d.position] !== d.detected ? 'overridden' : 'accepted',
                      }));
                      void run(() => mutate(`/smartmark/sheets/${sheet.id}`, 'PATCH', {
                        detectedScore: Number(data.get('score')),
                        answers: detectionPayload.length
                          ? detectionPayload.map(d => d.detected)
                          : String(data.get('answers') || '').split(/[,\s]+/).filter(Boolean).map(v => v.toUpperCase()),
                        detections: detectionPayload.length ? detectionPayload : undefined,
                        studentId,
                        approved: true,
                      }));
                    }}
                  >
                    <div className="assessment-panel-heading">
                      <div>
                        <h4>{sheet.studentName || 'Unmatched student'} · {sheet.admissionNo || 'No admission no.'}</h4>
                        <p className="assessment-muted">{sheet.flagReason || 'Ready for verification.'}</p>
                      </div>
                      <span className={`assessment-icon ${bandTone(sheet.confidenceBand)}`} title={sheet.confidenceBand}>
                        {BAND_LABEL[sheet.confidenceBand] || sheet.confidenceBand}
                      </span>
                    </div>
                    <div className="assessment-filters">
                      {(!sheet.studentId || sheet.confidenceBand === 'UNMATCHED') && (
                        <label>Match roster student
                          <select name="studentId" defaultValue={sheet.studentId || ''} required={sheet.flagged} disabled={busy || batch.state === 'committed'}>
                            <option value="">Select student</option>
                            {batch.roster.map(option => (
                              <option key={option.id} value={option.id}>{option.name} ({option.admissionNo || 'no admission'})</option>
                            ))}
                          </select>
                        </label>
                      )}
                      <label>Verified mark
                        <input name="score" type="number" required min={0} max={batch.maxScore} step="0.01" defaultValue={sheet.detectedScore} disabled={busy || batch.state === 'committed'} />
                      </label>
                      {!detections.length && (
                        <label>Answers (optional edit)
                          <input name="answers" defaultValue={Array.isArray(sheet.answers) ? sheet.answers.join(',') : ''} disabled={busy || batch.state === 'committed'} />
                        </label>
                      )}
                      {canReview && batch.state !== 'committed' && <Button type="submit" disabled={busy}>{sheet.flagged || !sheet.reviewedAt ? 'Verify score' : 'Update verification'}</Button>}
                    </div>
                    {detections.length > 0 && (
                      <div className="assessment-table-wrap">
                        <table className="assessment-table">
                          <thead>
                            <tr><th>#</th><th>Expected</th><th>Detected</th><th>Confidence</th><th>Mark</th><th>Decision</th></tr>
                          </thead>
                          <tbody>
                            {detections.map(d => (
                              <tr key={d.id || d.position}>
                                <td>{d.position}</td>
                                <td>{d.expected}</td>
                                <td>
                                  <input
                                    maxLength={2}
                                    aria-label={`Detected answer for question ${d.position}`}
                                    disabled={busy || batch.state === 'committed'}
                                    value={(edits[d.position] ?? d.detected) || ''}
                                    onChange={e => setDetectionEdits(old => ({
                                      ...old,
                                      [sheet.id]: { ...(old[sheet.id] || {}), [d.position]: e.target.value.toUpperCase() },
                                    }))}
                                  />
                                </td>
                                <td>{Math.round(d.confidence)}%</td>
                                <td>{d.marks}</td>
                                <td>{d.decision || (edits[d.position] && edits[d.position] !== d.detected ? 'pending override' : '—')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="assessment-muted">Scan preview opens beside this review so you can compare bubbles to detected letters.</p>
                      </div>
                    )}
                  </form>
                );
              })}
              {canReview && batch.state !== 'committed' && batch.state !== 'failed' && (
                <Button
                  disabled={busy || batch.sheets.length === 0 || batch.sheets.some(s => s.flagged || !s.reviewedAt || !s.studentId)}
                  onClick={() => void run(() => mutate(`/smartmark/batches/${batch.id}/commit`, 'POST'))}
                >
                  Commit verified scores
                </Button>
              )}
            </section>
          ))}
          {!canProcess && !canReview && <p className="assessment-muted">You can view SmartMark exceptions, but processing and review require SmartMark capabilities.</p>}
        </>
      )}
    </Panel>
  );
}
