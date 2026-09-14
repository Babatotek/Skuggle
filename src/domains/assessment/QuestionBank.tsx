import React, { useState } from 'react';
import { Button, EmptyState, StatusBadge } from '../../components/ui';
import { useAccess } from '../../state/ApplicationStateProviders';
import { mutate, queryString, useAssessmentQuery } from './api';
import { Pagination, Panel, QueryState } from './components';
import { label, QUESTION_TYPES } from './types';
import type { Lookups, Page, Question } from './types';

export function normalizeGeneratedQuestions(value: unknown): Question[] {
  const doc = value as { questions?: Record<string, unknown>[]; sectionA?: { questions?: Record<string, unknown>[] } };
  const list = doc?.questions || doc?.sectionA?.questions;
  if (!Array.isArray(list)) throw new Error('Generated content has no supported question list. Please regenerate.');
  return list.map(q => ({ id: crypto.randomUUID(), prompt: String(q.prompt || q.text || q.question || ''), questionType: QUESTION_TYPES.includes(String(q.questionType)) ? String(q.questionType) : 'multiple-choice', options: Array.isArray(q.options) ? q.options.map(String) : [], correctAnswer: String(q.correctAnswer || ''), rationale: String(q.explanation || ''), marks: Number(q.marks) || 1, difficulty: 'medium', topic: '', curriculum: '', status: 'draft', aiGenerated: true }));
}
export default function QuestionBank({ classId = '', subjectId = '', onSelect }: { classId?: string; subjectId?: string; onSelect?: (question: Question) => void }) {
  const { hasCapability } = useAccess();
  const lookups = useAssessmentQuery<Lookups>('/lookups/assessment-creation');
  const [filters, setFilters] = useState({ search: '', classId, subjectId, topic: '', curriculum: '', question_type: '', difficulty: '', status: onSelect ? 'accepted' : '', author: '', page: 1 });
  const query = useAssessmentQuery<Page<Question>>(`/assessment-questions?${queryString(filters)}`);
  const [editing, setEditing] = useState<Question | null>(null); const [creating, setCreating] = useState(false);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [generated, setGenerated] = useState<Question[]>([]);
  const [topic, setTopic] = useState('');
  const [mix, setMix] = useState({ mcq: 5, short: 2, essay: 1, easy: 30, medium: 50, difficult: 20 });
  const canCreate = hasCapability('assessment.assessment.create');
  const change = (key: string, value: string) => setFilters(old => ({ ...old, [key]: value, page: 1 }));
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action(); query.reload(); } catch (e) { setError(e instanceof Error ? e.message : 'Question action failed.'); } finally { setBusy(false); } };
  const generate = (regenerate = false) => run(async () => {
    const r = await mutate<{ assessment: unknown }>('/ai/assessment', 'POST', {
      assessmentType: 'test',
      subject: lookups.data?.subjects.find(s => s.id === filters.subjectId)?.name,
      classLevel: lookups.data?.classes.find(s => s.id === filters.classId)?.name,
      topics: topic,
      totalMarks: Math.max(1, mix.mcq + mix.short * 2 + mix.essay * 5),
      mcqCount: mix.mcq,
      shortAnswerCount: mix.short,
      essayCount: mix.essay,
      theoryCount: mix.short + mix.essay,
      difficultyMix: { easy: mix.easy, medium: mix.medium, difficult: mix.difficult },
      regenerate,
      includeExplanations: true,
    });
    setGenerated(normalizeGeneratedQuestions(r.data.assessment));
  });
  const create = (question: Question) => run(async () => {
    const payload: Record<string, unknown> = { ...question, classId: filters.classId, subjectId: filters.subjectId, learningObjective: question.learningObjective || topic, source: question.aiGenerated ? 'ai' : 'manual' };
    if (question.questionType === 'multiple-response') {
      payload.correctAnswers = String(question.correctAnswer || '').split(/\n|,/).map(v => v.trim()).filter(Boolean);
      payload.correctAnswer = undefined;
    }
    if (question.questionType === 'matching') {
      payload.matchingPairs = String(question.correctAnswer || '').split('\n').map(line => {
        const [left, right] = line.split('=').map(v => v.trim());
        return { left, right };
      }).filter(pair => pair.left && pair.right);
    }
    if (question.rubric?.length) payload.rubric = question.rubric;
    await mutate('/assessment-questions', 'POST', payload);
    setCreating(false);
    setEditing(null);
    setGenerated(old => old.filter(x => x.id !== question.id));
  });
  const newQuestion = (): Question => ({ id: crypto.randomUUID(), prompt: '', questionType: 'multiple-choice', options: [], correctAnswer: '', rationale: '', marks: 1, difficulty: 'medium', topic: '', curriculum: '', learningObjective: '', status: 'draft', aiGenerated: false, rubric: [] });
  return <Panel title="Question Bank" action={canCreate && !onSelect ? <Button onClick={() => { setCreating(true); setEditing(newQuestion()); }}>Add Question</Button> : undefined}>
    <div className="assessment-filters"><label>Search<input value={filters.search} onChange={e => change('search', e.target.value)} /></label><label>Class<select disabled={Boolean(classId)} value={filters.classId} onChange={e => { change('classId', e.target.value); change('subjectId', ''); }}><option value="">All classes</option>{lookups.data?.classes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Subject<select disabled={Boolean(subjectId)} value={filters.subjectId} onChange={e => change('subjectId', e.target.value)}><option value="">All subjects</option>{lookups.data?.subjects.filter(x => !filters.classId || x.classIds?.includes(filters.classId)).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Question type<select value={filters.question_type} onChange={e => change('question_type', e.target.value)}><option value="">All types</option>{QUESTION_TYPES.map(x => <option key={x} value={x}>{label(x)}</option>)}</select></label><label>Difficulty<select value={filters.difficulty} onChange={e => change('difficulty', e.target.value)}><option value="">All difficulties</option>{['easy', 'medium', 'difficult'].map(x => <option key={x}>{x}</option>)}</select></label><label>Review status<select disabled={Boolean(onSelect)} value={filters.status} onChange={e => change('status', e.target.value)}><option value="">All statuses</option>{['draft', 'accepted', 'rejected'].map(x => <option key={x}>{x}</option>)}</select></label><label>Topic<input value={filters.topic} onChange={e => change('topic', e.target.value)} /></label><label>Curriculum<input value={filters.curriculum} onChange={e => change('curriculum', e.target.value)} /></label><label>Author<select value={filters.author} onChange={e => change('author', e.target.value)}><option value="">All authors</option><option value="me">Me</option></select></label></div>
    {error && <p role="alert" className="assessment-error">{error}</p>}
    {canCreate && !onSelect && <details><summary>Generate with AI</summary><p className="assessment-muted">Select a class and subject above. Generated questions stay in draft until explicitly reviewed.</p><label>Topic / learning objectives<input value={topic} onChange={e => setTopic(e.target.value)} /></label><div className="assessment-form-grid"><label>MCQ count<input type="number" min={0} max={50} value={mix.mcq} onChange={e => setMix(old => ({ ...old, mcq: Number(e.target.value) }))} /></label><label>Short answer<input type="number" min={0} max={20} value={mix.short} onChange={e => setMix(old => ({ ...old, short: Number(e.target.value) }))} /></label><label>Essay<input type="number" min={0} max={10} value={mix.essay} onChange={e => setMix(old => ({ ...old, essay: Number(e.target.value) }))} /></label><label>Easy %<input type="number" min={0} max={100} value={mix.easy} onChange={e => setMix(old => ({ ...old, easy: Number(e.target.value) }))} /></label><label>Medium %<input type="number" min={0} max={100} value={mix.medium} onChange={e => setMix(old => ({ ...old, medium: Number(e.target.value) }))} /></label><label>Difficult %<input type="number" min={0} max={100} value={mix.difficult} onChange={e => setMix(old => ({ ...old, difficult: Number(e.target.value) }))} /></label></div><div className="assessment-actions"><Button disabled={busy || !topic || !filters.classId || !filters.subjectId} onClick={() => void generate(false)}>Generate Draft Questions</Button><Button variant="outline" disabled={busy || !topic || !filters.classId || !filters.subjectId} onClick={() => void generate(true)}>Regenerate</Button></div>{generated.map(q => <article className="assessment-question" key={q.id}><StatusBadge status="draft" /> <span>AI Generated</span><p>{q.prompt}</p><div className="assessment-actions"><Button disabled={busy} onClick={() => void create(q)}>Save to Draft Bank</Button><Button variant="outline" onClick={() => { setCreating(true); setEditing(q); }}>Edit</Button><Button variant="outline" onClick={() => setGenerated(old => old.filter(x => x.id !== q.id))}>Reject</Button></div></article>)}</details>}
    {editing && <form className="assessment-panel" onSubmit={e => { e.preventDefault(); if (creating) void create(editing); else void run(async () => { await mutate(`/assessment-questions/${editing.id}`, 'PATCH', { prompt: editing.prompt, correctAnswer: editing.correctAnswer, marks: editing.marks, learningObjective: editing.learningObjective }); setEditing(null); }); }}><h3>{creating ? 'New draft question' : 'Edit question'}</h3><p className="assessment-muted">Editing an accepted question returns it to draft for review.</p><label>Question<textarea required maxLength={20000} value={editing.prompt} onChange={e => setEditing({ ...editing, prompt: e.target.value })} /></label>{creating && <><label>Type<select value={editing.questionType} onChange={e => setEditing({ ...editing, questionType: e.target.value })}>{QUESTION_TYPES.map(x => <option key={x}>{x}</option>)}</select></label><label>Options (one per line){editing.questionType === 'multiple-response' ? ' — tick correct answers in Answer field as one per line' : editing.questionType === 'matching' ? ' — optional; put pairs as Left=Right in Answer' : ''}<textarea value={Array.isArray(editing.options) ? editing.options.filter(o => typeof o === 'string').join('\n') : ''} onChange={e => setEditing({ ...editing, options: e.target.value.split('\n') })} /></label><label>Topic<input value={editing.topic} onChange={e => setEditing({ ...editing, topic: e.target.value })} /></label><label>Curriculum<input value={editing.curriculum} onChange={e => setEditing({ ...editing, curriculum: e.target.value })} /></label><label>Learning objective<input value={editing.learningObjective || ''} onChange={e => setEditing({ ...editing, learningObjective: e.target.value })} /></label>{['essay', 'project', 'short-answer'].includes(editing.questionType) && <label>Rubric criteria (Label|max marks per line)<textarea value={(editing.rubric || []).map(r => `${r.label}|${r.maxMarks}`).join('\n')} onChange={e => setEditing({ ...editing, rubric: e.target.value.split('\n').map(line => { const [label, max] = line.split('|'); return { label: (label || '').trim(), maxMarks: Number(max) || 1 }; }).filter(r => r.label) })} /></label>}</>}<label>Answer / marking guide{editing.questionType === 'multiple-response' ? ' (correct options, one per line)' : editing.questionType === 'matching' ? ' (pairs as Left=Right, one per line)' : ''}<textarea value={editing.correctAnswer} onChange={e => setEditing({ ...editing, correctAnswer: e.target.value })} /></label><label>Marks<input required type="number" min={0.01} max={1000} step="0.01" value={editing.marks} onChange={e => setEditing({ ...editing, marks: Number(e.target.value) })} /></label><div className="assessment-actions"><Button type="submit" disabled={busy || (creating && (!filters.classId || !filters.subjectId))}>Save Draft</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div></form>}
    <QueryState query={query} name="Question Bank" />{query.data && <>{!query.data.data.length && <EmptyState title="No questions in this Question Bank." />}{query.data.data.map(q => <article className="assessment-question" key={q.id}><h3>{label(q.questionType)} · {q.marks} marks · <StatusBadge status={q.status} /></h3>{q.aiGenerated ? <><small>AI Generated · {q.status === 'accepted' ? 'Human reviewed' : 'Review required'}</small><p className="assessment-muted">{q.learningObjective || q.source || ''}</p></> : q.learningObjective ? <p className="assessment-muted">{q.learningObjective}</p> : null}<p>{q.prompt}</p><ol>{q.options.map((x, i) => <li key={`${q.id}-option-${i}`}>{x}</li>)}</ol><details><summary>Answer and rationale</summary><p>{q.correctAnswer}</p><p>{q.rationale}</p></details><div className="assessment-actions">{onSelect ? <Button onClick={() => onSelect(q)}>Add to Assessment</Button> : <>{canCreate && <Button variant="outline" disabled={busy} onClick={() => { setCreating(false); setEditing(q); }}>Edit</Button>}{canCreate && <label className="assessment-link">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const data = new FormData(); data.append('file', file); void run(async () => { await mutate(`/assessment-questions/${q.id}/media`, 'POST', data); }); }} /></label>}{hasCapability('assessment.question.review') && q.status === 'draft' && <><Button disabled={busy} onClick={() => void run(async () => { await mutate(`/assessment-questions/${q.id}`, 'PATCH', { status: 'accepted' }); })}>Accept</Button><Button variant="outline" disabled={busy} onClick={() => void run(async () => { await mutate(`/assessment-questions/${q.id}`, 'PATCH', { status: 'rejected' }); })}>Reject</Button></>}</>}</div></article>)}<Pagination meta={query.data.meta} onPage={page => setFilters(old => ({ ...old, page }))} /></>}
  </Panel>;
}
