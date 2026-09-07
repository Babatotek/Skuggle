import React, { useState } from 'react';
import { Plus, Save, Upload } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button, FormField, Input, Modal, Select } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { ListPageLayout } from '../../layouts/ListPageLayout';
import { WorkspaceLandingLayout } from '../../layouts/WorkspaceLandingLayout';
import { describeApiError } from '../../lib/apiClient';
import { buildRoute } from '../../routing/builders';
import { useAcademicContext, useAccess } from '../../state/ApplicationStateProviders';
import {
  convertAdmissionApplication,
  createAdmissionApplication,
  getAdmissionApplications,
  getAdmissionsOverview,
  getAdmissionsQueue,
  getAdmissionsSettings,
  importAdmissionApplications,
  recordAdmissionDecision,
  recordAdmissionScreening,
  transitionAdmissionApplication,
  updateAdmissionCycle,
} from './api';
import {
  AdmissionApplication,
  AdmissionApplicationInput,
  AdmissionCycle,
  AdmissionFilters,
} from './types';
import {
  ApplicantDetails,
  ApplicationFormModal,
  ApplicationsTable,
  ApplicationsTrend,
  AdmissionsContextNav,
  AdmissionsFilters,
  AdmissionsMetrics,
  AdmissionsPipeline,
  AdmissionsTasks,
  ConversionSummary,
  QueueActionButton,
  QueueSummary,
} from './components';
import { useAdmissionsQuery } from './hooks';

const DEFAULT_FILTERS: AdmissionFilters = { query: '', status: 'ALL', classId: 'ALL', page: 1, perPage: 10 };
const APPLICATION_STATUSES = ['draft', 'submitted', 'screening', 'screened', 'waitlisted', 'offered', 'accepted', 'declined', 'rejected', 'withdrawn', 'enrolled'];

const RequestError: React.FC<{ message?: string | null; onRetry: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="rounded-[var(--radius-card)] border border-[var(--color-status-negative-border)] bg-[var(--color-status-negative-bg)] p-4 text-sm text-[var(--color-status-negative-text)]">
    <p>{message || 'Admissions data could not be loaded.'}</p>
    <Button className="mt-3" size="sm" variant="outline" onClick={onRetry}>Try again</Button>
  </div>
);

const ImportApplicationsModal: React.FC<{
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void>;
}> = ({ open, busy, onClose, onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    await onSubmit(file);
    setFile(null);
  };
  return <Modal isOpen={open} onClose={onClose} title="Import Applications" description="Upload a CSV with first_name and last_name columns. Up to 500 valid rows are imported atomically.">
    <form className="space-y-4" onSubmit={submit}>
      <FormField label="CSV file" required>
        <Input required type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </FormField>
      <p className="text-xs text-[var(--color-text-secondary)]">Optional columns: middle_name, gender, date_of_birth, nationality, guardian_name, guardian_phone, guardian_email, class.</p>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy} disabled={!file}>Import Applications</Button></div>
    </form>
  </Modal>;
};

export const AdmissionsOverviewPage: React.FC = () => {
  const { showToast, classes } = useApp();
  const { hasCapability } = useAccess();
  const [selected, setSelected] = useState<AdmissionApplication | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const query = useAdmissionsQuery((signal) => getAdmissionsOverview(signal), 'overview');
  const create = async (input: AdmissionApplicationInput) => {
    setBusy(true);
    try {
      await createAdmissionApplication(input);
      setFormOpen(false);
      showToast('Application created', `${input.firstName} ${input.lastName} was added to admissions.`, 'success');
      query.reload();
    } catch (error) {
      showToast('Could not create application', describeApiError(error), 'error');
    } finally { setBusy(false); }
  };
  const importApplications = async (file: File) => {
    setBusy(true);
    try {
      const response = await importAdmissionApplications(file);
      setImportOpen(false);
      showToast('Applications imported', `${response.data.imported} applications were imported.`, 'success');
      query.reload();
    } catch (error) {
      showToast('Could not import applications', describeApiError(error), 'error');
    } finally { setBusy(false); }
  };
  const canCreate = hasCapability('admissions.application.create');
  return <>
    <WorkspaceLandingLayout
      breadcrumb={[{ label: 'Home' }, { label: 'Admissions' }]}
      title="Admissions"
      description="Manage applications, screening, offers and enrolment."
      nav={<AdmissionsContextNav />}
      action={canCreate ? <div className="flex gap-2"><Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setImportOpen(true)}>Import</Button><Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>New Application</Button></div> : undefined}
    >
      <AdmissionsMetrics metrics={query.data?.metrics} state={query.state} />
      {query.state === 'error' && <RequestError message={query.error} onRetry={query.reload} />}
      {query.data && <>
        <AdmissionsPipeline stages={query.data.pipeline} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,.8fr)]">
          <section className="overflow-hidden rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)]" aria-labelledby="recent-applications-title">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-default)] p-4"><div><h2 id="recent-applications-title" className="text-sm font-bold">Recent applications</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Latest applications received across classes.</p></div><NavLink className="ds-focus-ring rounded-[var(--radius-control)] px-2 py-1 text-xs font-semibold text-[var(--color-action-primary)]" to={buildRoute('school.admissions.applications')}>View all →</NavLink></div>
            <ApplicationsTable applications={query.data.recentApplications} variant="overview" onOpen={setSelected} />
          </section>
          <div className="space-y-4">
            <ApplicationsTrend points={query.data.trend} />
            <AdmissionsTasks tasks={query.data.tasks} />
            <ConversionSummary conversion={query.data.conversion} />
          </div>
        </div>
      </>}
    </WorkspaceLandingLayout>
    <ApplicationFormModal open={formOpen} busy={busy} classes={classes} onClose={() => setFormOpen(false)} onSubmit={create} />
    <ImportApplicationsModal open={importOpen} busy={busy} onClose={() => setImportOpen(false)} onSubmit={importApplications} />
    <ApplicantDetails application={selected} onClose={() => setSelected(null)} />
  </>;
};

export const AdmissionsApplicationsPage: React.FC = () => {
  const { showToast, classes } = useApp();
  const { hasCapability } = useAccess();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<AdmissionApplication | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const dependencyKey = JSON.stringify(filters);
  const query = useAdmissionsQuery((signal) => getAdmissionApplications(filters, signal), dependencyKey);
  const data = query.data;
  const create = async (input: AdmissionApplicationInput) => {
    setBusy(true);
    try {
      await createAdmissionApplication(input);
      setFormOpen(false);
      showToast('Application created', `${input.firstName} ${input.lastName} was added to admissions.`, 'success');
      query.reload();
    } catch (error) {
      showToast('Could not create application', describeApiError(error), 'error');
    } finally { setBusy(false); }
  };
  const importApplications = async (file: File) => {
    setBusy(true);
    try {
      const response = await importAdmissionApplications(file);
      setImportOpen(false);
      showToast('Applications imported', `${response.data.imported} applications were imported.`, 'success');
      query.reload();
    } catch (error) {
      showToast('Could not import applications', describeApiError(error), 'error');
    } finally { setBusy(false); }
  };
  const filtered = Boolean(filters.query || filters.status !== 'ALL' || filters.classId !== 'ALL');
  return <>
    <ListPageLayout
      breadcrumb={[{ label: 'Admissions' }, { label: 'Applications' }]}
      title="Applications"
      description="Review and manage applicants across the admissions lifecycle."
      nav={<AdmissionsContextNav />}
      action={hasCapability('admissions.application.create') ? <div className="flex gap-2"><Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setImportOpen(true)}>Import</Button><Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>New Application</Button></div> : undefined}
      toolbar={<AdmissionsFilters filters={filters} statuses={APPLICATION_STATUSES} classes={classes} onChange={setFilters} />}
    >
      <ApplicationsTable applications={data?.items || []} state={query.state} error={query.error} onRetry={query.reload} onOpen={setSelected} page={filters.page} total={data?.pagination.total || 0} perPage={filters.perPage} onPageChange={(page) => setFilters({ ...filters, page })} filtered={filtered} />
    </ListPageLayout>
    <ApplicationFormModal open={formOpen} busy={busy} classes={classes} onClose={() => setFormOpen(false)} onSubmit={create} />
    <ImportApplicationsModal open={importOpen} busy={busy} onClose={() => setImportOpen(false)} onSubmit={importApplications} />
    <ApplicantDetails application={selected} onClose={() => setSelected(null)} />
  </>;
};

interface QueuePageProps {
  kind: 'screening' | 'decisions' | 'enrolment';
  title: string;
  description: string;
}

const AdmissionsQueuePage: React.FC<QueuePageProps> = ({ kind, title, description }) => {
  const { showToast, classes } = useApp();
  const { hasCapability } = useAccess();
  const academic = useAcademicContext();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<AdmissionApplication | null>(null);
  const [actionTarget, setActionTarget] = useState<AdmissionApplication | null>(null);
  const [outcome, setOutcome] = useState(kind === 'screening' ? 'passed' : kind === 'decisions' ? 'offered' : '');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [offeredClassId, setOfferedClassId] = useState('');
  const [busy, setBusy] = useState(false);
  const dependencyKey = `${kind}:${JSON.stringify(filters)}`;
  const query = useAdmissionsQuery((signal) => getAdmissionsQueue(kind, filters, signal), dependencyKey);
  const data = query.data;
  const canAct = hasCapability(kind === 'screening' ? 'admissions.screening.manage' : kind === 'decisions' ? 'admissions.decision.manage' : 'admissions.enrolment.convert');
  const canUpdateApplication = hasCapability('admissions.application.update');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!actionTarget) return;
    setBusy(true);
    try {
      if (kind === 'screening') await recordAdmissionScreening(actionTarget.id, { status: outcome, score: score ? Number(score) : undefined, notes: notes || undefined });
      else if (kind === 'decisions' && (outcome === 'accepted' || outcome === 'declined')) await transitionAdmissionApplication(actionTarget.id, outcome);
      else if (kind === 'decisions') await recordAdmissionDecision(actionTarget.id, { decision: outcome, offeredClassId: outcome === 'offered' ? offeredClassId || actionTarget.requestedClassId : undefined, notes: notes || undefined });
      else await convertAdmissionApplication(actionTarget.id, { academicSessionId: academic.session?.id, termId: academic.term?.id });
      showToast(kind === 'enrolment' ? 'Applicant enrolled' : 'Admissions record updated', `${actionTarget.applicantName} was updated successfully.`, 'success');
      setActionTarget(null);
      setNotes('');
      setScore('');
      query.reload();
    } catch (error) {
      showToast('Could not update application', describeApiError(error), 'error');
    } finally { setBusy(false); }
  };
  const filtered = Boolean(filters.query || filters.status !== 'ALL' || filters.classId !== 'ALL');
  const actionLabel = kind === 'screening' ? 'Review' : kind === 'decisions' ? 'Decide' : 'Enrol';
  return <>
    <ListPageLayout
      breadcrumb={[{ label: 'Admissions' }, { label: title }]}
      title={title}
      description={description}
      nav={<AdmissionsContextNav />}
      toolbar={<AdmissionsFilters filters={filters} statuses={APPLICATION_STATUSES} classes={classes} onChange={setFilters} />}
    >
      <QueueSummary kind={kind} applications={data?.items || []} total={data?.pagination.total || 0} />
      <ApplicationsTable
        applications={data?.items || []}
        state={query.state}
        error={query.error}
        onRetry={query.reload}
        onOpen={setSelected}
        page={filters.page}
        total={data?.pagination.total || 0}
        perPage={filters.perPage}
        onPageChange={(page) => setFilters({ ...filters, page })}
        filtered={filtered}
        action={(canAct || (kind === 'decisions' && canUpdateApplication)) ? (application) => {
          const isOfferResponse = kind === 'decisions' && application.status === 'offered';
          const actionable = isOfferResponse ? canUpdateApplication : canAct;
          const allowed = kind === 'screening'
            ? ['submitted', 'screening'].includes(application.status)
            : kind === 'decisions'
              ? isOfferResponse || ['screened', 'waitlisted'].includes(application.status)
              : application.status === 'accepted';
          if (!actionable || !allowed) return null;
          return <QueueActionButton
            label={isOfferResponse ? 'Record response' : actionLabel}
            application={application}
            onSelect={(record) => {
              setOutcome(isOfferResponse ? 'accepted' : kind === 'screening' ? 'passed' : kind === 'decisions' ? 'offered' : '');
              setOfferedClassId(record.requestedClassId || '');
              setActionTarget(record);
            }}
          />;
        } : undefined}
      />
    </ListPageLayout>
    <ApplicantDetails application={selected} onClose={() => setSelected(null)} />
    <ModalAction kind={kind} application={actionTarget} outcome={outcome} score={score} notes={notes} offeredClassId={offeredClassId} classes={classes} busy={busy} setOutcome={setOutcome} setScore={setScore} setNotes={setNotes} setOfferedClassId={setOfferedClassId} onClose={() => setActionTarget(null)} onSubmit={submit} />
  </>;
};

const ModalAction: React.FC<{
  kind: QueuePageProps['kind'];
  application: AdmissionApplication | null;
  outcome: string;
  score: string;
  notes: string;
  offeredClassId: string;
  classes: { id: string; name: string }[];
  busy: boolean;
  setOutcome: (value: string) => void;
  setScore: (value: string) => void;
  setNotes: (value: string) => void;
  setOfferedClassId: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}> = ({ kind, application, outcome, score, notes, offeredClassId, classes, busy, setOutcome, setScore, setNotes, setOfferedClassId, onClose, onSubmit }) => (
  <Modal isOpen={Boolean(application)} onClose={onClose} title={kind === 'screening' ? 'Record Screening' : kind === 'decisions' ? 'Make Decision' : 'Confirm Enrolment'} description={application ? `Update ${application.applicantName}'s application.` : undefined}>
    <form className="space-y-4" onSubmit={onSubmit}>
      {kind !== 'enrolment' && <FormField label={kind === 'screening' ? 'Outcome' : application?.status === 'offered' ? 'Offer response' : 'Decision'} required><Select value={outcome} onChange={(event) => setOutcome(event.target.value)}>{kind === 'screening' ? <><option value="scheduled">Scheduled</option><option value="passed">Passed</option><option value="failed">Failed</option></> : application?.status === 'offered' ? <><option value="accepted">Accepted</option><option value="declined">Declined</option></> : <><option value="offered">Offer admission</option><option value="waitlisted">Waitlist</option><option value="rejected">Reject</option></>}</Select></FormField>}
      {kind === 'screening' && <FormField label="Score"><Input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></FormField>}
      {kind === 'decisions' && outcome === 'offered' && <FormField label="Offered class" required><Select required value={offeredClassId} onChange={(event) => setOfferedClassId(event.target.value)}><option value="">Select class</option>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}</Select></FormField>}
      {kind !== 'enrolment' && <FormField label="Notes"><Input value={notes} onChange={(event) => setNotes(event.target.value)} /></FormField>}
      {kind === 'enrolment' && <p className="rounded-[var(--radius-card)] bg-[var(--color-status-attention-bg)] p-3 text-sm text-[var(--color-status-attention-text)]">This creates the canonical student and enrolment records. The operation is idempotent and cannot be undone here.</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy}>{kind === 'enrolment' ? 'Confirm Enrolment' : 'Save'}</Button></div>
    </form>
  </Modal>
);

export const AdmissionsScreeningPage = () => <AdmissionsQueuePage kind="screening" title="Screening" description="Evaluate applicants and record screening outcomes." />;
export const AdmissionsDecisionsPage = () => <AdmissionsQueuePage kind="decisions" title="Decisions & Offers" description="Make admission decisions and issue offers." />;
export const AdmissionsEnrolmentPage = () => <AdmissionsQueuePage kind="enrolment" title="Enrolment" description="Convert accepted applicants into canonical student records." />;

const EMPTY_CYCLE: AdmissionCycle = { name: '', status: 'draft', currency: 'NGN', applicationFeeMinor: 0, settings: {} };

export const AdmissionsSettingsPage: React.FC = () => {
  const { showToast } = useApp();
  const { hasCapability } = useAccess();
  const query = useAdmissionsQuery((signal) => getAdmissionsSettings(signal), 'settings');
  const [draft, setDraft] = useState<AdmissionCycle | null>(null);
  const [busy, setBusy] = useState(false);
  const cycle = draft || query.data?.cycles.find((item) => item.status === 'active') || query.data?.cycles[0] || EMPTY_CYCLE;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await updateAdmissionCycle(cycle);
      setDraft(response.data);
      showToast('Cycle saved', 'Admissions cycle settings were updated.', 'success');
      query.reload();
    } catch (error) {
      showToast('Could not save settings', describeApiError(error), 'error');
    } finally { setBusy(false); }
  };
  const update = (patch: Partial<AdmissionCycle>) => setDraft({ ...cycle, ...patch });
  const canManage = hasCapability('admissions.settings.update');
  return <>
    <WorkspaceLandingLayout breadcrumb={[{ label: 'Admissions' }, { label: 'Settings' }]} title="Settings" description="Configure the active admissions cycle and offer defaults." nav={<AdmissionsContextNav />}>
      {query.state === 'error' ? <RequestError message={query.error} onRetry={query.reload} /> : query.state === 'loading' ? <div role="status" className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-secondary)]">Loading admissions settings…</div> : (
        <form className="max-w-3xl space-y-6 rounded-[var(--radius-surface)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-raised)]" onSubmit={save}>
          {query.data?.cycles.length ? <FormField label="Admissions cycle"><Select value={cycle.id || ''} onChange={(event) => setDraft(query.data?.cycles.find((item) => item.id === event.target.value) || EMPTY_CYCLE)}>{query.data.cycles.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.status})</option>)}</Select></FormField> : null}
          <div className="grid gap-4 sm:grid-cols-2"><FormField label="Cycle name" required><Input required disabled={!canManage} value={cycle.name} onChange={(event) => update({ name: event.target.value })} /></FormField><FormField label="Status" required><Select disabled={!canManage} value={cycle.status} onChange={(event) => update({ status: event.target.value as AdmissionCycle['status'] })}><option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option></Select></FormField></div>
          <div className="grid gap-4 sm:grid-cols-2"><FormField label="Opening date"><Input type="date" disabled={!canManage} value={cycle.opensAt || ''} onChange={(event) => update({ opensAt: event.target.value || null })} /></FormField><FormField label="Closing date"><Input type="date" disabled={!canManage} value={cycle.closesAt || ''} onChange={(event) => update({ closesAt: event.target.value || null })} /></FormField></div>
          <div className="grid gap-4 sm:grid-cols-2"><FormField label="Currency" required><Input required maxLength={3} disabled={!canManage} value={cycle.currency} onChange={(event) => update({ currency: event.target.value.toUpperCase() })} /></FormField><FormField label="Application fee (minor units)" required><Input required type="number" min="0" disabled={!canManage} value={cycle.applicationFeeMinor} onChange={(event) => update({ applicationFeeMinor: Number(event.target.value) })} /></FormField></div>
          {canManage && <div className="flex justify-end"><Button type="submit" isLoading={busy} leftIcon={<Save className="h-4 w-4" />}>Save Cycle</Button></div>}
        </form>
      )}
    </WorkspaceLandingLayout>
  </>;
};
