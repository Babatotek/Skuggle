import React, { useMemo, useState } from 'react';
import { AlertTriangle, Ellipsis, Filter, GraduationCap, Search, Upload, UserPlus, Users, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, DataTable, Modal, Select, StatusBadge, type Column } from '../../../components/ui';
import { useApp } from '../../../context/AppContext';
import { ListPageLayout } from '../../../layouts/ListPageLayout';
import { buildRoute } from '../../../routing/builders';
import { useAccess } from '../../../state/ApplicationStateProviders';
import type { StudentRecord } from '../../../types';
import { StudentEnrolmentWizard } from '../../../features/students/enrolment/StudentEnrolmentWizard';
import { StudentProfileView } from '../../../features/students/StudentProfileView';

export type StudentsPageState = 'ready' | 'loading' | 'error';

export interface StudentsPageContentProps {
  students: StudentRecord[];
  classes: { id: string; name: string }[];
  canCreate: boolean;
  state?: StudentsPageState;
  onRetry?: () => void;
  onOpenStudent: (publicId: string) => void;
  onEnrol: () => void;
  onImport: () => void;
}

const Metric: React.FC<{ label: string; value: number; note: string; tone: 'info' | 'success' | 'warning' | 'danger'; icon: React.ReactNode }> = ({ label, value, note, tone, icon }) => {
  const styles = {
    info: 'border-[var(--color-status-information-border)] bg-[var(--color-status-information-bg)] text-[var(--color-status-information-text)]',
    success: 'border-[var(--color-status-positive-border)] bg-[var(--color-status-positive-bg)] text-[var(--color-status-positive-text)]',
    warning: 'border-[var(--color-status-attention-border)] bg-[var(--color-status-attention-bg)] text-[var(--color-status-attention-text)]',
    danger: 'border-[var(--color-status-negative-border)] bg-[var(--color-status-negative-bg)] text-[var(--color-status-negative-text)]',
  }[tone];
  return <article className={`min-h-28 rounded-[var(--radius-card)] border p-4 ${styles}`}><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-surface)]/70" aria-hidden="true">{icon}</span><div><p className="text-sm text-[var(--color-text-secondary)]">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-text-primary)]">{value}</p><p className="mt-1 text-xs">{note}</p></div></div></article>;
};

export const StudentsPageContent: React.FC<StudentsPageContentProps> = ({ students, classes, canCreate, state = 'ready', onRetry, onOpenStudent, onEnrol, onImport }) => {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [fee, setFee] = useState('ALL');
  const filtered = useMemo(() => students.filter((student) => {
    const text = `${student.firstName} ${student.lastName} ${student.admissionNo}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (classFilter === 'ALL' || student.classLevel === classFilter) && (status === 'ALL' || student.status === status) && (fee === 'ALL' || student.feesStatus === fee);
  }), [students, query, classFilter, status, fee]);
  const metrics = useMemo(() => ({ total: students.length, active: students.filter((item) => item.status === 'Active').length, outstanding: students.filter((item) => item.feesStatus !== 'Paid').length, atRisk: students.filter((item) => item.termAverage > 0 && item.termAverage < 50).length }), [students]);
  const columns: Column<StudentRecord>[] = [
    { key: 'student', header: 'Student', sortable: true, sortValue: (row) => `${row.firstName} ${row.lastName}`, accessor: (student) => <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primitive-indigo-50)] text-xs font-semibold text-[var(--color-action-primary)]">{student.photoUrl ? <img src={student.photoUrl} alt="" className="h-full w-full object-cover" /> : `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`}</span><span><span className="block font-semibold text-[var(--color-text-primary)]">{student.firstName} {student.lastName}</span><span className="block text-xs text-[var(--color-text-muted)]">{student.gender}</span></span></div> },
    { key: 'admission', header: 'Admission No.', sortable: true, sortValue: (row) => row.admissionNo, accessor: (student) => student.admissionNo },
    { key: 'class', header: 'Class', sortable: true, sortValue: (row) => `${row.classLevel} ${row.arm}`, accessor: (student) => `${student.classLevel}${student.arm ? ` (${student.arm})` : ''}` },
    { key: 'status', header: 'Status', sortable: true, sortValue: (row) => row.status, accessor: (student) => <StatusBadge status={student.status} /> },
    { key: 'attendance', header: 'Attendance', sortable: true, sortValue: (row) => row.attendanceRate, accessor: (student) => <span className="font-medium tabular-nums">{student.attendanceRate}%</span> },
    { key: 'fees', header: 'Fee Status', sortable: true, sortValue: (row) => row.feesStatus, accessor: (student) => <StatusBadge status={student.feesStatus} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', accessor: (student) => <Button variant="ghost" size="icon-sm" aria-label={`Open actions for ${student.firstName} ${student.lastName}`} onClick={(event) => { event.stopPropagation(); onOpenStudent(student.id); }}><Ellipsis className="h-4 w-4" /></Button> },
  ];
  const toolbar = <div className="flex flex-col gap-3 border-b border-[var(--color-border-default)] p-4 xl:flex-row xl:items-center"><div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap xl:flex-nowrap"><label className="relative min-w-60 flex-1 xl:basis-80"><span className="sr-only">Search students</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="ds-field-control pl-9" placeholder="Search students by name or admission no." /></label><Select className="sm:w-36 sm:flex-none" aria-label="Filter by class" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="ALL">All Classes</option>{classes.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</Select><Select className="sm:w-36 sm:flex-none" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All Statuses</option><option>Active</option><option>Suspended</option><option>Graduated</option><option>Transferred</option></Select><Select className="sm:w-40 sm:flex-none" aria-label="Filter by fee status" value={fee} onChange={(event) => setFee(event.target.value)}><option value="ALL">All Fee Statuses</option><option>Paid</option><option>Partial</option><option>Pending</option></Select><Button className="shrink-0" variant="outline" leftIcon={<Filter className="h-4 w-4" />}>More filters</Button></div><Button className="shrink-0 xl:ml-auto" variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={onImport}>Import</Button></div>;
  return <ListPageLayout breadcrumb={[{ label: 'People' }, { label: 'Students' }]} title="Students" description="Manage enrolled learners and student records." action={canCreate ? <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={onEnrol}>Enrol Student</Button> : undefined} metrics={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total Students" value={metrics.total} note="Enrolled learners" tone="info" icon={<Users className="h-5 w-5" />} /><Metric label="Active Students" value={metrics.active} note={metrics.total ? `${Math.round(metrics.active / metrics.total * 100)}% of total` : 'No students yet'} tone="success" icon={<GraduationCap className="h-5 w-5" />} /><Metric label="Fee Outstanding" value={metrics.outstanding} note="Pending or partial" tone="warning" icon={<WalletCards className="h-5 w-5" />} /><Metric label="Academic At-Risk" value={metrics.atRisk} note="Average below 50%" tone="danger" icon={<AlertTriangle className="h-5 w-5" />} /></div>} toolbar={toolbar}>
    <DataTable columns={columns} data={filtered} keyExtractor={(student) => student.id} isLoading={state === 'loading'} error={state === 'error' ? 'Unable to load students' : undefined} onRetry={onRetry} pageSize={8} onRowClick={onOpenStudent} emptyTitle={query || classFilter !== 'ALL' || status !== 'ALL' || fee !== 'ALL' ? 'No matching students' : 'No students enrolled yet'} emptyDescription={query || classFilter !== 'ALL' || status !== 'ALL' || fee !== 'ALL' ? 'Try adjusting your search or filters.' : 'Enrol a student to begin building the school register.'} emptyAction={canCreate && !query && classFilter === 'ALL' && status === 'ALL' && fee === 'ALL' ? { label: 'Enrol first student', onClick: onEnrol } : undefined} caption="Students matching the current filters" mobileRenderer={(student) => <button type="button" className="ds-focus-ring w-full p-4 text-left" onClick={() => onOpenStudent(student.id)}><span className="flex items-center justify-between gap-3"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{student.firstName} {student.lastName}</span><span className="block text-xs text-[var(--color-text-secondary)]">{student.admissionNo} · {student.classLevel}{student.arm ? ` (${student.arm})` : ''}</span></span><StatusBadge status={student.status} /></span><span className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]"><span>Attendance <strong className="text-[var(--color-text-primary)]">{student.attendanceRate}%</strong></span><span>Fees <strong className="text-[var(--color-text-primary)]">{student.feesStatus}</strong></span></span></button>} />
  </ListPageLayout>;
};

export const StudentsPage: React.FC<{ studentPublicId?: string }> = ({ studentPublicId }) => {
  const { students, classes, refreshStudents, showToast, demoMode } = useApp();
  const { hasCapability } = useAccess();
  const navigate = useNavigate();
  const [wizard, setWizard] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const openStudent = (id: string) => navigate(buildRoute('school.people.students.profile', { studentPublicId: id }));
  return <><StudentsPageContent students={students} classes={classes} canCreate={demoMode || hasCapability('students.profile.create')} onOpenStudent={openStudent} onEnrol={() => setWizard(true)} onImport={() => setImportOpen(true)} onRetry={() => void refreshStudents()} /><StudentProfileView studentId={studentPublicId ?? null} fallback={students.find((item) => item.id === studentPublicId) ?? null} onClose={() => navigate(buildRoute('school.people.students'))} onUpdated={() => void refreshStudents()} showToast={showToast} /><StudentEnrolmentWizard isOpen={wizard} onClose={() => setWizard(false)} onComplete={(id) => { setWizard(false); void refreshStudents().then(() => openStudent(id)); }} showToast={showToast} canCreate={demoMode || hasCapability('students.profile.create')} /><Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import students" description="Upload a CSV containing student and guardian records."><label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-6 text-center"><Upload className="mb-3 h-6 w-6 text-[var(--color-action-primary)]" /><span className="text-sm font-semibold">Choose a CSV file</span><span className="mt-1 text-xs text-[var(--color-text-secondary)]">Records will be validated before import.</span><input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) { showToast('Import queued', `${file.name} will be validated before import.`, 'info'); setImportOpen(false); } }} /></label></Modal></>;
};
