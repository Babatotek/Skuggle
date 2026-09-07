import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck, BarChart3, BookOpenCheck, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, FileCheck2, FilePlus2, FileText, Filter, Gauge, GraduationCap,
  LayoutDashboard, Loader2, MoreHorizontal, PenLine, PieChart, Plus, Search,
  Settings2, ShieldCheck, Sparkles, Upload, WandSparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AssessmentRecord } from '../../types';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';
import { Button, DataTable, Drawer, EmptyState, Modal, StatusBadge } from '../../components/ui';
import { AssessmentStudio } from './AssessmentsView';

const SmartMarkScanner = lazy(() => import('./SmartMarkScanner').then((m) => ({ default: m.SmartMarkScanner })));

type PrimaryTab = 'overview' | 'assessments' | 'questions' | 'marking' | 'results' | 'settings';
type AssessmentSubtab = 'continuous' | 'tests' | 'examinations' | 'studio';
type MarkingSubtab = 'entry' | 'manual' | 'scan';
type ResultsSubtab = 'results' | 'approval' | 'cards' | 'publishing';
type SettingsSubtab = 'grades' | 'weights' | 'workflow' | 'pin' | 'general';

interface LookupItem { id: string; name: string; defaultMaxScore?: number }
interface CreationLookups { classes: LookupItem[]; subjects: Array<LookupItem & { classIds?: string[] }>; assessmentTypes: LookupItem[]; session: LookupItem; term: LookupItem }
interface CreateForm { title: string; classId: string; subjectId: string; assessmentTypeId: string; maxScore: number; date: string; instructions: string }

const formControl = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100';

function subjectsForClass(lookups: CreationLookups, classId: string) {
  const linked = lookups.subjects.filter((subject) => !subject.classIds?.length || subject.classIds.includes(classId));
  return linked.length ? linked : lookups.subjects;
}

const primaryTabs: Array<{ id: PrimaryTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assessments', label: 'Assessments', icon: ClipboardList },
  { id: 'questions', label: 'Question Bank', icon: BookOpenCheck },
  { id: 'marking', label: 'Marking', icon: PenLine },
  { id: 'results', label: 'Results', icon: FileCheck2 },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const statusVariant = (status: string) => ['Approved', 'Published', 'Validated'].includes(status) ? 'success' : status === 'Draft' ? 'warning' : 'info';
const shortDate = (value?: string) => value ? new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Not scheduled';

export const AssessmentWorkspace: React.FC<{ initialTab?: PrimaryTab; initialType?: AssessmentSubtab }> = ({ initialTab, initialType }) => {
  const { assessments, currentUser, branding, showToast } = useApp();
  const permissions = new Set(currentUser.permissions || []);
  const canCreate = permissions.has('assessment.create');
  const canMark = permissions.has('assessment.mark') || permissions.has('assessment.create');
  const canApprove = permissions.has('assessment.approve') || permissions.has('results.approve');
  const canPublish = permissions.has('assessment.publish') || permissions.has('results.publish');
  const canConfigure = permissions.has('assessment.configure') || permissions.has('settings.configure');
  const legacyPath = window.location.pathname.split('/').filter(Boolean).at(-1);
  const legacyAssessmentSubtab: AssessmentSubtab = initialType || (legacyPath === 'examinations' ? 'examinations' : legacyPath === 'tests' ? 'tests' : 'continuous');
  const [tab, setTab] = useState<PrimaryTab>(initialTab || (['continuous-assessment', 'tests', 'examinations', 'exam-scheduling', 'assessments', 'question-bank', 'marking'].includes(legacyPath || '') ? (legacyPath === 'question-bank' ? 'questions' : legacyPath === 'marking' ? 'marking' : 'assessments') : 'overview'));
  const [assessmentSubtab, setAssessmentSubtab] = useState<AssessmentSubtab>(legacyAssessmentSubtab);
  const [markingSubtab, setMarkingSubtab] = useState<MarkingSubtab>('entry');
  const [resultsSubtab, setResultsSubtab] = useState<ResultsSubtab>('results');
  const [settingsSubtab, setSettingsSubtab] = useState<SettingsSubtab>('grades');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AssessmentRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [lookups, setLookups] = useState<CreationLookups | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateForm>({ title: '', classId: '', subjectId: '', assessmentTypeId: 'test', maxScore: 40, date: '', instructions: '' });

  const openCreate = async () => {
    if (!canCreate) { showToast('Action unavailable', 'Your role does not include assessment creation.', 'failed'); return; }
    setCreateOpen(true); setLookupError('');
    try {
      const response = await apiRequest<{ success: true; data: CreationLookups }>('/lookups/assessment-creation');
      setLookups(response.data);
      const preferredType = assessmentSubtab === 'examinations' ? 'exam' : assessmentSubtab === 'continuous' ? 'assignment' : 'test';
      const type = response.data.assessmentTypes.find((item) => item.id === preferredType) || response.data.assessmentTypes[0];
      const classId = response.data.classes[0]?.id || '';
      const subjectId = subjectsForClass(response.data, classId)[0]?.id || '';
      setForm((old) => ({ ...old, classId, subjectId, assessmentTypeId: type?.id || 'test', maxScore: type?.defaultMaxScore || 40 }));
    } catch (error) { setLookupError(describeApiError(error)); }
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.classId || !form.subjectId || !form.date || form.maxScore <= 0) return;
    setSaving(true);
    try {
      await apiMutation('/assessments', 'POST', form);
      showToast('Assessment created', 'The draft assessment is ready in the assessment workspace.');
      setCreateOpen(false);
      window.dispatchEvent(new Event('skuggle:authenticated'));
    } catch (error) { showToast('Assessment could not be created', describeApiError(error), 'failed'); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => assessments.filter((item) => `${item.title} ${item.subject} ${item.classLevel}`.toLowerCase().includes(query.toLowerCase())), [assessments, query]);
  const counts = useMemo(() => ({
    all: assessments.length,
    marking: assessments.filter((a) => ['Draft', 'Submitted'].includes(a.status)).length,
    approval: assessments.filter((a) => ['Submitted', 'Validated'].includes(a.status)).length,
    published: assessments.filter((a) => a.status === 'Published').length,
  }), [assessments]);
  const completion = counts.all ? Math.round(((counts.all - counts.marking) / counts.all) * 100) : 0;

  const go = (nextTab: PrimaryTab, subtab?: string) => {
    setTab(nextTab);
    if (nextTab === 'assessments' && subtab) setAssessmentSubtab(subtab as AssessmentSubtab);
    if (nextTab === 'marking' && subtab) setMarkingSubtab(subtab as MarkingSubtab);
    if (nextTab === 'results' && subtab) setResultsSubtab(subtab as ResultsSubtab);
  };

  return <div className="space-y-4 pb-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm"><ClipboardList className="h-5 w-5" /></div>
        <div><h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Assessment</h1><p className="text-sm text-slate-500">Manage tests, examinations, marking and results.</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {canCreate && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Create Assessment</Button>}
        <Button size="sm" variant="outline" leftIcon={<Settings2 className="h-4 w-4" />} onClick={() => setTab('settings')}>Assessment Settings</Button>
      </div>
    </header>

    <nav aria-label="Assessment sections" className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 shadow-xs">
      {primaryTabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-xs font-semibold transition ${tab === item.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}><item.icon className="h-4 w-4" />{item.label}</button>)}
    </nav>

    {tab === 'overview' && <Overview assessments={assessments} counts={counts} completion={completion} onGo={go} onCreate={openCreate} permissions={{ canCreate, canMark, canApprove, canPublish }} />}
    {tab === 'assessments' && <AssessmentsPanel data={filtered} query={query} setQuery={setQuery} subtab={assessmentSubtab} setSubtab={setAssessmentSubtab} onSelect={setSelected} onCreate={openCreate} canCreate={canCreate} />}
    {tab === 'questions' && <QuestionBank canCreate={canCreate} onStudio={() => { setTab('assessments'); setAssessmentSubtab('studio'); }} />}
    {tab === 'marking' && <MarkingPanel data={filtered} subtab={markingSubtab} setSubtab={setMarkingSubtab} onSelect={setSelected} canMark={canMark} />}
    {tab === 'results' && <ResultsPanel data={filtered} subtab={resultsSubtab} setSubtab={setResultsSubtab} onSelect={setSelected} canApprove={canApprove} canPublish={canPublish} />}
    {tab === 'settings' && <SettingsPanel subtab={settingsSubtab} setSubtab={setSettingsSubtab} canConfigure={canConfigure} branding={branding} />}

    <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title} description={`${selected?.subject || ''} · ${selected?.classLevel || ''}`} footer={<Button variant="outline" onClick={() => setSelected(null)}>Close</Button>}>
      {selected && <div className="space-y-5"><Detail label="Status" value={<StatusBadge status={selected.status} variant={statusVariant(selected.status)} />} /><Detail label="Academic period" value={`${selected.term || 'Current term'} · ${selected.session || branding.academicSession}`} /><Detail label="Maximum score" value={`${selected.weights.total || selected.weights.terminalExamWeight} marks`} /><Detail label="Teacher" value={selected.teacherName || 'Assigned by school allocation'} /><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Actions are constrained by the assessment status and your server-issued permissions.</div></div>}
    </Drawer>

    <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create assessment" description="Set up the academic context, scoring and schedule for this assessment." size="xl" footer={<><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button form="create-assessment" type="submit" isLoading={saving}>Save as draft</Button></>}>
      {lookupError ? <EmptyState title="Creation options could not be loaded" description={lookupError} action={{ label: 'Retry', onClick: openCreate }} /> : !lookups ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div> : <form id="create-assessment" onSubmit={submitCreate} className="space-y-5">
        <FormSection number="1" title="Assessment details" description="Give this assessment a clear, recognizable name.">
          <Field label="Assessment title" hint="Use a name teachers and students can identify easily."><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={formControl} placeholder="e.g. JSS 2 Mathematics Mid-Term Test" /></Field>
        </FormSection>
        <FormSection number="2" title="Academic context" description="Select the learners and subject this assessment belongs to.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class"><select required value={form.classId} onChange={(e) => { const classId = e.target.value; const options = subjectsForClass(lookups, classId); setForm({ ...form, classId, subjectId: options.some((x) => x.id === form.subjectId) ? form.subjectId : options[0]?.id || '' }); }} className={formControl}>{lookups.classes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
            <Field label="Subject"><select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className={formControl}><option value="" disabled>Select a subject</option>{subjectsForClass(lookups, form.classId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
          </div>
        </FormSection>
        <FormSection number="3" title="Scoring and schedule" description="Choose the format, maximum score and assessment date.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Assessment type"><select value={form.assessmentTypeId} onChange={(e) => { const type = lookups.assessmentTypes.find((x) => x.id === e.target.value); setForm({ ...form, assessmentTypeId: e.target.value, maxScore: type?.defaultMaxScore || form.maxScore }); }} className={formControl}>{lookups.assessmentTypes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
            <Field label="Maximum score"><input required min="1" max="1000" type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} className={formControl} /></Field>
            <Field label="Assessment date"><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={formControl} /></Field>
            <Field label="Academic period"><div className={`${formControl} flex items-center bg-slate-50 text-slate-600`}>{lookups.term.name} · {lookups.session.name}</div></Field>
          </div>
        </FormSection>
        <FormSection number="4" title="Student instructions" description="Optional directions that will appear with the assessment.">
          <Field label="Instructions" hint={`${form.instructions.length}/5,000 characters`}><textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className={`${formControl} min-h-24 resize-y py-3`} placeholder="e.g. Answer all questions. Show every calculation clearly." maxLength={5000} /></Field>
        </FormSection>
      </form>}
    </Modal>
  </div>;
};

const Overview = ({ assessments, counts, completion, onGo, onCreate, permissions }: any) => {
  const metrics = [
    ['Assessments This Term', counts.all, ClipboardList, 'bg-indigo-50 text-indigo-600', () => onGo('assessments')],
    ['Awaiting Marking', counts.marking, PenLine, 'bg-amber-50 text-amber-600', () => onGo('marking', 'entry')],
    ['Results Awaiting Approval', counts.approval, BadgeCheck, 'bg-blue-50 text-blue-600', () => onGo('results', 'approval')],
    ['Published Results', counts.published, BarChart3, 'bg-emerald-50 text-emerald-600', () => onGo('results', 'publishing')],
    ['Completion Rate', `${completion}%`, PieChart, 'bg-violet-50 text-violet-600', () => onGo('results')],
  ];
  const pipeline = [
    ['Created', counts.all], ['Scheduled', assessments.filter((a: AssessmentRecord) => a.status !== 'Draft').length], ['Completed', assessments.filter((a: AssessmentRecord) => a.status !== 'Draft').length], ['Marked', assessments.filter((a: AssessmentRecord) => ['Validated', 'Approved', 'Published'].includes(a.status)).length], ['Approved', assessments.filter((a: AssessmentRecord) => ['Approved', 'Published'].includes(a.status)).length], ['Published', counts.published],
  ];
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(([label, value, Icon, color, action]: any) => <button key={label} onClick={action} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-indigo-200"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div><div className="text-xs font-medium text-slate-500">{label}</div><div className="mt-1 text-2xl font-extrabold text-slate-950">{value}</div><div className="mt-2 flex items-center text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">View details <ChevronRight className="h-3 w-3" /></div></button>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
      <Section title="Assessment Pipeline" icon={Gauge}><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{pipeline.map(([label, value], index) => <button onClick={() => onGo(index < 3 ? 'assessments' : index === 3 ? 'marking' : 'results')} key={label as string} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-indigo-200"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-lg font-bold text-slate-900">{value}</div></button>)}</div></Section>
      <Section title="Quick Actions" icon={WandSparkles}><div className="grid grid-cols-2 gap-2">{permissions.canCreate && <Quick label="Create Assessment" icon={Plus} onClick={onCreate} />}{permissions.canCreate && <Quick label="Add Question" icon={FilePlus2} onClick={() => onGo('questions')} />}{permissions.canMark && <Quick label="Enter Marks" icon={PenLine} onClick={() => onGo('marking', 'entry')} />}{permissions.canMark && <Quick label="Scan Scripts" icon={Upload} onClick={() => onGo('marking', 'scan')} />}{permissions.canApprove && <Quick label="Review Results" icon={ShieldCheck} onClick={() => onGo('results', 'approval')} />}{permissions.canPublish && <Quick label="Publish Results" icon={Sparkles} onClick={() => onGo('results', 'publishing')} />}</div></Section>
    </div>
    <div className="grid gap-4 lg:grid-cols-2"><AssessmentList title="Upcoming & Recent Assessments" data={assessments.slice(0, 5)} onClick={() => onGo('assessments')} /><AssessmentList title="Marking & Approval Queue" data={assessments.filter((a: AssessmentRecord) => a.status !== 'Published').slice(0, 5)} onClick={() => onGo('marking')} /></div>
    {assessments.length === 0 && <Section title="Assessment activity"><EmptyState title="No assessments created yet" description="Create your first assessment for this term." action={permissions.canCreate ? { label: 'Create Assessment', onClick: onCreate } : undefined} /></Section>}
  </div>;
};

const AssessmentsPanel = ({ data, query, setQuery, subtab, setSubtab, onSelect, onCreate, canCreate }: any) => {
  const pages = {
    continuous: { title: 'Continuous Assessment', description: 'Assignments and ongoing class-based assessment for the current term.', types: ['assignment'] },
    tests: { title: 'Tests', description: 'Quizzes and periodic tests used to measure learning progress.', types: ['quiz', 'test'] },
    examinations: { title: 'Examinations', description: 'Formal examinations with scheduling, question assignment and delivery controls.', types: ['exam'] },
  } as const;
  const page = subtab === 'studio' ? null : pages[subtab as keyof typeof pages];
  const typedData = page ? data.filter((item: AssessmentRecord) => (page.types as readonly string[]).includes(item.assessmentType || 'test')) : data;
  const createLabel = subtab === 'examinations' ? 'Create Examination' : subtab === 'tests' ? 'Create Test' : 'Create Assessment';
  return <div className="space-y-4">
    <Subtabs value={subtab} onChange={setSubtab} items={[['continuous', 'Continuous Assessment'], ['tests', 'Tests'], ['examinations', 'Examinations'], ['studio', 'Assessment Studio']]} />
    {subtab === 'studio' ? <AssessmentStudio /> : <>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-950">{page?.title}</h2><p className="mt-0.5 text-sm text-slate-500">{page?.description}</p></div>{canCreate && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>{createLabel}</Button>}</div>
      <FilterBar query={query} setQuery={setQuery} />
      <AssessmentDataTable data={typedData} onSelect={onSelect} onCreate={onCreate} canCreate={canCreate} emptyTitle={`No ${page?.title.toLowerCase()} created yet`} emptyDescription={`Create the first ${page?.title.toLowerCase()} for the current term.`} />
    </>}
  </div>;
};

const AssessmentDataTable = ({ data, onSelect, onCreate, canCreate, emptyTitle = 'No assessments match this view', emptyDescription = 'Create an assessment or clear your search filters.' }: any) => <DataTable data={data} pageSize={8} keyExtractor={(row: AssessmentRecord, index: number) => `${row.id}-${index}`} emptyTitle={emptyTitle} emptyDescription={emptyDescription} emptyAction={canCreate ? { label: 'Create Assessment', onClick: onCreate } : undefined} columns={[
  { key: 'title', header: 'Assessment', sortable: true, accessor: (r: AssessmentRecord) => <div><div className="font-semibold text-slate-900">{r.title}</div><div className="text-xs text-slate-500">{r.subject}</div></div> },
  { key: 'class', header: 'Class', sortable: true, accessor: (r: AssessmentRecord) => r.classLevel || '—' },
  { key: 'type', header: 'Type', sortable: true, accessor: (r: AssessmentRecord) => ({ quiz: 'Quiz', assignment: 'Continuous Assessment', test: 'Test', exam: 'Examination' }[r.assessmentType || 'test'] || r.assessmentType || 'Assessment') },
  { key: 'date', header: 'Date', sortable: true, accessor: (r: AssessmentRecord) => shortDate(r.scheduledDate) },
  { key: 'marks', header: 'Max Marks', accessor: (r: AssessmentRecord) => r.weights.total || r.weights.terminalExamWeight },
  { key: 'mode', header: 'Delivery', accessor: () => 'Paper' },
  { key: 'status', header: 'Status', accessor: (r: AssessmentRecord) => <StatusBadge status={r.status} variant={statusVariant(r.status)} /> },
  { key: 'actions', header: '', align: 'right' as const, accessor: (r: AssessmentRecord) => <button aria-label={`View ${r.title}`} onClick={() => onSelect(r)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></button> },
]} />;

const QuestionBank = ({ canCreate, onStudio }: any) => <div className="space-y-4"><FilterBar query="" setQuery={() => {}} placeholder="Search question text, code or topic"><Button size="sm" variant="outline" leftIcon={<Sparkles className="h-4 w-4" />} onClick={onStudio}>Generate with AI</Button>{canCreate && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={onStudio}>Add Question</Button>}</FilterBar><Section title="Reusable Question Library" icon={BookOpenCheck}><EmptyState title="No reusable questions returned" description="The current backend stores generated assessments, but does not expose a tenant question-bank endpoint yet. Use Assessment Studio to create reviewed questions without fabricating records here." action={{ label: 'Open Assessment Studio', onClick: onStudio }} /></Section></div>;

const MarkingPanel = ({ data, subtab, setSubtab, onSelect, canMark }: any) => <div className="space-y-4"><Subtabs value={subtab} onChange={setSubtab} items={[['entry', 'Marks Entry'], ['manual', 'Manual Assessment'], ['scan', 'Scan & Auto-Mark']]} />{subtab === 'scan' ? <Suspense fallback={<div className="flex justify-center p-16"><Loader2 className="h-6 w-6 animate-spin" /></div>}><SmartMarkScanner /></Suspense> : subtab === 'manual' ? <Section title="Manual Assessment Workspace" icon={PenLine}><EmptyState title="Select subjective work to begin marking" description="Open an assessment containing essays, projects, assignments or practical submissions." action={data[0] ? { label: 'Open first assessment', onClick: () => onSelect(data[0]) } : undefined} /></Section> : <><div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">Scores are validated and saved through the assessment score endpoint, including revision-conflict protection.</div><AssessmentDataTable data={data.filter((a: AssessmentRecord) => a.status !== 'Published')} onSelect={onSelect} onCreate={() => {}} canCreate={false && canMark} /></>}</div>;

const ResultsPanel = ({ data, subtab, setSubtab, onSelect, canApprove, canPublish }: any) => { const visible = subtab === 'approval' ? data.filter((a: AssessmentRecord) => ['Submitted', 'Validated'].includes(a.status)) : subtab === 'publishing' ? data.filter((a: AssessmentRecord) => ['Approved', 'Published'].includes(a.status)) : data; return <div className="space-y-4"><Subtabs value={subtab} onChange={setSubtab} items={[['results', 'Results'], ['approval', 'Approval Queue'], ['cards', 'Report Cards'], ['publishing', 'Publishing']]} />{subtab === 'cards' ? <Section title="Report Cards" icon={FileText}><EmptyState title="Generate report cards from approved results" description="Report cards use the school branding and result-publication backend. Open an approved result batch to preview or generate." /></Section> : <><div className="flex justify-between rounded-xl border border-slate-200 bg-white p-4"><div><h3 className="font-semibold text-slate-900">{subtab === 'approval' ? 'Result approval queue' : subtab === 'publishing' ? 'Result publishing' : 'Student results'}</h3><p className="text-xs text-slate-500">Only server-authorized actions are shown.</p></div>{subtab === 'approval' && !canApprove && <StatusBadge status="View only" />}{subtab === 'publishing' && !canPublish && <StatusBadge status="View only" />}</div><AssessmentDataTable data={visible} onSelect={onSelect} onCreate={() => {}} canCreate={false} /></>}</div>; };

const SettingsPanel = ({ subtab, setSubtab, canConfigure, branding }: any) => <div className="space-y-4"><Subtabs value={subtab} onChange={setSubtab} items={[['grades', 'Grade Configuration'], ['weights', 'Assessment Weights'], ['workflow', 'Approval Workflow'], ['pin', 'Result PIN'], ['general', 'General']]} /><Section title={settingsTitle(subtab)} icon={Settings2}><div className="max-w-3xl space-y-4"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="font-semibold text-slate-900">{subtab === 'grades' ? 'Grading bands' : subtab === 'weights' ? 'Term assessment structure' : subtab === 'workflow' ? 'Role-based approval stages' : subtab === 'pin' ? 'Secure result access' : 'Assessment defaults'}</div><p className="mt-1 text-sm text-slate-600">{subtab === 'pin' ? 'PIN generation and usage enforcement are handled by the result PIN service.' : subtab === 'workflow' ? 'Approval roles are resolved from role configuration and are not hardcoded in this screen.' : `Configuration applies to ${branding.schoolName}.`}</p></div>{!canConfigure ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">You can view this section, but your role does not include assessment configuration.</div> : <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">This installation has no dedicated {settingsTitle(subtab).toLowerCase()} write endpoint. Controls remain read-only to avoid presenting settings that would not persist.</div>}</div></Section></div>;

const Section = ({ title, icon: Icon, children }: any) => <section className="rounded-2xl border border-slate-200 bg-white shadow-xs"><div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">{Icon ? <Icon className="h-4 w-4 text-indigo-600" /> : <ClipboardList className="h-4 w-4 text-indigo-600" />}<h2 className="text-sm font-bold text-slate-900">{title}</h2></div><div className="p-4">{children}</div></section>;
const Quick = ({ label, icon: Icon, onClick }: any) => <button onClick={onClick} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50"><Icon className="h-4 w-4 text-indigo-600" />{label}</button>;
const AssessmentList = ({ title, data, onClick }: any) => <Section title={title} icon={CalendarDays}>{data.length ? <div className="divide-y divide-slate-100">{data.map((a: AssessmentRecord, index: number) => <button key={`${a.id}-${index}`} onClick={onClick} className="flex w-full items-center justify-between gap-3 py-3 text-left"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-900">{a.title}</div><div className="text-xs text-slate-500">{a.classLevel} · {a.subject}</div></div><StatusBadge status={a.status} variant={statusVariant(a.status)} /></button>)}</div> : <p className="py-8 text-center text-sm text-slate-500">No records in this queue.</p>}</Section>;
const FilterBar = ({ query, setQuery, placeholder = 'Search assessments…', children }: any) => <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="input pl-9" placeholder={placeholder} aria-label={placeholder} /></div><Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>Filters</Button>{children}</div>;
const Subtabs = ({ value, onChange, items }: any) => <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">{items.map(([id, label]: string[]) => <button key={id} onClick={() => onChange(id)} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold ${value === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>)}</div>;
const Detail = ({ label, value }: any) => <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4"><span className="text-sm text-slate-500">{label}</span><span className="text-right text-sm font-semibold text-slate-900">{value}</span></div>;
const FormSection = ({ number, title, description, children }: any) => <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><legend className="sr-only">{title}</legend><div className="mb-4 flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">{number}</span><div><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-0.5 text-xs text-slate-500">{description}</p></div></div>{children}</fieldset>;
const Field = ({ label, hint, children, className = '' }: any) => <label className={`block ${className}`}><span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700"><span>{label}</span>{hint && <span className="font-normal text-slate-400">{hint}</span>}</span>{children}</label>;
const settingsTitle = (tab: SettingsSubtab) => ({ grades: 'Grade Configuration', weights: 'Assessment Weights', workflow: 'Approval Workflow', pin: 'Result PIN', general: 'General Settings' }[tab]);
