import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, StatusBadge } from '../../components/ui';
import { useAccess } from '../../state/ApplicationStateProviders';
import { mutate, useAssessmentQuery } from './api';
import { assessmentHref, Panel, QueryState, shortDate } from './components';
import { label } from './types';
import type { Assessment, Question } from './types';
import ScoreEntryGrid from './ScoreEntryGrid';
import QuestionBank from './QuestionBank';
import AssessmentPrintPack from './AssessmentPrintPack';
import AssessmentModeration from './AssessmentModeration';
import AssessmentItemAnalytics from './AssessmentItemAnalytics';

export default function AssessmentDetail({ id, view }: { id: string; view: string }) {
  const query = useAssessmentQuery<Assessment>(`/assessments/${id}`);
  const { hasCapability } = useAccess(); const [error, setError] = useState(''); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [ackImpact, setAckImpact] = useState(false);
  if (!query.data) return <QueryState query={query} name="assessment details" />;
  const a = query.data;
  const actions = [['ready', 'Mark Ready', 'assessment.assessment.create', ['draft']], ['schedule', 'Schedule', 'assessment.assessment.create', ['ready']], ['activate', 'Start Delivery', 'assessment.assessment.create', ['scheduled']], ['complete', 'Complete Delivery', 'assessment.assessment.create', ['active']], ['submit', 'Submit for Moderation', 'assessment.score.enter', ['completed', 'marking', 'reopened', 'submitted']], ['moderate', 'Validate Scores', 'assessment.score.moderate', ['moderation', 'under_review']], ['lock', 'Lock Scores', 'assessment.score.lock', ['completed', 'marking', 'reopened', 'validated', 'approved']], ['reopen', 'Reopen Scores', 'assessment.score.unlock', ['locked']], ['cancel', 'Cancel Assessment', 'assessment.assessment.create', ['draft', 'ready', 'scheduled']]] as const;
  const transition = async (action: string) => { setBusy(true); setError(''); try { await mutate(`/assessments/${id}/transition`, 'POST', { action, reason, revision: a.revision, acknowledgeImpact: action === 'reopen' ? ackImpact : undefined, acknowledgeWarnings: ['moderate', 'lock'].includes(action) ? true : undefined }); query.reload(); } catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); } finally { setBusy(false); } };
  const scheduleReady = Boolean(a.metadata.venue?.trim() && a.metadata.invigilator?.trim() && a.metadata.startTime && a.metadata.duration);
  return <div className="space-y-4"><Panel title={a.title}><div className="assessment-actions"><StatusBadge status={a.status} /><Link className="assessment-link" to={assessmentHref(id)}>Details</Link><Link className="assessment-link" to={assessmentHref(id, 'questions')}>Questions & Paper</Link><Link className="assessment-link" to={assessmentHref(id, 'score-entry')}>Score Entry</Link><Link className="assessment-link" to={assessmentHref(id, 'moderation')}>Moderation</Link>{['draft', 'ready'].includes(a.status) && hasCapability('assessment.assessment.create') && <Link className="assessment-link" to={assessmentHref(id, 'edit')}>Edit Assessment</Link>}</div>
    {view === 'detail' && <><dl className="assessment-detail-list">{Object.entries({ Class: a.className, Subject: a.subject, Type: label(a.type), Date: shortDate(a.date), Time: a.metadata.startTime || 'Not set', Duration: a.metadata.duration ? `${a.metadata.duration} min` : 'Not set', Venue: a.metadata.venue || 'Not set', Invigilator: a.metadata.invigilator || 'Not set', 'Maximum score': a.maxScore, Delivery: label(a.delivery), 'Marking progress': `${a.marked}/${a.expected}`, Weighting: `${a.metadata.weighting ?? 0}%`, Code: a.metadata.code || 'Not set' }).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p>{a.metadata.description}</p><p>{a.metadata.instructions}</p>{a.status === 'ready' && !scheduleReady && <p className="assessment-error" role="status">Add venue, invigilator, start time and duration before scheduling.</p>}{a.delivery === 'smartmark' && <SmartMarkUpload assessment={a} />}</>}
    {a.status === 'locked' && hasCapability('assessment.score.unlock') && view === 'detail' && <><label>Reason for reopening<textarea required value={reason} onChange={e => setReason(e.target.value)} /></label><label className="assessment-actions"><input type="checkbox" checked={ackImpact} onChange={e => setAckImpact(e.target.checked)} />I understand unlocking removes these scores from Performance until they are locked again.</label></>}
    {error && <p className="assessment-error" role="alert">{error}</p>}
    {view === 'detail' && <div className="assessment-actions">{actions.filter(([, , cap, states]) => hasCapability(cap) && (states as readonly string[]).includes(a.status)).map(([action, text]) => <Button key={action} variant="outline" disabled={busy || (action === 'reopen' && (!reason.trim() || !ackImpact)) || (action === 'schedule' && !scheduleReady)} onClick={() => void transition(action)}>{text}</Button>)}</div>}
    </Panel>{view === 'questions' && <><Builder assessment={a} onSaved={query.reload} /><AssessmentPrintPack assessmentId={id} /><AssessmentItemAnalytics id={id} /></>}{view === 'moderation' && <AssessmentModeration id={id} revision={a.revision} status={a.status} onChanged={query.reload} />}{['score-entry', 'marking'].includes(view) && <ScoreEntryGrid key={`${a.id}:${a.status}`} id={id} />}</div>;
}
function SmartMarkUpload({ assessment }: { assessment: Assessment }) {
  const { hasCapability } = useAccess();
  const canProcess = hasCapability('assessment.smartmark.process') || hasCapability('assessment.score.enter') || hasCapability('scores.edit');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!canProcess || !assessment.scoreEntryAllowed) {
    return (
      <p className="assessment-muted">
        SmartMark upload is available while scores are editable. Review exceptions in{' '}
        <Link className="assessment-link" to="/school/assessment/marking">Marking & Moderation → Exceptions</Link>.
      </p>
    );
  }
  return (
    <details open>
      <summary>Upload SmartMark scripts</summary>
      <p className="assessment-muted">Scan completed OMR bubble sheets for this assessment. Print sheets from Questions &amp; Paper → SmartMark OMR Sheet. High-confidence matches auto-propose scores; exceptions are reviewed under Marking → Exceptions.</p>
      <form onSubmit={async e => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const key = String(data.get('answerKey') || '').split(/[,\s]+/).filter(Boolean);
        data.delete('answerKey');
        key.forEach((answer, i) => data.append(`answerKey[${i}]`, answer.toUpperCase()));
        data.append('assessmentId', assessment.id);
        data.append('maxScore', String(assessment.maxScore));
        setBusy(true);
        setMessage('');
        try {
          await mutate('/smartmark/batches', 'POST', data);
          setMessage('Scripts queued. Open Marking & Moderation → Exceptions to verify and commit.');
          e.currentTarget.reset();
        } catch (err) {
          setMessage(err instanceof Error ? err.message : 'Upload failed.');
        } finally {
          setBusy(false);
        }
      }}>
        <label>Student scripts<input required type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></label>
        <label>Answer key (letters separated by commas; leave blank to use auto-markable questions)<input name="answerKey" maxLength={600} placeholder="A,B,C,D" /></label>
        <div className="assessment-actions">
          <Button type="submit" disabled={busy}>Upload & process</Button>
          <Link className="assessment-link" to={assessmentHref(assessment.id, 'questions')}>Print OMR sheets</Link>
          <Link className="assessment-link" to="/school/assessment/marking">Open exceptions queue</Link>
        </div>
        {message && <p role="status">{message}</p>}
      </form>
    </details>
  );
}
function Builder({ assessment, onSaved }: { assessment: Assessment; onSaved: () => void }) {
  const query = useAssessmentQuery<{ revision: number; editable: boolean; questions: Question[] }>(`/assessments/${assessment.id}/questions`);
  const [questions, setQuestions] = useState<Question[]>([]); const [bank, setBank] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (query.data) setQuestions(query.data.questions); }, [query.data]);
  const move = (index: number, direction: number) => { const next = [...questions]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; setQuestions(next); };
  const save = async () => { setBusy(true); setError(''); try { await mutate(`/assessments/${assessment.id}/questions`, 'PUT', { revision: query.data?.revision, questions: questions.map(q => ({ id: q.id, marks: q.marks, section: q.section || '' })) }); query.reload(); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save questions.'); } finally { setBusy(false); } };
  return <Panel title="Assessment Builder"><QueryState query={query} name="assessment questions" />{error && <p role="alert">{error}</p>}{query.data && <><div className="assessment-actions">{query.data.editable && <><Button onClick={() => setBank(!bank)}>Import from Question Bank</Button><Button disabled={busy} onClick={() => void save()}>Save Questions</Button></>}<span>{questions.reduce((sum, q) => sum + Number(q.marks), 0)} / {assessment.maxScore} marks</span></div>{bank && <QuestionBank classId={assessment.classId} subjectId={assessment.subjectId} onSelect={q => { if (!questions.some(x => x.id === q.id)) setQuestions(old => [...old, q]); setBank(false); }} />}{questions.map((q, i) => <article className="assessment-question" key={q.id}><h3>{q.section && `${q.section} · `}{i + 1}. {q.prompt} ({q.marks} marks)</h3><ol type="A">{q.options.map((option, j) => <li key={`${q.id}:${j}`}>{option}</li>)}</ol>{query.data.editable && <div className="assessment-filters"><label>Section<input value={q.section || ''} onChange={e => setQuestions(old => old.map(x => x.id === q.id ? { ...x, section: e.target.value } : x))} /></label><label>Marks<input type="number" min={0.01} max={1000} step="0.01" value={q.marks} onChange={e => setQuestions(old => old.map(x => x.id === q.id ? { ...x, marks: Number(e.target.value) } : x))} /></label><Button variant="outline" disabled={i === 0} onClick={() => move(i, -1)}>Move Up</Button><Button variant="outline" disabled={i === questions.length - 1} onClick={() => move(i, 1)}>Move Down</Button><Button variant="outline" onClick={() => setQuestions(old => old.filter(x => x.id !== q.id))}>Remove</Button></div>}</article>)}</>}</Panel>;
}
