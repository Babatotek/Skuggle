import React, { useEffect, useRef, useState } from 'react';
import { Button, StatusBadge } from '../../components/ui';
import { mutate, useAssessmentQuery } from './api';
import { Panel, QueryState } from './components';
import type { ScoreRow, Scores } from './types';
import { pasteScores, validScore } from './scoreLogic';

const ScoreEntryGrid: React.FC<{ id: string }> = ({ id }) => {
  const query = useAssessmentQuery<Scores>(`/assessments/${id}/scores`);
  const [rows, setRows] = useState<ScoreRow[]>([]); const [undo, setUndo] = useState<ScoreRow[][]>([]);
  const [revision, setRevision] = useState(''); const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [invalid, setInvalid] = useState<Record<string, string>>({});
  const [theoryStudentId, setTheoryStudentId] = useState(''); const [theoryBusy, setTheoryBusy] = useState(false);
  const [theorySuggestion, setTheorySuggestion] = useState<{ suggestedScore: number; feedback?: string; confidence?: number; rubricBreakdown?: { criterion: string; score: number; max: number }[] } | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]); const editVersion = useRef(0); const saveInFlight = useRef(false);
  useEffect(() => { if (query.data && !dirty) { setRows(query.data.students); setRevision(query.data.revision); setUndo([]); setInvalid({}); } }, [query.data]);
  useEffect(() => { const leave = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', leave); return () => window.removeEventListener('beforeunload', leave); }, [dirty]);
  const change = (next: ScoreRow[]) => { setUndo(old => [...old.slice(-19), rows]); setRows(next); setDirty(true); setSaved(false); editVersion.current++; };
  const save = async () => {
    if (!query.data?.editable || !dirty || saveInFlight.current || Object.keys(invalid).length || error) return;
    const version = editVersion.current; saveInFlight.current = true; setBusy(true);
    try { const result = await mutate<{ revision: string }>(`/assessments/${id}/scores`, 'PUT', { revision, scores: Object.fromEntries(rows.map(r => [r.id, r.score])), states: Object.fromEntries(rows.map(r => [r.id, ['ABSENT', 'EXEMPT', 'NOT_ENTERED'].includes(r.state) ? r.state : 'ENTERED'])), comments: Object.fromEntries(rows.map(r => [r.id, r.comment])) }); setRevision(result.data.revision); if (version === editVersion.current) { setDirty(false); setSaved(true); } }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save scores.'); }
    finally { saveInFlight.current = false; setBusy(false); }
  };
  useEffect(() => { if (dirty && !busy && !error && !Object.keys(invalid).length) { const timer = setTimeout(() => void save(), 1000); return () => clearTimeout(timer); } }, [rows, dirty, busy, error, invalid, revision]);
  if (!query.data) return <QueryState query={query} name="assessment scores" />;
  const data = query.data;
  const complete = rows.filter(r => r.score !== null || ['ABSENT', 'EXEMPT'].includes(r.state)).length;
  return <Panel title="Score Entry"><div className="assessment-actions"><StatusBadge status={data.status} /><span role="status">{complete}/{rows.length} complete · {busy ? 'Saving…' : dirty ? 'Unsaved changes' : saved ? 'All changes saved' : 'Loaded'}</span><Button variant="outline" disabled={!undo.length || !data.editable || busy} onClick={() => { const previous = undo.at(-1); if (previous) { setRows(previous); setUndo(undo.slice(0, -1)); setInvalid({}); setDirty(true); editVersion.current++; } }}>Undo</Button><Button disabled={!dirty || busy || Boolean(error) || Boolean(Object.keys(invalid).length)} onClick={() => void save()}>Save now</Button></div>
    {!data.editable && <p className="assessment-muted">Scores are read-only in this assessment state or for your current access.</p>}
    {error && <div role="alert" className="assessment-error"><p>{error}</p><p>Your unsaved entries remain visible. Copy them before reloading if another user changed this assessment.</p><Button variant="outline" onClick={() => { setError(''); }}>Retry save</Button><Button variant="outline" onClick={() => { setDirty(false); setError(''); query.reload(); }}>Discard changes & Reload</Button></div>}
    {data.editable && rows.length > 0 && (
      <details className="assessment-panel" style={{ marginBottom: '1rem' }}>
        <summary>Theory AI assist (suggest → verify)</summary>
        <p className="assessment-muted">Generate a suggested mark from the student&apos;s submitted theory answers, then verify before applying.</p>
        <div className="assessment-actions">
          <label>Student
            <select value={theoryStudentId} onChange={e => { setTheoryStudentId(e.target.value); setTheorySuggestion(null); }} disabled={theoryBusy}>
              <option value="">Select…</option>
              {rows.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
            </select>
          </label>
          <Button variant="outline" disabled={!theoryStudentId || theoryBusy} onClick={() => void (async () => {
            setTheoryBusy(true); setError('');
            try {
              const result = await mutate<{ suggestedScore: number; feedback?: string; confidence?: number; rubricBreakdown?: { criterion: string; score: number; max: number }[] }>(`/assessments/${id}/theory/${theoryStudentId}/suggest`, 'POST', {});
              setTheorySuggestion(result.data);
            } catch (e) { setError(e instanceof Error ? e.message : 'Unable to suggest theory marks.'); }
            finally { setTheoryBusy(false); }
          })()}>Suggest</Button>
          <Button disabled={!theoryStudentId || !theorySuggestion || theoryBusy} onClick={() => void (async () => {
            if (!theorySuggestion) return;
            setTheoryBusy(true); setError('');
            try {
              const result = await mutate<{ score: number; revision: string }>(`/assessments/${id}/theory/${theoryStudentId}/apply`, 'POST', { score: theorySuggestion.suggestedScore, suggestion: theorySuggestion });
              setRevision(result.data.revision);
              change(rows.map(r => r.id === theoryStudentId ? { ...r, score: result.data.score, state: 'ENTERED' } : r));
              setDirty(false); setSaved(true); setTheorySuggestion(null);
            } catch (e) { setError(e instanceof Error ? e.message : 'Unable to apply theory suggestion.'); }
            finally { setTheoryBusy(false); }
          })()}>Apply verified score</Button>
        </div>
        {theorySuggestion && (
          <div role="status">
            <p><strong>Suggested:</strong> {theorySuggestion.suggestedScore}{theorySuggestion.confidence != null ? ` · confidence ${(theorySuggestion.confidence * 100).toFixed(0)}%` : ''}</p>
            {theorySuggestion.feedback && <p className="assessment-muted">{theorySuggestion.feedback}</p>}
            {theorySuggestion.rubricBreakdown?.length ? <ul>{theorySuggestion.rubricBreakdown.map((item, i) => <li key={i}>{item.criterion}: {item.score}/{item.max}</li>)}</ul> : null}
            <label>Adjust before apply<input type="number" min={0} max={data.maxScore} step="0.01" value={theorySuggestion.suggestedScore} onChange={e => setTheorySuggestion({ ...theorySuggestion, suggestedScore: Number(e.target.value) })} /></label>
          </div>
        )}
      </details>
    )}
    <table className="assessment-score-grid"><caption className="assessment-muted">Enter / ↑ / ↓ moves between scores. Paste a spreadsheet score column. Maximum: {data.maxScore}.</caption><thead><tr><th scope="col">Student</th><th scope="col">Score</th><th scope="col">Status</th><th scope="col">Comment</th></tr></thead><tbody>{rows.map((row, i) => <tr key={row.id}><td data-label="Student"><strong>{row.fullName}</strong><br /><small>{row.admissionNumber}</small></td><td data-label="Score"><input ref={el => { inputs.current[i] = el; }} type="number" inputMode="decimal" min={0} max={data.maxScore} step="0.01" aria-label={`Score for ${row.fullName}`} aria-invalid={Boolean(invalid[row.id])} disabled={!data.editable} value={invalid[row.id] ?? row.score ?? ''} onChange={e => { const value = e.target.value; if (!validScore(value, data.maxScore)) { setInvalid(old => ({ ...old, [row.id]: value })); return; } setInvalid(old => { const next = { ...old }; delete next[row.id]; return next; }); change(rows.map(r => r.id === row.id ? { ...r, score: value === '' ? null : Number(value), state: value === '' ? 'NOT_ENTERED' : 'ENTERED' } : r)); }} onKeyDown={e => { if (['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); inputs.current[i + (e.key === 'ArrowUp' ? -1 : 1)]?.focus(); } }} onPaste={e => { e.preventDefault(); try { change(pasteScores(rows, i, e.clipboardData.getData('text'), data.maxScore)); setInvalid({}); } catch (e) { setError(e instanceof Error ? e.message : 'Invalid paste'); } }} />{invalid[row.id] !== undefined && <small role="alert">Enter a score from 0 to {data.maxScore}.</small>}</td><td data-label="Status"><select aria-label={`Status for ${row.fullName}`} disabled={!data.editable} value={['NOT_ENTERED', 'ENTERED', 'ABSENT', 'EXEMPT'].includes(row.state) ? row.state : 'ENTERED'} onChange={e => change(rows.map(r => r.id === row.id ? { ...r, state: e.target.value, score: e.target.value === 'ENTERED' ? (r.score ?? 0) : null } : r))}>{['NOT_ENTERED', 'ENTERED', 'ABSENT', 'EXEMPT'].map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}</select></td><td data-label="Comment"><input aria-label={`Comment for ${row.fullName}`} maxLength={1000} disabled={!data.editable} value={row.comment} onChange={e => change(rows.map(r => r.id === row.id ? { ...r, comment: e.target.value } : r))} /></td></tr>)}</tbody></table>{!rows.length && <p>No eligible students in this assessment roster.</p>}</Panel>;
};
export default ScoreEntryGrid;
