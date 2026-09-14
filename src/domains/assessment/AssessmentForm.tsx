import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { mutate, queryString, useAssessmentQuery } from './api';
import { assessmentHref, Pagination, Panel, QueryState } from './components';
import type { Assessment, AssessmentInput, Lookups, Page, Lookup } from './types';

const steps = ['Assessment Details', 'Participants & Scope', 'Questions / Scores', 'Delivery Method', 'Scoring', 'Schedule', 'Review & Publish'];
const initial: AssessmentInput = { title: '', classId: '', subjectId: '', assessmentTypeId: 'test', date: '', maxScore: 40, instructions: '', description: '', weighting: 0, code: '', participantMode: 'class', studentIds: [], arms: [], contentMode: 'score-only', delivery: 'manual', startTime: '09:00', duration: 60, venue: '', invigilator: '', passThreshold: 0, latePolicy: 'reject', randomQuestions: false, randomOptions: false, attemptLimit: 1, resumePolicy: 'allow', feedbackPolicy: 'score', navigationRestricted: false };

export default function AssessmentForm({ id }: { id?: string }) {
  const lookups = useAssessmentQuery<Lookups>('/lookups/assessment-creation');
  const item = useAssessmentQuery<Assessment>(id ? `/assessments/${id}` : null);
  const [form, setForm] = useState<AssessmentInput>(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [participantPage, setParticipantPage] = useState(1);
  const needsStudentPick = form.participantMode === 'selected' || form.participantMode === 'special-cohort';
  const participants = useAssessmentQuery<Page<Lookup>>(step === 1 && needsStudentPick && form.classId && form.subjectId ? `/assessments/participants?${queryString({ classId: form.classId, subjectId: form.subjectId, page: participantPage })}` : null);
  const navigate = useNavigate();
  useEffect(() => { if (item.data) setForm({ ...initial, ...item.data.metadata, title: item.data.title, classId: item.data.classId, subjectId: item.data.subjectId, assessmentTypeId: item.data.type, date: item.data.date || '', maxScore: item.data.maxScore, arms: item.data.metadata.arms || [] }); }, [item.data]);
  const change = <K extends keyof AssessmentInput>(key: K, value: AssessmentInput[K]) => setForm(old => ({ ...old, [key]: value }));
  const siblingArms = useMemo(() => {
    if (!lookups.data || !form.classId) return [] as string[];
    const selected = lookups.data.classes.find(x => x.id === form.classId);
    if (!selected?.baseName) return [];
    return [...new Set(lookups.data.classes.filter(x => x.baseName === selected.baseName).map(x => x.arm || '').filter(Boolean))];
  }, [lookups.data, form.classId]);
  const save = async (activate: boolean) => {
    setBusy(true); setError('');
    try {
      const result = await mutate<{ id: string }>(id ? `/assessments/${id}` : '/assessments', id ? 'PATCH' : 'POST', form);
      if (activate && form.contentMode === 'score-only') {
        const { get } = await import('./api');
        const current = await get<Assessment>(`/assessments/${result.data.id}`);
        await mutate(`/assessments/${result.data.id}/transition`, 'POST', { action: 'ready', revision: current.data.revision });
      }
      navigate(assessmentHref(result.data.id, form.contentMode === 'questions' || form.contentMode === 'rubric' ? 'questions' : 'detail'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save assessment.'); } finally { setBusy(false); }
  };
  if (!lookups.data || (id && !item.data)) return <QueryState query={id && !item.data ? item : lookups} name="assessment creation options" />;
  const data = lookups.data;
  const subjects = data.subjects.filter(x => x.classIds?.includes(form.classId));
  const participantLabel = form.participantMode === 'class' || form.participantMode === 'arm'
    ? 'Entire class / arm'
    : form.participantMode === 'subject-group'
      ? 'Subject group across arms'
      : form.participantMode === 'multiple-arms'
        ? `${(form.arms || []).length} arm(s)`
        : `${form.studentIds.length} selected students`;
  return <Panel title={steps[step]}><ol className="assessment-steps" aria-label="Creation steps">{steps.map((name, i) => <li key={name} aria-current={i === step ? 'step' : undefined}>{i + 1}. {name}</li>)}</ol>
    <form onSubmit={e => {
      e.preventDefault();
      if (step === 1 && needsStudentPick && !form.studentIds.length) { setError('Select at least one student.'); return; }
      if (step === 1 && form.participantMode === 'multiple-arms' && !(form.arms || []).length) { setError('Select at least one arm.'); return; }
      setError('');
      if (step < 6) setStep(step + 1);
      else void save(false);
    }}>
      {error && <p className="assessment-error" role="alert">{error}</p>}
      {step === 0 && <div className="assessment-form-grid"><label>Assessment title<input required maxLength={180} value={form.title} onChange={e => change('title', e.target.value)} /></label><label>Assessment type<select value={form.assessmentTypeId} onChange={e => change('assessmentTypeId', e.target.value)}>{data.assessmentTypes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Session<input readOnly value={data.session.name} /></label><label>Term<input readOnly value={data.term.name} /></label><label>Class / arm<select required value={form.classId} onChange={e => { setForm(old => ({ ...old, classId: e.target.value, subjectId: '', studentIds: [], arms: [] })); }}><option value="">Select class</option>{data.classes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Subject<select required value={form.subjectId} onChange={e => change('subjectId', e.target.value)}><option value="">Select subject</option>{subjects.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Assessment code<input maxLength={80} value={form.code} onChange={e => change('code', e.target.value)} /></label><label>Description<textarea maxLength={5000} value={form.description} onChange={e => change('description', e.target.value)} /></label><label className="span-full">Instructions<textarea maxLength={5000} value={form.instructions} onChange={e => change('instructions', e.target.value)} /></label></div>}
      {step === 1 && <>
        <label>Participant scope<select value={form.participantMode} onChange={e => change('participantMode', e.target.value as AssessmentInput['participantMode'])}>
          <option value="class">Whole class / selected arm</option>
          <option value="arm">Single arm (selected class)</option>
          <option value="selected">Selected students</option>
          <option value="subject-group">Subject group (all arms offering subject)</option>
          <option value="multiple-arms">Multiple arms</option>
          <option value="special-cohort">Special cohort</option>
        </select></label>
        {(form.participantMode === 'class' || form.participantMode === 'arm') && <p className="assessment-muted">All active students enrolled in {data.classes.find(x => x.id === form.classId)?.name} for {data.session.name}.</p>}
        {form.participantMode === 'subject-group' && <p className="assessment-muted">Includes every active student in arms that share this class level and offer {data.subjects.find(x => x.id === form.subjectId)?.name}.</p>}
        {form.participantMode === 'multiple-arms' && <div className="assessment-form-grid">{siblingArms.length === 0 ? <p className="assessment-muted">No sibling arms found for this class level.</p> : siblingArms.map(arm => <label key={arm} className="assessment-actions"><input type="checkbox" checked={(form.arms || []).includes(arm)} onChange={e => change('arms', e.target.checked ? [...(form.arms || []), arm] : (form.arms || []).filter(x => x !== arm))} />Arm {arm}</label>)}</div>}
        {needsStudentPick && <><p className="assessment-muted">{form.participantMode === 'special-cohort' ? 'Build a special cohort from students in this class.' : 'Select individual students from the class roster.'}</p><QueryState query={participants} name="eligible participants" />{participants.data && <><p>{form.studentIds.length} selected</p>{participants.data.data.map(student => <label key={student.id} className="assessment-actions"><input type="checkbox" checked={form.studentIds.includes(student.id)} onChange={e => change('studentIds', e.target.checked ? [...form.studentIds, student.id] : form.studentIds.filter(id => id !== student.id))} />{student.name}</label>)}<Pagination meta={participants.data.meta} onPage={setParticipantPage} /></>}</>}
      </>}
      {step === 2 && <><label>Assessment content<select value={form.delivery === 'cbt' ? 'questions' : form.contentMode} disabled={form.delivery === 'cbt'} onChange={e => change('contentMode', e.target.value as AssessmentInput['contentMode'])}><option value="score-only">Score-only / manual marking</option><option value="questions">Question-based assessment</option><option value="rubric">Rubric-based / practical</option></select></label><p className="assessment-muted">{form.delivery === 'cbt' || form.contentMode === 'questions' ? 'Save the draft to open the builder, add reviewed questions, arrange sections, and preview the paper before scheduling.' : form.contentMode === 'rubric' ? 'Add theory/practical questions with rubric criteria in the builder. Rubric scores are recorded per student during theory assist and marking.' : 'Enter teacher-verified scores in the score grid after delivery.'}</p></>}
      {step === 3 && <><label>Delivery method<select value={form.delivery} onChange={e => { const delivery = e.target.value; setForm(old => ({ ...old, delivery, contentMode: delivery === 'cbt' ? 'questions' : delivery === 'smartmark' ? 'questions' : old.contentMode, venue: delivery === 'cbt' && !old.venue ? 'Online' : old.venue, invigilator: delivery === 'cbt' && !old.invigilator ? 'System' : old.invigilator })); }}><option value="manual">Teacher Score Entry</option><option value="paper">Printed Paper</option><option value="smartmark">SmartMark Paper</option><option value="cbt">Computer-Based Test (CBT)</option><option value="project">Project / Practical</option><option value="oral">Oral</option></select></label>{form.delivery === 'cbt' && <p className="assessment-muted">CBT uses the Assessment roster and availability window (start time + duration). Venue defaults to Online.</p>}{form.delivery === 'smartmark' && <p className="assessment-muted">Build MCQ/true-false questions, print the SmartMark OMR bubble sheets from Questions &amp; Paper, then upload rescans under Marking → Exceptions.</p>}</>}
      {step === 4 && <div className="assessment-form-grid"><label>Maximum score<input required type="number" min={0.01} max={1000} step="0.01" value={form.maxScore} onChange={e => change('maxScore', Number(e.target.value))} /></label><label>Weighting (%)<input type="number" min={0} max={100} step="0.01" value={form.weighting} onChange={e => change('weighting', Number(e.target.value))} /></label><label>Pass threshold<input type="number" min={0} max={1000} step="0.01" value={form.passThreshold || 0} onChange={e => change('passThreshold', Number(e.target.value))} /></label>{form.delivery === 'cbt' && <><label>Attempt limit<input type="number" min={1} max={10} value={form.attemptLimit || 1} onChange={e => change('attemptLimit', Number(e.target.value))} /></label><label>Resume policy<select value={form.resumePolicy || 'allow'} onChange={e => change('resumePolicy', e.target.value)}><option value="allow">Allow resume</option><option value="deny">Deny resume</option></select></label><label>Feedback policy<select value={form.feedbackPolicy || 'score'} onChange={e => change('feedbackPolicy', e.target.value)}><option value="none">Hide score</option><option value="score">Show score</option><option value="detailed">Detailed</option></select></label><label>Late policy<select value={form.latePolicy || 'reject'} onChange={e => change('latePolicy', e.target.value)}><option value="reject">Reject late entry</option><option value="allow">Allow late entry</option></select></label><label className="assessment-actions"><input type="checkbox" checked={Boolean(form.randomQuestions)} onChange={e => change('randomQuestions', e.target.checked)} />Random question order</label><label className="assessment-actions"><input type="checkbox" checked={Boolean(form.randomOptions)} onChange={e => change('randomOptions', e.target.checked)} />Random option order</label><label className="assessment-actions"><input type="checkbox" checked={Boolean(form.navigationRestricted)} onChange={e => change('navigationRestricted', e.target.checked)} />Restrict back navigation</label></>}<p className="span-full assessment-muted">Absent and exempt students have no numeric score. Missing entries must be resolved before moderation or locking.</p></div>}
      {step === 5 && <div className="assessment-form-grid"><label>Date<input required type="date" value={form.date} onChange={e => change('date', e.target.value)} /></label><label>Start time<input required type="time" value={form.startTime} onChange={e => change('startTime', e.target.value)} /></label><label>Duration (minutes)<input required type="number" min={1} max={600} value={form.duration} onChange={e => change('duration', Number(e.target.value))} /></label><label>Venue<input required value={form.venue} maxLength={180} onChange={e => change('venue', e.target.value)} /></label><label>Invigilator<input required value={form.invigilator} maxLength={180} onChange={e => change('invigilator', e.target.value)} /></label><p className="span-full assessment-muted">{form.delivery === 'cbt' ? 'CBT availability is start time through start + duration. Class overlaps are still blocked; Online venue does not count as a room conflict.' : 'Venue and invigilator are required before an assessment can be scheduled. Overlaps on class, venue or invigilator are blocked.'}</p></div>}
      {step === 6 && <><dl className="assessment-detail-list">{Object.entries({ Title: form.title, Class: data.classes.find(x => x.id === form.classId)?.name, Subject: data.subjects.find(x => x.id === form.subjectId)?.name, Participants: participantLabel, Content: form.contentMode, Delivery: form.delivery, 'Maximum score': form.maxScore, Schedule: `${form.date} ${form.startTime}`, Duration: `${form.duration} minutes`, Venue: form.venue, Invigilator: form.invigilator }).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p className="assessment-muted">Scheduling and delivery are explicit actions from the saved assessment. Questions must be reviewed before the assessment can become ready.</p></>}
      <div className="assessment-form-footer"><Button type="button" variant="outline" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Back</Button><div className="assessment-actions">{step === 6 && form.contentMode === 'score-only' && <Button type="button" variant="outline" disabled={busy} onClick={() => void save(true)}>Save & Mark Ready</Button>}<Button type="submit" isLoading={busy}>{step === 6 ? 'Save Draft' : 'Continue'}</Button></div></div>
    </form></Panel>;
}
