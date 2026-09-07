import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui';
import { buildRoute } from '../../routing/builders';
import { describeApiError, getStudentCbt, saveStudentCbt, submitStudentCbt, type StudentCbtPlayer } from './api';
import './student-cbt.css';

const FREE_TEXT = new Set(['short-answer', 'essay', 'fill-blank', 'calculation']);

export default function StudentCbtPlayerPage() {
  const { assessmentPublicId = '' } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<StudentCbtPlayer | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState('');
  const [result, setResult] = useState<{ score: number; maxScore: number; percentage: number; needsMarking?: boolean } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    let cancelled = false;
    void getStudentCbt(assessmentPublicId)
      .then(r => {
        if (cancelled) return;
        setPaper(r.data);
        setAnswers(r.data.answers || {});
      })
      .catch(e => { if (!cancelled) setError(describeApiError(e)); });
    return () => { cancelled = true; };
  }, [assessmentPublicId]);

  useEffect(() => {
    if (!paper?.availableUntil || !paper.canAttempt || result) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((Date.parse(paper.availableUntil!) - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [paper?.availableUntil, paper?.canAttempt, result]);

  useEffect(() => {
    if (!paper?.canAttempt || result) return;
    const timer = window.setTimeout(() => {
      setSaveState('Saving…');
      void saveStudentCbt(paper.id, answersRef.current)
        .then(() => setSaveState('Saved'))
        .catch(() => setSaveState('Save failed'));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [answers, paper?.id, paper?.canAttempt, result]);

  useEffect(() => {
    if (secondsLeft !== 0 || !paper?.canAttempt || busy || result) return;
    void onSubmit(true);
  }, [secondsLeft]);

  const question = paper?.questions[index];
  const answered = useMemo(() => Object.values(answers).filter(v => String(v || '').trim() !== '').length, [answers]);

  const onSubmit = async (auto = false) => {
    if (!paper || busy || result) return;
    setBusy(true);
    setError('');
    try {
      const response = await submitStudentCbt(paper.id, answersRef.current);
      setResult(response.data);
      if (!auto) setError('');
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (error && !paper) {
    return <div className="student-cbt-player"><div className="student-cbt-error" role="alert"><p>{error}</p><Button variant="outline" onClick={() => navigate(buildRoute('school.student-cbt'))}>Back</Button></div></div>;
  }
  if (!paper) return <div className="student-cbt-player"><div className="student-cbt-skeleton" role="status" aria-label="Loading CBT paper"><div /><div /></div></div>;

  if (result) {
    return (
      <div className="student-cbt-player">
        <header className="student-cbt-player-header"><h1>{paper.title}</h1></header>
        <div className="student-cbt-result" role="status">
          <h2>Submitted</h2>
          {result.needsMarking
            ? <p>Your objective answers were auto-marked ({result.score} provisional marks). Written responses are with your teacher for marking.</p>
            : <p>Score: {result.score} / {result.maxScore} ({result.percentage}%)</p>}
          <Link className="student-cbt-link" to={buildRoute('school.student-cbt')}>Back to my CBT assessments</Link>
        </div>
      </div>
    );
  }

  if (!paper.canAttempt) {
    return (
      <div className="student-cbt-player">
        <header className="student-cbt-player-header"><h1>{paper.title}</h1></header>
        <p className="student-cbt-muted">{paper.submitted ? 'You have already submitted this assessment.' : 'This assessment is not open for attempts right now.'}</p>
        <Link className="student-cbt-link" to={buildRoute('school.student-cbt')}>Back</Link>
      </div>
    );
  }

  const clock = secondsLeft === null ? '' : `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const isFreeText = question ? FREE_TEXT.has(question.questionType) : false;

  return (
    <div className="student-cbt-player">
      <header className="student-cbt-player-header">
        <div>
          <p className="student-cbt-brand">Skuggle CBT</p>
          <h1>{paper.title}</h1>
          <p>{paper.className} · {paper.subject} · {paper.maxScore} marks · {saveState || (paper.attemptStatus === 'in_progress' ? 'Resumed' : 'Ready')}</p>
        </div>
        <div className="student-cbt-timer" role="timer" aria-live="polite">{clock}</div>
      </header>
      {paper.instructions && <p className="student-cbt-instructions">{paper.instructions}</p>}
      {error && <p className="student-cbt-error" role="alert">{error}</p>}
      {question && (
        <article className="student-cbt-question">
          <h2>{question.section ? `${question.section} · ` : ''}Question {question.number} of {paper.questions.length} ({question.marks} marks)</h2>
          <p>{question.prompt}</p>
          {isFreeText ? (
            <label className="student-cbt-free-text">
              <span className="sr-only">Your answer</span>
              <textarea
                rows={question.questionType === 'essay' ? 10 : 4}
                maxLength={5000}
                value={answers[question.id] || ''}
                onChange={e => setAnswers(old => ({ ...old, [question.id]: e.target.value }))}
                placeholder="Type your answer"
              />
            </label>
          ) : (
            <div className="student-cbt-options" role="radiogroup" aria-label={`Answers for question ${question.number}`}>
              {question.options.map(option => (
                <label key={option} className={answers[question.id] === option ? 'selected' : undefined}>
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option}
                    onChange={() => setAnswers(old => ({ ...old, [question.id]: option }))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
        </article>
      )}
      <footer className="student-cbt-player-footer">
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>Previous</Button>
        <span>{answered}/{paper.questions.length} answered</span>
        {index < paper.questions.length - 1 ? (
          <Button onClick={() => setIndex(i => i + 1)}>Next</Button>
        ) : (
          <Button disabled={busy} onClick={() => void onSubmit(false)}>{busy ? 'Submitting…' : 'Submit answers'}</Button>
        )}
      </footer>
    </div>
  );
}
